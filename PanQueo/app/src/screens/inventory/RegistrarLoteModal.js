import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Button, Input, ErrorMessage } from "../../components/ui";
import { SheetModal } from "../../components/ui/Modal";
import { colors, typography, spacing, borderRadius } from "../../lib/theme";
import apiClient from "../../lib/api/client";
import { ENDPOINTS } from "../../lib/api/endpoints";

/**
 * Modal de registro de lotes (RF-01).
 * - Recibe `ingredientes` para permitirle al pastelero elegir (o buscar) el ingrediente.
 * - Si se abre desde un ítem específico, viene con `initialIngredienteId` preseleccionado.
 */
export const RegistrarLoteModal = ({
  visible,
  onClose,
  onSuccess,
  initialIngredienteId = "",
  ingredientes = [],
}) => {
  const [ingredienteId, setIngredienteId] = useState(initialIngredienteId);
  const [ingSearch, setIngSearch] = useState("");
  const [showSelector, setShowSelector] = useState(false);
  const [form, setForm] = useState({
    cantidad_actual: "",
    fecha_venc: "",
    precio_compra: "",
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setIngredienteId(initialIngredienteId || "");
      setError(null);
    }
  }, [visible, initialIngredienteId]);

  // Sincronizar si el screen destino cambia el ingrediente inicial
  const ingredienteActual = ingredientes.find(
    (i) => String(i.id_ingrediente) === String(ingredienteId),
  );

  const ingredientesFiltrados = ingredientes.filter((i) => {
    if (!ingSearch.trim()) return true;
    return (i.nombre_ing || "").toLowerCase().includes(ingSearch.toLowerCase());
  });

  const handleSubmit = async () => {
    if (!form.cantidad_actual || !form.fecha_venc || !ingredienteId) {
      setError("Faltan datos requeridos o ingrediente no seleccionado");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        id_ingrediente: Number(ingredienteId),
        cantidad_actual: parseFloat(form.cantidad_actual),
        cantidad_inicial: parseFloat(form.cantidad_actual),
        fecha_ingreso: new Date().toISOString().split("T")[0],
        fecha_venc: form.fecha_venc,
      };
      // Regla 3FN: el precio se registra por lote para reportes de costo
      if (form.precio_compra) {
        payload.precio_compra_unitario = parseFloat(form.precio_compra);
      }
      await apiClient.post(ENDPOINTS.LOTES, payload);
      onSuccess?.();
      setForm({ cantidad_actual: "", fecha_venc: "", precio_compra: "" });
      setIngredienteId(initialIngredienteId || "");
      onClose();
    } catch (err) {
      setError(err.message || "Error al guardar el lote");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title="Registrar Nuevo Lote"
    >
      <View style={styles.content}>
        <ErrorMessage message={error} />

        <Text style={styles.fieldLabel}>Ingrediente</Text>
        <TouchableOpacity
          style={styles.selectorBtn}
          onPress={() => setShowSelector(true)}
          activeOpacity={0.7}
        >
          <View style={styles.selectorBtnLeft}>
            <MaterialIcons name="inventory" size={18} color={colors.onSurfaceVariant} />
            <Text
              style={[
                styles.selectorBtnText,
                !ingredienteActual && styles.selectorBtnPlaceholder,
              ]}
            >
              {ingredienteActual
                ? ingredienteActual.nombre_ing
                : "Seleccionar ingrediente"}
            </Text>
          </View>
          <MaterialIcons name="expand-more" size={20} color={colors.onSurfaceVariant} />
        </TouchableOpacity>

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
              label="Vencimiento"
              value={form.fecha_venc}
              onChangeText={(v) => {
                setForm({ ...form, fecha_venc: v });
                setError(null);
              }}
              placeholder="YYYY-MM-DD"
            />
          </View>
        </View>

        <Input
          label="Precio de compra (USD, opcional)"
          value={form.precio_compra}
          onChangeText={(v) => {
            setForm({ ...form, precio_compra: v });
          }}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />

        <Text style={styles.infoText}>
          * Fecha de ingreso automática (Hoy). Precio unitario base en USD para auditoría y simulador de costos.
        </Text>

        <Button
          title={saving ? "Guardando Lote..." : "Confirmar y Guardar Lote"}
          variant="primary"
          onPress={handleSubmit}
          disabled={saving}
          style={styles.confirmBtn}
        />
      </View>

      <SheetModal
        visible={showSelector}
        onClose={() => setShowSelector(false)}
        title="Seleccionar Ingrediente"
      >
        <Input
          value={ingSearch}
          onChangeText={setIngSearch}
          placeholder="Buscar ingrediente..."
        />
        <ScrollView style={styles.selectorList}>
          {ingredientesFiltrados.length === 0 && (
            <Text style={styles.selectorEmpty}>
              No hay ingredientes que coincidan
            </Text>
          )}
          {ingredientesFiltrados.map((i) => (
            <TouchableOpacity
              key={i.id_ingrediente}
              style={[
                styles.selectorItem,
                String(i.id_ingrediente) === String(ingredienteId) &&
                  styles.selectorItemActive,
              ]}
              onPress={() => {
                setIngredienteId(i.id_ingrediente);
                setShowSelector(false);
                setIngSearch("");
              }}
            >
              <View style={styles.selectorItemLeft}>
                <Text style={styles.selectorItemName}>{i.nombre_ing}</Text>
                <Text style={styles.selectorItemMeta}>
                  Stock actual: {parseFloat(i.stock_actual ?? 0)} {i.unidad_medida}
                </Text>
              </View>
              {String(i.id_ingrediente) === String(ingredienteId) && (
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
  row: { flexDirection: "row", gap: spacing.md },
  half: { flex: 1 },
  fieldLabel: {
    ...typography.labelBold,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  selectorBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 46,
    backgroundColor: colors.surfaceContainerLow,
    marginBottom: spacing.xs,
  },
  selectorBtnLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 1,
  },
  selectorBtnText: { ...typography.bodyMd, color: colors.onSurface },
  selectorBtnPlaceholder: { color: colors.onSurfaceVariant },
  selectorList: { maxHeight: 300 },
  selectorEmpty: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    padding: spacing.md,
  },
  selectorItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  selectorItemActive: { backgroundColor: colors.primaryContainer },
  selectorItemLeft: { flexShrink: 1, gap: 2 },
  selectorItemName: {
    ...typography.bodyMd,
    fontWeight: "600",
    color: colors.onSurface,
  },
  selectorItemMeta: { ...typography.bodySm, color: colors.onSurfaceVariant },
  infoText: {
    ...typography.metadata,
    color: colors.onSurfaceVariant,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  confirmBtn: { marginTop: spacing.xs },
});
