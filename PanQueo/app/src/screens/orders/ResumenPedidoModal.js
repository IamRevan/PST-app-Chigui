import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from "react-native";
import { Button, Input, Card } from "../../components/ui";
import { SheetModal } from "../../components/ui/Modal";
import { colors, typography, spacing, borderRadius } from "../../lib/theme";
import apiClient from "../../lib/api/client";
import { ENDPOINTS } from "../../lib/api/endpoints";
import { useCurrency } from "../../lib/currency";
import { useClientes } from "../../lib/hooks/useClientes";
import { MaterialIcons } from "@expo/vector-icons";

export const ResumenPedidoModal = ({
  visible,
  onClose,
  onSuccess,
  selected = [],
  total = 0,
  initialClienteId = "",
}) => {
  const [clienteId, setClienteId] = useState(initialClienteId);
  const [delivery, setDelivery] = useState(false);
  const [direccion, setDireccion] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState(
    new Date(Date.now() + 86400000).toISOString().split("T")[0],
  );
  const [saving, setSaving] = useState(false);
  const { format } = useCurrency();
  const { data: rawClientes } = useClientes();
  const clientes = Array.isArray(rawClientes) ? rawClientes : (rawClientes?.clientes || []);

  const [showClienteSelector, setShowClienteSelector] = useState(false);
  const [clienteSearch, setClienteSearch] = useState("");

  const clienteSeleccionado = clientes.find(
    (c) => String(c.id_cliente) === String(clienteId),
  );

  const clientesFiltrados = clientes.filter((c) => {
    if (!clienteSearch.trim()) return true;
    const texto = clienteSearch.toLowerCase();
    const nombre = `${c.nombre || ""} ${c.apellido || ""}`.toLowerCase();
    return (
      nombre.includes(texto) ||
      String(c.cedula || "").toLowerCase().includes(texto) ||
      String(c.telefono || "").includes(texto)
    );
  });

  const seleccionarCliente = (c) => {
    setClienteId(String(c.id_cliente));
    setShowClienteSelector(false);
    setClienteSearch("");
  };

  const handleSubmit = async () => {
    if (!clienteId) {
      Alert.alert("Error", "Se requiere el ID del cliente");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        id_cliente: clienteId,
        fecha_entrega: fechaEntrega,
        es_delivery: delivery,
        direccion_delivery: delivery ? direccion : null,
        observaciones: `Pedido de ${selected.length} recetas`,
        detalles: selected.map((p) => ({
          id_receta: p.id_receta,
          cantidad: p.cantidad,
          precio_unitario: p.precio_sugerido || 0,
        })),
      };
      await apiClient.post(ENDPOINTS.PEDIDOS, payload);
      onSuccess?.();
    } catch (err) {
      Alert.alert("Error", err.message || "Error al guardar el pedido");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SheetModal visible={visible} onClose={onClose} title="Resumen del Pedido">
      <View style={styles.content}>
        {selected.map((p) => (
          <View key={p.id_receta} style={styles.resumenRow}>
            <Text style={styles.resumenName}>
              {p.nombre_receta} x{p.cantidad}
            </Text>
            <Text style={styles.resumenPrice}>
              {format(parseFloat(p.precio_sugerido) * p.cantidad)}
            </Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalText}>Total</Text>
          <Text style={styles.totalValue}>{format(total)}</Text>
        </View>

        {/* Selector de cliente con búsqueda (paridad con view-select-client del MVP) */}
        <Text style={styles.fieldLabel}>Cliente</Text>
        <TouchableOpacity
          style={styles.clienteBtn}
          onPress={() => setShowClienteSelector(true)}
        >
          <View style={styles.clienteBtnLeft}>
            <MaterialIcons name="person" size={18} color={colors.onSurfaceVariant} />
            <Text
              style={[
                styles.clienteBtnText,
                !clienteSeleccionado && styles.clienteBtnPlaceholder,
              ]}
            >
              {clienteSeleccionado
                ? `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido || ""}`.trim()
                : "Seleccionar cliente (requerido)"}
            </Text>
          </View>
          <MaterialIcons name="expand-more" size={20} color={colors.onSurfaceVariant} />
        </TouchableOpacity>

        <Input
          label="Fecha de entrega"
          value={fechaEntrega}
          onChangeText={setFechaEntrega}
          placeholder="YYYY-MM-DD"
        />

        <TouchableOpacity
          style={styles.deliveryRow}
          onPress={() => setDelivery(!delivery)}
        >
          <View style={[styles.checkbox, delivery && styles.checkboxActive]}>
            {delivery && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.deliveryLabel}>Es delivery</Text>
        </TouchableOpacity>

        {delivery && (
          <Input
            label="Dirección de entrega"
            value={direccion}
            onChangeText={setDireccion}
            placeholder="Av. Principal, Casa #123"
          />
        )}

        <Button
          title={saving ? "Creando..." : "Confirmar Pedido"}
          onPress={handleSubmit}
          disabled={saving}
          style={styles.confirmBtn}
        />
      </View>

      <SheetModal
        visible={showClienteSelector}
        onClose={() => setShowClienteSelector(false)}
        title="Seleccionar Cliente"
      >
        <Input
          value={clienteSearch}
          onChangeText={setClienteSearch}
          placeholder="Buscar por nombre, cédula o teléfono"
        />
        <ScrollView style={styles.clienteList}>
          {clientesFiltrados.length === 0 && (
            <Text style={styles.clienteEmpty}>
              No hay clientes que coincidan con "{clienteSearch}"
            </Text>
          )}
          {clientesFiltrados.map((c) => (
            <TouchableOpacity
              key={c.id_cliente}
              style={[
                styles.clienteItem,
                String(c.id_cliente) === String(clienteId) && styles.clienteItemActive,
              ]}
              onPress={() => seleccionarCliente(c)}
            >
              <View style={styles.clienteItemLeft}>
                <Text style={styles.clienteName}>
                  {`${c.nombre} ${c.apellido || ""}`.trim()}
                </Text>
                <Text style={styles.clienteMeta}>
                  {c.telefono ? `📱 ${c.telefono}` : `Cédula ${c.cedula || "—"}`}
                </Text>
              </View>
              {String(c.id_cliente) === String(clienteId) && (
                <MaterialIcons name="check-circle" size={20} color={colors.onPrimaryContainer} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SheetModal>
    </SheetModal>
  );
};

const styles = StyleSheet.create({
  content: { gap: spacing.sm },
  resumenRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  resumenName: { ...typography.bodyMd, color: colors.onSurface },
  resumenPrice: {
    ...typography.bodyMd,
    fontWeight: "600",
    color: colors.onSurface,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
    marginBottom: spacing.sm,
  },
  totalText: { ...typography.titleSm, color: colors.onSurface },
  totalValue: { ...typography.titleSm, color: colors.primary },
  deliveryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primaryContainer,
  },
  checkmark: {
    fontSize: 12,
    color: colors.onPrimaryContainer,
    fontWeight: "700",
  },
  deliveryLabel: { ...typography.bodyMd, color: colors.onSurface },
  confirmBtn: { marginTop: spacing.md },
  fieldLabel: {
    ...typography.labelBold,
    color: colors.onSurface,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  clienteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceContainerLowest,
  },
  clienteBtnLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 1,
  },
  clienteBtnText: { ...typography.bodyMd, color: colors.onSurface },
  clienteBtnPlaceholder: { color: colors.onSurfaceVariant },
  clienteList: { maxHeight: 300 },
  clienteEmpty: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    padding: spacing.md,
  },
  clienteItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  clienteItemActive: { backgroundColor: colors.primaryContainer },
  clienteItemLeft: { flexShrink: 1, gap: 2 },
  clienteName: { ...typography.bodyMd, fontWeight: "600", color: colors.onSurface },
  clienteMeta: { ...typography.bodySm, color: colors.onSurfaceVariant },
});
