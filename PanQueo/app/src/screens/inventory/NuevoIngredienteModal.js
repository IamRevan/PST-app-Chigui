import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Button, Input, ErrorMessage } from "../../components/ui";
import { SheetModal } from "../../components/ui/Modal";
import { spacing } from "../../lib/theme";
import apiClient from "../../lib/api/client";
import { ENDPOINTS } from "../../lib/api/endpoints";

/**
 * Modal para crear un nuevo ingrediente (RF-01).
 * El backend ya expone POST /inventario/ingredientes.
 */
export const NuevoIngredienteModal = ({ visible, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    nombre: "",
    unidad: "",
    minimo: "",
    categoria: "",
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (campo) => (valor) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!form.nombre.trim() || !form.unidad.trim()) {
      setError("El nombre y la unidad de medida son obligatorios.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiClient.post(ENDPOINTS.INVENTARIO, {
        nombre_ing: form.nombre.trim(),
        unidad_medida: form.unidad.trim(),
        stock_minimo: parseFloat(form.minimo) || 0,
        categoria: form.categoria.trim() || null,
      });
      setForm({ nombre: "", unidad: "", minimo: "", categoria: "" });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || "No se pudo crear el ingrediente");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SheetModal visible={visible} onClose={onClose} title="Nuevo Ingrediente">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.content}
      >
        <ErrorMessage message={error} />
        <Input
          label="Nombre del ingrediente"
          value={form.nombre}
          onChangeText={set("nombre")}
          placeholder="Ej: Esencia de Vainilla"
        />
        <Input
          label="Unidad de medida"
          value={form.unidad}
          onChangeText={set("unidad")}
          placeholder="Ej: L, kg, unidades"
        />
        <Input
          label="Stock mínimo (opcional)"
          value={form.minimo}
          onChangeText={set("minimo")}
          placeholder="0"
          keyboardType="decimal-pad"
        />
        <Input
          label="Categoría (opcional)"
          value={form.categoria}
          onChangeText={set("categoria")}
          placeholder="Ej: Lácteos"
        />
        <Button
          title={saving ? "Guardando..." : "Guardar Ingrediente"}
          variant="primary"
          onPress={handleSubmit}
          disabled={saving}
          style={styles.submit}
        />
      </ScrollView>
    </SheetModal>
  );
};

const styles = StyleSheet.create({
  content: { gap: spacing.sm, paddingBottom: spacing.lg },
  submit: { marginTop: spacing.xs },
});
