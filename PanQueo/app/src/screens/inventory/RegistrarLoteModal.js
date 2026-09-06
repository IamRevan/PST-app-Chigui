import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Button, Input, ErrorMessage } from "../../components/ui";
import { SheetModal } from "../../components/ui/Modal";
import { colors, typography, spacing, borderRadius } from "../../lib/theme";
import apiClient from "../../lib/api/client";
import { ENDPOINTS } from "../../lib/api/endpoints";

export const RegistrarLoteModal = ({
  visible,
  onClose,
  onSuccess,
  initialIngredienteId = "",
}) => {
  const [form, setForm] = useState({
    cantidad_actual: "",
    fecha_venc: "",
    precio_compra: "",
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.cantidad_actual || !form.fecha_venc || !initialIngredienteId) {
      setError("Faltan datos requeridos o ingrediente no seleccionado");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        id_ingrediente: initialIngredienteId,
        cantidad_actual: form.cantidad_actual,
        fecha_ingreso: new Date().toISOString().split("T")[0],
        fecha_venc: form.fecha_venc,
      };
      await apiClient.post(ENDPOINTS.LOTES, payload);
      onSuccess?.();
      setForm({ cantidad_actual: "", fecha_venc: "", precio_compra: "" });
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar el lote');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title="Registrar Lote Rápido"
    >
      <View style={styles.content}>
        <ErrorMessage message={error} />

        {/* Usamos initialIngredienteId para mostrar el contexto, en app real lo buscaría */}
        {initialIngredienteId && (
          <Text style={styles.contextText}>
            Ingrediente seleccionado: ID {initialIngredienteId}
          </Text>
        )}

        <View style={styles.row}>
          <View style={styles.half}>
            <Input
              label="Cantidad"
              value={form.cantidad_actual}
              onChangeText={(v) => {
                setForm({ ...form, cantidad_actual: v });
                setError(null);
              }}
              placeholder="Ej: 10"
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.half}>
            <Input
              label="Precio (opc.)"
              value={form.precio_compra}
              onChangeText={(v) => {
                setForm({ ...form, precio_compra: v });
              }}
              placeholder="$ 0.00"
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <Input
          label="Vencimiento"
          value={form.fecha_venc}
          onChangeText={(v) => {
            setForm({ ...form, fecha_venc: v });
            setError(null);
          }}
          placeholder="YYYY-MM-DD"
        />

        <Text style={styles.infoText}>
          * Ingreso: Automático (Hoy) / Moneda: USD
        </Text>

        <Button
          title={saving ? "Guardando..." : "Confirmar Lote"}
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
  row: { flexDirection: "row", gap: spacing.md },
  half: { flex: 1 },
  contextText: {
    ...typography.bodySm,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.metadata,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  confirmBtn: {},
});
