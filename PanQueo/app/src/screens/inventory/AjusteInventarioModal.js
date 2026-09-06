import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button, Input, ErrorMessage } from "../../components/ui";
import { SheetModal } from "../../components/ui/Modal";
import { colors, typography, spacing } from "../../lib/theme";
import apiClient from "../../lib/api/client";
import { ENDPOINTS } from "../../lib/api/endpoints";

export const AjusteInventarioModal = ({
  visible,
  onClose,
  onSuccess,
  initialLote = null,
}) => {
  const [nuevaCant, setNuevaCant] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!nuevaCant || !initialLote) {
      setError("Ingresa la nueva cantidad y asegura seleccionar un lote");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        id_lote: initialLote.id_lote || initialLote.id,
        nueva_cantidad: nuevaCant,
        motivo: motivo || "Ajuste manual",
      };
      await apiClient.post(ENDPOINTS.AJUSTE_INVENTARIO, payload);
      onSuccess?.();
      setNuevaCant("");
      setMotivo("");
      onClose();
    } catch (err) {
      setError(err.message || "Error al guardar el ajuste");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title="Ajuste Rápido de Inventario"
    >
      <View style={styles.content}>
        <ErrorMessage message={error} />

        {initialLote && (
          <View style={styles.loteInfo}>
            <Text style={styles.loteTitle}>
              Lote {initialLote.id_lote || initialLote.id}
            </Text>
            <Text style={styles.loteSubtitle}>
              Stock actual: {initialLote.cantidad_actual || initialLote.qty}
            </Text>
          </View>
        )}

        <Input
          label="Nueva Cantidad Física"
          value={nuevaCant}
          onChangeText={(v) => {
            setNuevaCant(v);
            setError(null);
          }}
          placeholder="Ej: 15"
          keyboardType="decimal-pad"
        />

        <Input
          label="Motivo (Opcional)"
          value={motivo}
          onChangeText={setMotivo}
          placeholder="Ej: Merma, Conteo..."
        />

        <Button
          title={saving ? "Guardando..." : "Confirmar Ajuste"}
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
  loteInfo: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.md,
    borderRadius: spacing.sm,
    marginBottom: spacing.xs,
  },
  loteTitle: { ...typography.labelBold, color: colors.primary },
  loteSubtitle: { ...typography.bodySm, color: colors.onSurfaceVariant },
  confirmBtn: { marginTop: spacing.sm },
});
