import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Button, Input, Card } from "../../components/ui";
import { SheetModal } from "../../components/ui/Modal";
import { colors, typography, spacing } from "../../lib/theme";

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

  const handleSubmit = () => {
    setSaving(true);
    setTimeout(() => {
      onSuccess?.();
      setSaving(false);
    }, 800);
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
          label="ID del Cliente (opcional si es rápido)"
          value={clienteId}
          onChangeText={setClienteId}
          placeholder="ID numérico del cliente"
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
