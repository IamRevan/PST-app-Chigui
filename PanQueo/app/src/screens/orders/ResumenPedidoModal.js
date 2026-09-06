import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Button, Input, Card } from "../../components/ui";
import { SheetModal } from "../../components/ui/Modal";
import { colors, typography, spacing } from "../../lib/theme";
import apiClient from "../../lib/api/client";
import { ENDPOINTS } from "../../lib/api/endpoints";

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
              ${(parseFloat(p.precio_sugerido || 0) * p.cantidad).toFixed(2)}
            </Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalText}>Total</Text>
          <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
        </View>

        <Input
          label="ID del Cliente"
          value={clienteId}
          onChangeText={setClienteId}
          placeholder="Requerido: ID numérico del cliente"
          keyboardType="numeric"
        />
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
});
