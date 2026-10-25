import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Card, Badge, Loading, ErrorMessage } from '../../components/ui';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';
import { useIngredienteById } from '../../lib/hooks/useInventario';
import { useCurrency } from '../../lib/currency';

/**
 * Historial de un ingrediente — trazabilidad por lotes (RF-01):
 * resume stock actual/mínimo y lista los lotes registrados con su estado
 * (Disponible / Por vencer / Agotado), ordenados por fecha de vencimiento (FIFO).
 */
export const HistorialProductoScreen = ({ navigation, route }) => {
  const ingredienteId = route?.params?.ingredienteId;
  const { format } = useCurrency();

  // El backend expone GET /inventario/ingredientes/:id (ingrediente + lotes)
  const { data: ingrediente, loading, error } = useIngredienteById(ingredienteId);

  if (!ingredienteId) {
    return (
      <ScreenWrapper>
        <Text style={styles.emptyText}>Selecciona un producto</Text>
      </ScreenWrapper>
    );
  }

  if (loading) {
    return <ScreenWrapper><Loading /></ScreenWrapper>;
  }

  if (error || !ingrediente) {
    return (
      <ScreenWrapper>
        <ErrorMessage message={error || 'Ingrediente no encontrado'} />
      </ScreenWrapper>
    );
  }

  const lotes = Array.isArray(ingrediente.LoteIngredientes) ? ingrediente.LoteIngredientes : [];
  const stockActual = parseFloat(ingrediente.stock_actual ?? 0);
  const stockMinimo = parseFloat(ingrediente.stock_minimo ?? 0);
  const unit = ingrediente.unidad_medida || '';

  const loteStatus = (lote) => {
    const cantidad = parseFloat(lote.cantidad_actual || 0);
    if (cantidad <= 0) return { label: 'Agotado', variant: 'neutral' };
    const diasRestantes = Math.ceil((new Date(lote.fecha_venc) - new Date()) / 86400000);
    if (diasRestantes <= 0) {
      return { label: 'Vencido', variant: 'critical' };
    }
    if (diasRestantes <= 7) {
      return { label: `Vence en ${diasRestantes}d`, variant: 'critical' };
    }
    return { label: 'Disponible', variant: 'success' };
  };

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.title}>Historial y Lotes</Text>
          <View style={{ width: 44 }} />
        </View>

        <Card variant="elevated" style={styles.resumeCard}>
          <Text style={styles.productName}>{ingrediente.nombre_ing}</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, stockActual <= stockMinimo && { color: colors.error }]}>
                {stockActual} {unit}
              </Text>
              <Text style={styles.statLabel}>Stock actual</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{stockMinimo} {unit}</Text>
              <Text style={styles.statLabel}>Stock mínimo</Text>
            </View>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Lotes registrados (FEFO)</Text>
        {lotes.length === 0 && (
          <Text style={styles.emptyText}>No hay lotes registrados para este producto.</Text>
        )}
        {lotes.map((lote) => {
          const st = loteStatus(lote);
          return (
            <Card key={lote.id_lote} variant="border" style={styles.movCard}>
              <View style={styles.movHeader}>
                <View style={[styles.typeBadge, { backgroundColor: colors.primaryContainer }]}>
                  <Text style={[styles.typeText, { color: colors.onPrimaryContainer }]}>
                    Lote #{lote.id_lote}
                  </Text>
                </View>
                <Badge label={st.label} variant={st.variant} />
              </View>
              <Text style={styles.movFrom}>
                {parseFloat(lote.cantidad_actual)} de {parseFloat(lote.cantidad_inicial)} {unit} disponibles
                {parseFloat(lote.precio_compra_unitario ?? 0) > 0
                  ? ` · Costo: ${format(parseFloat(lote.precio_compra_unitario))} / ${unit}`
                  : ''}
              </Text>
              <View style={styles.movFooter}>
                <Text style={styles.movDate}>Ingreso: {lote.fecha_ingreso}</Text>
                <Text style={styles.movUser}>Vence: {lote.fecha_venc}</Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    marginBottom: spacing.xs,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
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
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', paddingVertical: spacing.lg },
});
