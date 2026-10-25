import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Button, Input, ErrorMessage } from "../../components/ui";
import { SheetModal } from "../../components/ui/Modal";
import { colors, typography, spacing, borderRadius } from "../../lib/theme";
import apiClient from "../../lib/api/client";
import { ENDPOINTS } from "../../lib/api/endpoints";

export const AjusteInventarioModal = ({
  visible,
  onClose,
  onSuccess,
  initialLote = null,
  lote = null,
  ingrediente = null,
}) => {
  const activeLote = lote || initialLote;
  const [nuevaCant, setNuevaCant] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (activeLote) {
      setNuevaCant(String(activeLote.cantidad_actual || ""));
    }
  }, [activeLote]);

  const handleSubmit = async () => {
    if (!activeLote) {
      setError("Debes seleccionar un lote específico para ajustar su cantidad física.");
      return;
    }
    const cantNum = parseFloat(nuevaCant);
    if (!Number.isFinite(cantNum) || cantNum < 0) {
      setError("Ingresa una cantidad válida mayor o igual a 0.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        id_lote: activeLote.id_lote || activeLote.id,
        nueva_cantidad: cantNum,
        motivo: motivo.trim() || "Ajuste manual de inventario",
      };
      const res = await apiClient.post(ENDPOINTS.AJUSTE_INVENTARIO, payload);
      const anomalia = res.data?.data?.anomalia;
      if (anomalia) {
        Alert.alert("Aviso de Desviación", anomalia.mensaje);
      }
      onSuccess?.();
      setNuevaCant("");
      setMotivo("");
      onClose();
    } catch (err) {
      setError(err.message || "Error al registrar el ajuste de inventario");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title="Ajuste de Inventario Físico"
    >
      <View style={styles.content}>
        <ErrorMessage message={error} />

        {activeLote ? (
          <View style={styles.loteInfo}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <MaterialIcons name="inventory" size={18} color={colors.primary} />
              <Text style={styles.loteTitle}>
                Lote #{activeLote.id_lote || activeLote.id} {ingrediente?.nombre_ing ? `· ${ingrediente.nombre_ing}` : ""}
              </Text>
            </View>
            <Text style={styles.loteSubtitle}>
              Stock registrado en sistema: {activeLote.cantidad_actual} {ingrediente?.unidad_medida || "uds"}
            </Text>
          </View>
        ) : (
          <Text style={styles.noLoteWarning}>
            Selecciona un lote de la lista para registrar el ajuste físico.
          </Text>
        )}

        <Input
          label="Nueva Cantidad Física en Existencia"
          value={nuevaCant}
          onChangeText={(v) => {
            setNuevaCant(v);
            setError(null);
          }}
          keyboardType="numeric"
          placeholder="0.00"
        />

        <Input
          label="Motivo o Justificación del Ajuste"
          value={motivo}
          onChangeText={setMotivo}
          placeholder="Ej: Merma por rotura, vencimiento o conteo físico"
        />

        <Button
          title={saving ? "Guardando Ajuste..." : "Confirmar Ajuste de Stock"}
          variant="primary"
          onPress={handleSubmit}
          disabled={saving || !activeLote}
          style={styles.submitBtn}
        />
      </View>
    </SheetModal>
  );
};

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.lg, gap: spacing.sm },
  loteInfo: {
    backgroundColor: `${colors.primaryContainer}20`,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: `${colors.primaryContainer}50`,
    gap: 4,
  },
  loteTitle: { ...typography.labelBold, color: colors.primary, fontSize: 13 },
  loteSubtitle: { ...typography.metadata, color: colors.onSurfaceVariant, fontSize: 11 },
  noLoteWarning: { ...typography.bodySm, color: colors.error, fontStyle: "italic" },
  submitBtn: { marginTop: spacing.xs },
});
