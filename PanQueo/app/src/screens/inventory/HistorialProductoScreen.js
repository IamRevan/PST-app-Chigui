import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Card, Badge } from '../../components/ui';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';

const MOVIMIENTOS = [
  { id: '1', type: 'entrada', qty: '+50 kg', date: '07 Oct 2023', from: 'Compra a Proveedor', user: 'Admin' },
  { id: '2', type: 'salida', qty: '-2 kg', date: '07 Oct 2023', from: 'Producción - Pan de Mantequilla', user: 'Admin' },
  { id: '3', type: 'salida', qty: '-1.5 kg', date: '06 Oct 2023', from: 'Producción - Croissant', user: 'Admin' },
  { id: '4', type: 'ajuste', qty: '-0.5 kg', date: '05 Oct 2023', from: 'Ajuste de inventario', user: 'Admin' },
  { id: '5', type: 'entrada', qty: '+25 kg', date: '04 Oct 2023', from: 'Compra a Proveedor', user: 'Admin' },
  { id: '6', type: 'salida', qty: '-3 kg', date: '04 Oct 2023', from: 'Producción - Pan de Mantequilla', user: 'Admin' },
];

const typeConfig = {
  entrada: { label: 'Entrada', color: '#2E7D32', bg: '#E8F5E9' },
  salida: { label: 'Salida', color: '#C62828', bg: '#FFEBEE' },
  ajuste: { label: 'Ajuste', color: '#1565C0', bg: '#E3F2FD' },
};

export const HistorialProductoScreen = ({ navigation, route }) => {
  const { productName = 'Harina de Trigo' } = route?.params || {};
  const stockActual = '245 kg';
  const stockMinimo = '50 kg';

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Historial</Text>
          <View style={{ width: 32 }} />
        </View>

        <Card variant="elevated" style={styles.resumeCard}>
          <Text style={styles.productName}>{productName}</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{stockActual}</Text>
              <Text style={styles.statLabel}>Stock actual</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{stockMinimo}</Text>
              <Text style={styles.statLabel}>Stock mínimo</Text>
            </View>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Movimientos</Text>
        {MOVIMIENTOS.map((mov) => {
          const cfg = typeConfig[mov.type];
          return (
            <Card key={mov.id} variant="border" style={styles.movCard}>
              <View style={styles.movHeader}>
                <View style={[styles.typeBadge, { backgroundColor: cfg.bg }]}>
                  <Text style={[styles.typeText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
                <Text style={styles.movQty}>{mov.qty}</Text>
              </View>
              <Text style={styles.movFrom}>{mov.from}</Text>
              <View style={styles.movFooter}>
                <Text style={styles.movDate}>{mov.date}</Text>
                <Text style={styles.movUser}>{mov.user}</Text>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 40, gap: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  backIcon: { fontSize: 24, color: colors.onSurface },
  title: { ...typography.titleSm, color: colors.onSurface },
  resumeCard: { padding: spacing.md, alignItems: 'center' },
  productName: { ...typography.titleSm, color: colors.onSurface, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  stat: { alignItems: 'center', paddingHorizontal: spacing.lg },
  statValue: { ...typography.valueDisplay, color: colors.primary },
  statLabel: { ...typography.metadata, color: colors.onSurfaceVariant },
  statDivider: { width: 1, height: 32, backgroundColor: colors.outlineVariant },
  sectionTitle: { ...typography.labelBold, color: colors.onSurfaceVariant, marginTop: spacing.xs },
  movCard: { padding: spacing.md },
  movHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  typeBadge: { paddingHorizontal: spacing.base, paddingVertical: 2, borderRadius: borderRadius.full },
  typeText: { ...typography.labelCaption, fontWeight: '700' },
  movQty: { ...typography.labelBold, color: colors.onSurface },
  movFrom: { ...typography.bodySm, color: colors.onSurfaceVariant, marginBottom: spacing.xs },
  movFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  movDate: { ...typography.metadata, color: colors.outline },
  movUser: { ...typography.metadata, color: colors.outline },
});
