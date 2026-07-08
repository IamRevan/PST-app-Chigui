import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Button, Input } from '../../components/ui';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';

export const RegistrarClienteScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    nombre: '', apellido: '', cedula: '', telefono: '', direccion: '',
  });
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = () => {
    if (!form.nombre || !form.apellido || !form.cedula || !form.telefono) {
      setError('Completa todos los campos requeridos');
      return;
    }
    navigation.navigate('Clientes');
  };

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Registrar Cliente</Text>
        <Text style={styles.subtitle}>Ingresa los datos del nuevo cliente</Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.card}>
          <Input label="Nombre" value={form.nombre} onChangeText={(v) => handleChange('nombre', v)} placeholder="Ej: Maria" />
          <Input label="Apellido" value={form.apellido} onChangeText={(v) => handleChange('apellido', v)} placeholder="Ej: Lopez" />
          <Input label="Cédula" value={form.cedula} onChangeText={(v) => handleChange('cedula', v)} placeholder="Ej: 25.889.001" />
          <Input label="Teléfono" value={form.telefono} onChangeText={(v) => handleChange('telefono', v)} placeholder="+58 412 000 0000" keyboardType="phone-pad" />
          <Input label="Dirección" value={form.direccion} onChangeText={(v) => handleChange('direccion', v)} placeholder="Av. Principal, Edificio..." />

          <View style={styles.actions}>
            <Button title={'Guardar Cliente'} onPress={handleSubmit} style={styles.saveBtn} />
            <Button title="Cancelar" variant="outline" onPress={() => navigation.goBack()} style={styles.cancelBtn} />
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 40 },
  header: { marginBottom: spacing.lg, alignItems: 'center' },
  backBtn: { alignSelf: 'flex-start', marginBottom: spacing.sm },
  backIcon: { fontSize: 24, color: colors.onSurface },
  logoArea: { alignItems: 'center', gap: spacing.xs },
  logoCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  logoEmoji: { fontSize: 32 },
  title: { ...typography.headlineMd, color: colors.primary, textAlign: 'center' },
  subtitle: { ...typography.bodySm, color: colors.onSurfaceVariant, textAlign: 'center', paddingHorizontal: spacing.md },
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: borderRadius.xl, padding: spacing.xl, gap: spacing.md, ...shadows.md, borderWidth: 1, borderColor: colors.surfaceContainer },
  row: { flexDirection: 'row', gap: spacing.md },
  halfField: { flex: 1 },
  field: { gap: spacing.xs },
  label: { ...typography.labelBold, color: colors.onSurfaceVariant, paddingHorizontal: spacing.xs },
  input: { borderBottomWidth: 1, borderBottomColor: colors.outlineVariant, paddingVertical: spacing.base, ...typography.bodyMd, color: colors.onSurface },
  inputWithIcon: { flexDirection: 'row', alignItems: 'center' },
  inputIcon: { fontSize: 20, color: '#757575', marginRight: spacing.base },
  inputIconPadding: { flex: 1 },
  errorText: { ...typography.bodySm, color: colors.error, marginTop: spacing.xs },
  actions: { gap: spacing.sm, marginTop: spacing.lg },
  saveBtn: {},
  cancelBtn: { borderWidth: 1, borderColor: colors.outline },
});
