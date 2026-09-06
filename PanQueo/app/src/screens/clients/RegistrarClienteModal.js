import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button, Input } from "../../components/ui";
import { SheetModal } from "../../components/ui/Modal";
import { colors, typography, spacing } from "../../lib/theme";

export const RegistrarClienteModal = ({ visible, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    cedula: "",
    telefono: "",
    direccion: "",
  });
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = () => {
    if (!form.nombre || !form.apellido || !form.cedula || !form.telefono) {
      setError("Completa todos los campos requeridos");
      return;
    }
    // Simulate save
    onSuccess?.(form);
    setForm({
      nombre: "",
      apellido: "",
      cedula: "",
      telefono: "",
      direccion: "",
    });
    onClose();
  };

  return (
    <SheetModal visible={visible} onClose={onClose} title="Registrar Cliente">
      <View style={styles.content}>
        {error && <Text style={styles.errorText}>{error}</Text>}

        <Input
          label="Nombre"
          value={form.nombre}
          onChangeText={(v) => handleChange("nombre", v)}
          placeholder="Ej: Maria"
        />
        <Input
          label="Apellido"
          value={form.apellido}
          onChangeText={(v) => handleChange("apellido", v)}
          placeholder="Ej: Lopez"
        />
        <Input
          label="Cédula"
          value={form.cedula}
          onChangeText={(v) => handleChange("cedula", v)}
          placeholder="Ej: 25.889.001"
        />
        <Input
          label="Teléfono"
          value={form.telefono}
          onChangeText={(v) => handleChange("telefono", v)}
          placeholder="+58 412 000 0000"
          keyboardType="phone-pad"
        />
        <Input
          label="Dirección"
          value={form.direccion}
          onChangeText={(v) => handleChange("direccion", v)}
          placeholder="Av. Principal..."
        />

        <View style={styles.actions}>
          <Button
            title={"Guardar Cliente"}
            onPress={handleSubmit}
            style={styles.saveBtn}
          />
          <Button
            title="Cancelar"
            variant="outline"
            onPress={onClose}
            style={styles.cancelBtn}
          />
        </View>
      </View>
    </SheetModal>
  );
};

const styles = StyleSheet.create({
  content: { gap: spacing.sm },
  errorText: {
    ...typography.bodySm,
    color: colors.error,
    marginBottom: spacing.xs,
  },
  actions: { gap: spacing.sm, marginTop: spacing.md },
  saveBtn: {},
  cancelBtn: { borderWidth: 1, borderColor: colors.outline },
});
