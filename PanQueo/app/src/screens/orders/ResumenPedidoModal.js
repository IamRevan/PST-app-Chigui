import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Button, Input } from "../../components/ui";
import { SheetModal, CenterModal } from "../../components/ui/Modal";
import { colors, typography, spacing, borderRadius } from "../../lib/theme";
import apiClient from "../../lib/api/client";
import { ENDPOINTS } from "../../lib/api/endpoints";
import { useCurrency } from "../../lib/currency";
import { useClientes } from "../../lib/hooks/useClientes";

const ESTADOS_PAGO_OPTS = [
  { key: "Pendiente", label: "Pendiente", icon: "pending" },
  { key: "Abonado", label: "Abonado", icon: "payments" },
  { key: "Pagado", label: "Pagado Completo", icon: "check-circle" },
];

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
  const [estadoPago, setEstadoPago] = useState("Pendiente");
  const [montoAbonado, setMontoAbonado] = useState("");
  const [saving, setSaving] = useState(false);
  const [validatingStock, setValidatingStock] = useState(false);
  const [stockFaltantes, setStockFaltantes] = useState(null);

  const { format, formatDual } = useCurrency();
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

  /**
   * Validación preventiva de stock en frontend con FIFO (homologada con app.js web):
   * La API `/recetas/:id/verificar-stock` verifica por 1 porción; aquí multiplicamos
   * porción * cantidad pedida y alertamos si algún ingrediente no cubre el lote.
   */
  const verificarStockPreventivo = async () => {
    setValidatingStock(true);
    try {
      const checks = await Promise.all(
        selected.map(async (item) => {
          try {
            const res = await apiClient.get(
              ENDPOINTS.RECETA_VERIFICAR_STOCK(item.id_receta),
            );
            return {
              receta: item.nombre_receta || `Receta #${item.id_receta}`,
              cantidad: item.cantidad,
              detalles: res.data?.data?.detalles || res.data?.detalles || [],
            };
          } catch {
            return { receta: item.nombre_receta, cantidad: item.cantidad, detalles: [] };
          }
        }),
      );

      const faltantes = [];
      checks.forEach(({ receta, cantidad, detalles }) => {
        detalles.forEach((x) => {
          const req = cantidad * parseFloat(x.requerido || 0);
          const disp = parseFloat(x.disponible || 0);
          if (req > disp) {
            faltantes.push({
              ingrediente: x.ingrediente || `Ingrediente #${x.id_ingrediente}`,
              receta,
              requerido: req,
              disponible: disp,
            });
          }
        });
      });

      return faltantes;
    } finally {
      setValidatingStock(false);
    }
  };

  const handleSubmit = async () => {
    if (!clienteId) {
      Alert.alert("Cliente requerido", "Selecciona un cliente para registrar el pedido.");
      return;
    }
    if (!fechaEntrega.trim()) {
      Alert.alert("Fecha requerida", "Indica la fecha programada de entrega.");
      return;
    }

    // 1. Verificación preventiva FIFO
    const faltantes = await verificarStockPreventivo();
    if (faltantes.length > 0) {
      setStockFaltantes(faltantes);
      return;
    }

    // 2. Registro de pedido en backend
    setSaving(true);
    try {
      const detalles = selected.map((p) => ({
        id_receta: p.id_receta,
        cantidad: p.cantidad,
        precio_unitario: p.precio_unitario != null ? p.precio_unitario : p.precio_sugerido || 0,
      }));

      const abonoNum = estadoPago === "Pagado"
        ? total
        : estadoPago === "Abonado"
          ? parseFloat(montoAbonado) || 0
          : 0;

      const payload = {
        id_cliente: Number(clienteId),
        fecha_entrega: fechaEntrega,
        estado_pago: estadoPago,
        monto_abonado: abonoNum,
        costo_total: total,
        es_delivery: delivery,
        direccion_delivery: delivery ? direccion.trim() : null,
        observaciones: `Pedido de ${selected.length} recetas`,
        detalles,
      };

      await apiClient.post(ENDPOINTS.PEDIDOS, payload);
      onSuccess?.();
    } catch (err) {
      Alert.alert("Error al guardar", err.message || "No se pudo crear el pedido");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SheetModal visible={visible} onClose={onClose} title="Confirmar Pedido">
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {/* Líneas de pedido */}
          <Text style={styles.sectionHeader}>Resumen de Productos</Text>
          {selected.map((p) => {
            const precioU = parseFloat(p.precio_unitario != null ? p.precio_unitario : p.precio_sugerido) || 0;
            return (
              <View key={p.id_receta} style={styles.resumenRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resumenName}>{p.nombre_receta}</Text>
                  <Text style={styles.resumenQty}>
                    {p.cantidad} × {formatDual(precioU)}
                  </Text>
                </View>
                <Text style={styles.resumenPrice}>{formatDual(precioU * p.cantidad)}</Text>
              </View>
            );
          })}

          <View style={styles.totalRow}>
            <Text style={styles.totalText}>Total General</Text>
            <Text style={styles.totalValue}>{formatDual(total)}</Text>
          </View>

          {/* Selector de Cliente */}
          <Text style={styles.sectionHeader}>Cliente</Text>
          <TouchableOpacity
            style={styles.clienteBtn}
            onPress={() => setShowClienteSelector(true)}
            activeOpacity={0.7}
          >
            <View style={styles.clienteBtnLeft}>
              <MaterialIcons name="person" size={20} color={colors.primary} />
              <Text
                style={[
                  styles.clienteBtnText,
                  !clienteSeleccionado && styles.clienteBtnPlaceholder,
                ]}
              >
                {clienteSeleccionado
                  ? `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido || ""}`.trim()
                  : "Toca para seleccionar cliente..."}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
          </TouchableOpacity>

          {/* Fecha de Entrega */}
          <Input
            label="Fecha programada de entrega"
            value={fechaEntrega}
            onChangeText={setFechaEntrega}
            placeholder="YYYY-MM-DD"
          />

          {/* Delivery */}
          <TouchableOpacity
            style={styles.checkRow}
            onPress={() => setDelivery(!delivery)}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={delivery ? "check-box" : "check-box-outline-blank"}
              size={22}
              color={delivery ? colors.primary : colors.outline}
            />
            <Text style={styles.checkLabel}>¿Requiere entrega a domicilio (delivery)?</Text>
          </TouchableOpacity>

          {delivery && (
            <Input
              label="Dirección de entrega"
              value={direccion}
              onChangeText={setDireccion}
              placeholder="Calle, punto de referencia o sector..."
            />
          )}

          {/* Estado de Pago y Abonos */}
          <Text style={styles.sectionHeader}>Estado del Pago</Text>
          <View style={styles.pagoOptionsRow}>
            {ESTADOS_PAGO_OPTS.map((opt) => {
              const active = estadoPago === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.pagoBtn, active && styles.pagoBtnActive]}
                  onPress={() => setEstadoPago(opt.key)}
                >
                  <MaterialIcons
                    name={opt.icon}
                    size={16}
                    color={active ? colors.white : colors.onSurface}
                  />
                  <Text style={[styles.pagoBtnText, active && styles.pagoBtnTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {estadoPago === "Abonado" && (
            <View style={{ marginTop: 4 }}>
              <Input
                label="Monto abonado ($)"
                value={montoAbonado}
                onChangeText={setMontoAbonado}
                keyboardType="numeric"
                placeholder="0.00"
              />
            </View>
          )}

          <Button
            title={
              validatingStock
                ? "Verificando Stock FIFO..."
                : saving
                  ? "Guardando Pedido..."
                  : `Confirmar Pedido (${format(total)})`
            }
            variant="primary"
            onPress={handleSubmit}
            disabled={saving || validatingStock}
            style={styles.submitBtn}
          />
        </ScrollView>
      </SheetModal>

      {/* Modal de Selector de Clientes */}
      <SheetModal
        visible={showClienteSelector}
        onClose={() => setShowClienteSelector(false)}
        title="Seleccionar Cliente"
      >
        <View style={styles.selectorContainer}>
          <View style={styles.selectorSearch}>
            <MaterialIcons name="search" size={20} color={colors.outline} />
            <TextInput
              style={styles.selectorInput}
              placeholder="Buscar por nombre, CI o teléfono..."
              placeholderTextColor={colors.outline}
              value={clienteSearch}
              onChangeText={setClienteSearch}
            />
          </View>
          <ScrollView style={{ maxHeight: 360 }}>
            {clientesFiltrados.map((c) => (
              <TouchableOpacity
                key={c.id_cliente}
                style={[
                  styles.clientOption,
                  String(c.id_cliente) === String(clienteId) && styles.clientOptionActive,
                ]}
                onPress={() => seleccionarCliente(c)}
              >
                <View style={styles.clientAvatar}>
                  <Text style={styles.clientAvatarText}>
                    {(c.nombre || "?").charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.clientName}>
                    {c.nombre} {c.apellido || ""}
                  </Text>
                  <Text style={styles.clientMeta}>
                    CI: {c.cedula || "—"} · Tel: {c.telefono || "—"}
                  </Text>
                </View>
                {String(c.id_cliente) === String(clienteId) && (
                  <MaterialIcons name="check" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </SheetModal>

      {/* Modal de Error de Stock FIFO (Paridad view-stock-error web) */}
      <CenterModal
        visible={!!stockFaltantes}
        onClose={() => setStockFaltantes(null)}
        title="⚠️ Stock Insuficiente (FIFO)"
      >
        <Text style={styles.stockErrorDesc}>
          No hay suficientes materias primas en el inventario para procesar las cantidades solicitadas:
        </Text>
        <ScrollView style={{ maxHeight: 220, marginVertical: spacing.sm }}>
          {(stockFaltantes || []).map((f, i) => (
            <View key={i} style={styles.stockErrorCard}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <MaterialIcons name="remove-shopping-cart" size={16} color={colors.error} />
                <Text style={styles.stockErrorIng}>{f.ingrediente}</Text>
              </View>
              <Text style={styles.stockErrorReceta}>Para: {f.receta}</Text>
              <Text style={styles.stockErrorNumbers}>
                Disponible: <Text style={{ color: colors.error, fontWeight: "700" }}>{f.disponible}</Text> · Requerido: <Text style={{ color: colors.primary, fontWeight: "700" }}>{f.requerido}</Text>
              </Text>
            </View>
          ))}
        </ScrollView>
        <Button
          title="Revisar Cantidades"
          variant="primary"
          onPress={() => setStockFaltantes(null)}
          style={{ marginTop: spacing.xs }}
        />
      </CenterModal>
    </>
  );
};

const styles = StyleSheet.create({
  container: { maxHeight: 540 },
  content: { paddingBottom: spacing.xl, gap: spacing.sm },
  sectionHeader: {
    ...typography.labelBold,
    fontSize: 12,
    color: colors.primary,
    textTransform: "uppercase",
    marginTop: spacing.xs,
  },
  resumenRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  resumenName: { ...typography.bodySm, fontWeight: "600", color: colors.onSurface },
  resumenQty: { ...typography.metadata, color: colors.onSurfaceVariant, fontSize: 11 },
  resumenPrice: { ...typography.labelBold, color: colors.onSurface, fontSize: 13 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: `${colors.primaryContainer}20`,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    marginVertical: 4,
  },
  totalText: { ...typography.labelBold, color: colors.onSurface, fontSize: 14 },
  totalValue: { ...typography.headlineMd, color: colors.primary, fontSize: 16 },
  clienteBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 46,
  },
  clienteBtnLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  clienteBtnText: { ...typography.bodySm, color: colors.onSurface, fontWeight: "500" },
  clienteBtnPlaceholder: { color: colors.outline },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  checkLabel: { ...typography.bodySm, color: colors.onSurface, fontSize: 13 },
  pagoOptionsRow: { flexDirection: "row", gap: 6 },
  pagoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    height: 38,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  pagoBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pagoBtnText: { ...typography.labelCaption, fontSize: 11, fontWeight: "600", color: colors.onSurface },
  pagoBtnTextActive: { color: colors.white },
  submitBtn: { marginTop: spacing.md },
  selectorContainer: { gap: spacing.sm, paddingBottom: spacing.lg },
  selectorSearch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  selectorInput: { flex: 1, fontSize: 14, color: colors.onSurface },
  clientOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  clientOptionActive: { backgroundColor: `${colors.primaryContainer}25` },
  clientAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerHighest,
    justifyContent: "center",
    alignItems: "center",
  },
  clientAvatarText: { ...typography.labelBold, color: colors.primary, fontSize: 14 },
  clientName: { ...typography.bodySm, fontWeight: "600", color: colors.onSurface },
  clientMeta: { ...typography.metadata, color: colors.onSurfaceVariant, fontSize: 11 },
  stockErrorDesc: { ...typography.bodySm, color: colors.onSurfaceVariant, fontSize: 13 },
  stockErrorCard: {
    backgroundColor: "rgba(255,82,82,0.08)",
    padding: 10,
    borderRadius: borderRadius.md,
    marginBottom: 6,
    gap: 2,
  },
  stockErrorIng: { ...typography.labelBold, color: colors.onSurface, fontSize: 13 },
  stockErrorReceta: { ...typography.metadata, color: colors.onSurfaceVariant, fontSize: 11 },
  stockErrorNumbers: { ...typography.labelCaption, fontSize: 12, marginTop: 2 },
});
