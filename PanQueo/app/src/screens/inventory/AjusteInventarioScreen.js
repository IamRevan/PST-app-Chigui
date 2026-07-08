import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Button, Input, Card, Badge, ErrorMessage } from '../../components/ui';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';

const LOTES = [
  { id_lote: 1, id_ingrediente: 1, cantidad_actual: 12.5, cantidad_inicial: 20, fecha_venc: '2025-12-31', Ingrediente: { nombre_ing: 'Harina de trigo', unidad_medida: 'kg' } },
  { id_lote: 2, id_ingrediente: 2, cantidad_actual: 5, cantidad_inicial: 10, fecha_venc: '2026-03-15', Ingrediente: { nombre_ing: 'Azúcar refinada', unidad_medida: 'kg' } },
  { id_lote: 3, id_ingrediente: 3, cantidad_actual: 200, cantidad_inicial: 300, fecha_venc: '2025-09-01', Ingrediente: { nombre_ing: 'Huevos', unidad_medida: 'pz' } },
  { id_lote: 4, id_ingrediente: 2, cantidad_actual: 8, cantidad_inicial: 10, fecha_venc: '2025-11-20', Ingrediente: { nombre_ing: 'Azúcar refinada', unidad_medida: 'kg' } },
];

export const AjusteInventarioScreen = ({ navigation }) => {
  const [selected, setSelected] = useState(null);
  const [nuevaCant, setNuevaCant] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = () => {
    if (!selected || !nuevaCant) {
      setError('Selecciona un lote e ingresa la nueva cantidad');
      return;
    }
    setSuccess(true);
    setTimeout(() => navigation?.goBack(), 2000);
  };

  if (success) {
    return (
      <ScreenWrapper>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Ajuste Realizado</Text>
          <Text style={styles.successDesc}>Inventario actualizado correctamente</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Ajuste de Inventario</Text>
        <Text style={styles.subtitle}>Selecciona el lote a ajustar</Text>

        <ErrorMessage message={error} />

        {LOTES.map((item) => (
          <TouchableOpacity
            key={item.id_lote}
            style={[styles.loteCard, selected?.id_lote === item.id_lote && styles.loteCardSelected]}
            onPress={() => { setSelected(item); setNuevaCant(''); setError(null); }}
            activeOpacity={0.7}
          >
            <View style={styles.loteHeader}>
              <Text style={styles.loteName}>{item.Ingrediente?.nombre_ing || `ID ${item.id_ingrediente}`}</Text>
              <Badge label={`L-${item.id_lote}`} variant="default" />
            </View>
            <View style={styles.loteDetails}>
              <View style={styles.loteStat}>
                <Text style={styles.statLabel}>Actual</Text>
                <Text style={styles.statValue}>{item.cantidad_actual} {item.Ingrediente?.unidad_medida || ''}</Text>
              </View>
              <View style={styles.loteStat}>
                <Text style={styles.statLabel}>Inicial</Text>
                <Text style={styles.statValue}>{item.cantidad_inicial} {item.Ingrediente?.unidad_medida || ''}</Text>
              </View>
              <View style={styles.loteStat}>
                <Text style={styles.statLabel}>Venc</Text>
                <Text style={styles.statValue}>{item.fecha_venc}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {selected && (
          <Card style={styles.formCard}>
            <Text style={styles.formTitle}>
              Ajustando: {selected.Ingrediente?.nombre_ing || `ID ${selected.id_ingrediente}`} (L-{selected.id_lote})
            </Text>
            <Input
              label="Nueva cantidad"
              value={nuevaCant}
              onChangeText={setNuevaCant}
              placeholder={`Actual: ${selected.cantidad_actual}`}
              keyboardType="decimal-pad"
            />
            <Input
              label="Motivo del ajuste"
              value={motivo}
              onChangeText={setMotivo}
              placeholder="Ej: Conteo cíclico, merma, etc."
            />
            <Button title="Confirmar Ajuste" onPress={handleSubmit} />
          </Card>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 40 },
  title: { ...typography.headlineMd, color: colors.onSurface },
  subtitle: { ...typography.bodySm, color: colors.onSurfaceVariant, marginBottom: spacing.md },
  loteCard: {
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  loteCardSelected: { borderColor: colors.primaryContainer, backgroundColor: `${colors.primaryContainer}15` },
  loteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  loteName: { ...typography.labelBold, color: colors.onSurface },
  loteDetails: { flexDirection: 'row', gap: spacing.md },
  loteStat: { flex: 1 },
  statLabel: { ...typography.metadata, color: colors.onSurfaceVariant },
  statValue: { ...typography.bodySm, fontWeight: '600', color: colors.onSurface },
  formCard: { marginTop: spacing.md, gap: spacing.md },
  formTitle: { ...typography.labelBold, color: colors.primary },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  successIcon: { fontSize: 64, marginBottom: spacing.md },
  successTitle: { ...typography.headlineMd, color: colors.tertiary },
  successDesc: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },
});
