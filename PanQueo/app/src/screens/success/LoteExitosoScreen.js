import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Button } from '../../components/ui';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';

export const LoteExitosoScreen = ({ navigation }) => {
  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.successIcon}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>✅</Text>
          </View>
        </View>

        <Text style={styles.title}>¡Ajuste Realizado con Éxito!</Text>
        <Text style={styles.subtitle}>El stock ha sido actualizado correctamente.</Text>

        <View style={styles.summaryCard}>
          <View style={styles.productRow}>
            <View style={styles.productIcon}>
              <Text style={styles.productEmoji}>🍩</Text>
            </View>
            <View>
              <Text style={styles.productName}>Donas de Chocolate Glaseadas</Text>
              <Text style={styles.productSku}>SKU: DON-01</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailsRow}>
            <View>
              <Text style={styles.detailLabel}>Tipo de Ajuste</Text>
              <View style={styles.detailChip}>
                <Text style={styles.detailChipIcon}>➕</Text>
                <Text style={styles.detailChipText}>Entrada (+50)</Text>
              </View>
            </View>
            <View>
              <Text style={styles.detailLabel}>Stock Actualizado</Text>
              <View style={styles.stockBadge}>
                <Text style={styles.stockText}>200 UND</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.logNotice}>
          <Text style={styles.logIcon}>📝</Text>
          <Text style={styles.logText}>El cambio ha sido registrado en el log de inventario.</Text>
        </View>

        <View style={styles.actions}>
          <Button title="Ver Inventario General" variant="primary" onPress={() => navigation.navigate('Inventario')} />
          <Button title="Realizar otro ajuste" variant="outline" onPress={() => navigation.goBack()} />
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.gutter, gap: spacing.md },
  successIcon: { marginBottom: spacing.md },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.tertiaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  iconEmoji: { fontSize: 48 },
  title: { ...typography.headlineMd, color: colors.onSurface, textAlign: 'center' },
  subtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },
  summaryCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    gap: spacing.md,
    ...shadows.md,
    borderWidth: 1,
    borderColor: `${colors.outlineVariant}4D`,
  },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  productIcon: { width: 64, height: 64, borderRadius: borderRadius.lg, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  productEmoji: { fontSize: 32 },
  productName: { ...typography.titleSm, color: colors.onSurface },
  productSku: { ...typography.bodySm, color: colors.onSurfaceVariant, fontWeight: '600', textTransform: 'uppercase' },
  divider: { height: 1, backgroundColor: `${colors.outlineVariant}4D` },
  detailsRow: { flexDirection: 'row', gap: spacing.md },
  detailLabel: { ...typography.bodySm, color: colors.onSurfaceVariant },
  detailChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  detailChipIcon: { fontSize: 14, color: colors.tertiary, fontWeight: '700' },
  detailChipText: { ...typography.labelBold, color: colors.tertiary },
  stockBadge: { backgroundColor: colors.primaryContainer, paddingHorizontal: spacing.base, paddingVertical: spacing.xs, borderRadius: borderRadius.md, marginTop: spacing.xs, alignSelf: 'flex-start' },
  stockText: { ...typography.labelBold, color: colors.onPrimaryContainer },
  logNotice: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  logIcon: { fontSize: 16 },
  logText: { ...typography.bodySm, color: colors.onSurfaceVariant },
  actions: { width: '100%', gap: spacing.sm, marginTop: spacing.md },
});
