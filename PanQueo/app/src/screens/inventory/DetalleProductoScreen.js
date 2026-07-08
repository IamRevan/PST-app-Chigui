import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Button } from '../../components/ui';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';

const LOTS = [
  { id: 'LT-10293', qty: '12.5 kg', ingress: '15 May 2023', expiry: '10 Oct 2023', status: 'Vencido', expired: true },
  { id: 'LT-10350', qty: '15.0 kg', ingress: '22 Jul 2023', expiry: '15 Mar 2024', status: 'Vigente', expired: false },
  { id: 'LT-10412', qty: '15.0 kg', ingress: '05 Sep 2023', expiry: '20 Dec 2024', status: 'Vigente', expired: false },
];

export const DetalleProductoScreen = ({ navigation }) => {
  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.logoRow}>
            <Text style={styles.logoEmoji}>🧁</Text>
            <Text style={styles.logoText}>PanQueo</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.iconCircle}>
            <Text style={styles.productIcon}>⭐</Text>
          </View>
          <View style={styles.infoContent}>
            <View style={styles.nameRow}>
              <Text style={styles.productName}>Azúcar Blanca</Text>
              <View style={styles.skuBadge}>
                <Text style={styles.skuText}>AZU-001</Text>
              </View>
            </View>
            <View style={styles.detailsGrid}>
              <View>
                <Text style={styles.detailLabel}>Stock Mínimo</Text>
                <Text style={styles.detailValue}>5kg</Text>
              </View>
              <View>
                <Text style={styles.detailLabel}>Unidad</Text>
                <Text style={styles.detailValue}>kg</Text>
              </View>
              <View>
                <Text style={styles.detailLabel}>Total Actual</Text>
                <Text style={styles.detailValue}>42.5kg</Text>
              </View>
              <View>
                <Text style={styles.detailLabel}>Ubicación</Text>
                <Text style={styles.detailValue}>Pasillo A-2</Text>
              </View>
            </View>
          </View>
          <View style={styles.infoActions}>
            <Button title="Ajustar Stock" variant="primary" onPress={() => navigation.navigate('AjusteInventario')} style={styles.actionBtn} />
            <Button title="Historial" variant="outline" onPress={() => navigation.navigate('HistorialProducto', { productName: 'Azúcar Blanca' })} style={styles.actionBtn} />
          </View>
        </View>

        <View style={styles.lotsSection}>
          <View style={styles.lotsHeader}>
            <View style={styles.lotsTitleRow}>
              <Text style={styles.lotsIcon}>📦</Text>
              <Text style={styles.lotsTitle}>Lotes en Inventario (FIFO)</Text>
            </View>
            <Text style={styles.lotsOrder}>Ordenado por vencimiento</Text>
          </View>
          <View style={styles.lotsCard}>
            <View style={styles.lotsHead}>
              <Text style={[styles.lotTh, { flex: 1.5 }]}>N° Lote</Text>
              <Text style={styles.lotTh}>Cantidad</Text>
              <Text style={styles.lotTh}>Ingreso</Text>
              <Text style={styles.lotTh}>Vencimiento</Text>
              <Text style={[styles.lotTh, { textAlign: 'right' }]}>Estado</Text>
            </View>
            {LOTS.map((lot, i) => (
              <View key={i} style={[styles.lotRow, i < LOTS.length - 1 && styles.lotRowBorder]}>
                <Text style={[styles.lotTd, { flex: 1.5, ...typography.labelBold }]}>{lot.id}</Text>
                <Text style={[styles.lotTd, { ...typography.titleSm, color: colors.primary }]}>{lot.qty}</Text>
                <Text style={styles.lotTd}>{lot.ingress}</Text>
                <Text style={[styles.lotTd, lot.expired && { color: colors.error, fontWeight: '600' }]}>
                  {lot.expired ? '⚠️ ' : ''}{lot.expiry}
                </Text>
                <View style={[styles.lotTd, { alignItems: 'flex-end' }]}>
                  <Text style={[styles.lotStatus, lot.expired ? styles.statusExpired : styles.statusActive]}>
                    {lot.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Uso Semanal Estimado</Text>
          <Text style={styles.chartSub}>Basado en órdenes del último mes</Text>
          <View style={styles.bars}>
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
              <View key={i} style={styles.barCol}>
                <View style={[styles.bar, { height: [40, 50, 30, 70, 45, 60, 20][i] }]} />
                <Text style={styles.barLabel}>{day}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 40, gap: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: spacing.xs },
  backText: { fontSize: 24, color: colors.onSurface },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.base },
  logoEmoji: { fontSize: 24 },
  logoText: { ...typography.displayLgMobile, fontSize: 20, color: colors.primary },
  infoCard: { backgroundColor: colors.surfaceContainerLowest, borderRadius: borderRadius.xl, padding: spacing.xl, gap: spacing.lg, ...shadows.md },
  iconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: `${colors.primaryContainer}1A`, alignItems: 'center', justifyContent: 'center' },
  productIcon: { fontSize: 40 },
  infoContent: { gap: spacing.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  productName: { ...typography.headlineMd, color: colors.primary },
  skuBadge: { backgroundColor: colors.secondaryContainer, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 999 },
  skuText: { ...typography.bodySm, color: colors.onSecondaryContainer, fontWeight: '600' },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  detailLabel: { ...typography.bodySm, color: colors.onSurfaceVariant, fontWeight: '600' },
  detailValue: { ...typography.titleSm, color: colors.onSurface },
  infoActions: { gap: spacing.sm },
  actionBtn: {},
  lotsSection: { gap: spacing.md },
  lotsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lotsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.base },
  lotsIcon: { fontSize: 20 },
  lotsTitle: { ...typography.titleSm, color: colors.onSurface },
  lotsOrder: { ...typography.bodySm, color: colors.onSurfaceVariant, fontStyle: 'italic' },
  lotsCard: { backgroundColor: colors.surfaceContainerLowest, borderRadius: borderRadius.xl, overflow: 'hidden', ...shadows.md },
  lotsHead: { flexDirection: 'row', backgroundColor: colors.surfaceContainerLow, paddingVertical: spacing.sm },
  lotTh: { flex: 1, ...typography.labelBold, color: colors.onSurfaceVariant, paddingHorizontal: spacing.sm },
  lotRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  lotRowBorder: { borderBottomWidth: 1, borderBottomColor: `${colors.outlineVariant}4D` },
  lotTd: { flex: 1, ...typography.bodySm, color: colors.onSurface, paddingHorizontal: spacing.sm },
  lotStatus: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 999, fontSize: 12, fontWeight: '700', overflow: 'hidden' },
  statusActive: { backgroundColor: colors.tertiaryContainer, color: colors.onTertiaryContainer },
  statusExpired: { backgroundColor: colors.errorContainer, color: colors.onErrorContainer },
  chartCard: { backgroundColor: colors.surfaceContainerLowest, borderRadius: borderRadius.xl, padding: spacing.lg, ...shadows.md },
  chartTitle: { ...typography.labelBold, color: colors.onSurfaceVariant },
  chartSub: { ...typography.bodySm, color: `${colors.onSurfaceVariant}B3`, marginBottom: spacing.md },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: 80, gap: spacing.sm },
  barCol: { flex: 1, alignItems: 'center', gap: spacing.xs },
  bar: { width: '100%', backgroundColor: `${colors.primaryContainer}33`, borderRadius: 4 },
  barLabel: { fontSize: 10, fontWeight: '700', color: colors.onSurfaceVariant },
});
