import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Button, Input, ErrorMessage } from '../../components/ui';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';

const INGREDIENTES = [
  { id_ingrediente: '1', nombre_ing: 'Harina de trigo', unidad_medida: 'kg' },
  { id_ingrediente: '2', nombre_ing: 'Azúcar refinada', unidad_medida: 'kg' },
  { id_ingrediente: '3', nombre_ing: 'Huevos', unidad_medida: 'pz' },
  { id_ingrediente: '4', nombre_ing: 'Mantequilla', unidad_medida: 'kg' },
  { id_ingrediente: '5', nombre_ing: 'Leche entera', unidad_medida: 'L' },
  { id_ingrediente: '6', nombre_ing: 'Levadura seca', unidad_medida: 'g' },
  { id_ingrediente: '7', nombre_ing: 'Sal', unidad_medida: 'kg' },
  { id_ingrediente: '8', nombre_ing: 'Esencia de vainilla', unidad_medida: 'ml' },
];

export const RegistrarLoteScreen = ({ navigation }) => {
  const [form, setForm] = useState({
    id_ingrediente: '',
    cantidad_actual: '',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    fecha_venc: '',
    precio_compra_unitario: '',
    moneda: 'Bs',
  });
  const [error, setError] = useState(null);

  const handleSubmit = () => {
    if (!form.id_ingrediente || !form.cantidad_actual || !form.fecha_venc) {
      setError('Completa todos los campos requeridos');
      return;
    }
    if (new Date(form.fecha_venc) < new Date(form.fecha_ingreso)) {
      setError('La fecha de vencimiento debe ser posterior a la de ingreso');
      return;
    }
    navigation.navigate('LoteExitoso');
  };

  const selectedIng = INGREDIENTES.find((i) => i.id_ingrediente === form.id_ingrediente);

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Registrar Nuevo Lote</Text>

        <ErrorMessage message={error} />

        <Text style={styles.label}>Ingrediente</Text>
        <View style={styles.pickerGrid}>
          {INGREDIENTES.map((ing) => (
            <TouchableOpacity
              key={ing.id_ingrediente}
              style={[styles.pickerOption, form.id_ingrediente === ing.id_ingrediente && styles.pickerOptionActive]}
              onPress={() => setForm({ ...form, id_ingrediente: ing.id_ingrediente })}
            >
              <Text style={[styles.pickerText, form.id_ingrediente === ing.id_ingrediente && styles.pickerTextActive]}>
                {ing.nombre_ing}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Cantidad"
          value={form.cantidad_actual}
          onChangeText={(v) => setForm({ ...form, cantidad_actual: v })}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />

        <Input
          label="Unidad de medida"
          value={selectedIng?.unidad_medida || ''}
          editable={false}
          placeholder="Selecciona un ingrediente"
        />

        <Input
          label="Fecha de ingreso"
          value={form.fecha_ingreso}
          onChangeText={(v) => setForm({ ...form, fecha_ingreso: v })}
          placeholder="YYYY-MM-DD"
        />

        <Input
          label="Fecha de vencimiento"
          value={form.fecha_venc}
          onChangeText={(v) => setForm({ ...form, fecha_venc: v })}
          placeholder="YYYY-MM-DD"
        />

        <Input
          label="Precio de compra unitario"
          value={form.precio_compra_unitario}
          onChangeText={(v) => setForm({ ...form, precio_compra_unitario: v })}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />

        <View style={styles.monedaRow}>
          {['Bs', 'USD'].map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.monedaOption, form.moneda === m && styles.monedaOptionActive]}
              onPress={() => setForm({ ...form, moneda: m })}
            >
              <Text style={[styles.monedaText, form.moneda === m && styles.monedaTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button title="Registrar Lote" onPress={handleSubmit} style={styles.submitBtn} />
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 40 },
  title: { ...typography.headlineMd, color: colors.onSurface, marginBottom: spacing.lg },
  label: { ...typography.labelBold, color: colors.onSurface, marginBottom: spacing.sm },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  pickerOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pickerOptionActive: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primaryContainer,
  },
  pickerText: { ...typography.bodySm, color: colors.onSurfaceVariant },
  pickerTextActive: { color: colors.onPrimaryContainer, fontWeight: '600' },
  monedaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  monedaOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  monedaOptionActive: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primaryContainer,
  },
  monedaText: { ...typography.labelBold, color: colors.onSurfaceVariant },
  monedaTextActive: { color: colors.onPrimaryContainer },
  submitBtn: { marginTop: spacing.lg },
});
