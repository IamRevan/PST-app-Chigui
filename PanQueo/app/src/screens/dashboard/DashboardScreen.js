import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Card, Badge } from '../../components/ui';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';
import { useAuth } from '../../auth/AuthContext';

export const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();

  const ACTIVE_ORDERS = [
    { id_pedido: 101, fecha_entrega: '2026-07-07', observaciones: 'Pastel de chocolate - 3kg', Cliente: { nombre: 'María López' }, estado_entrega: 'En Cocina', estado_pago: 'Pagado', costo_total: '450', monto_abonado: '450' },
    { id_pedido: 102, fecha_entrega: '2026-07-08', observaciones: 'Panqueques de avena x50', Cliente: { nombre: 'Juan Pérez' }, estado_entrega: 'En Cocina', estado_pago: 'Pendiente', costo_total: '320', monto_abonado: '0' },
    { id_pedido: 103, fecha_entrega: '2026-07-07', observaciones: 'Galletas surtidas - 2kg', Cliente: { nombre: 'Ana García' }, estado_entrega: 'En Cocina', estado_pago: 'Pagado', costo_total: '280', monto_abonado: '280' },
  ];

  const pedidosEnCocina = ACTIVE_ORDERS.filter((p) => p.estado_entrega === 'En Cocina');
  const pedidosHoy = ACTIVE_ORDERS.filter((p) => {
    const hoy = new Date().toISOString().split('T')[0];
    return p.fecha_entrega === hoy;
  });
  const stockBajo = 3;
  const porCobrar = ACTIVE_ORDERS
    .filter((p) => p.estado_pago !== 'Pagado')
    .reduce((sum, p) => sum + (parseFloat(p.costo_total) - parseFloat(p.monto_abonado || 0)), 0);
  const totalAlertas = 5;

  const METRICS = [
    { label: 'Pedidos Hoy', value: String(pedidosHoy.length), bg: colors.metricBg1, border: colors.metricBorder1, textColor: colors.metricText1, icon: '📦', onPress: () => navigation.navigate('Pedidos') },
    { label: 'Stock Bajo', value: String(stockBajo), bg: colors.metricBg2, border: colors.metricBorder2, textColor: colors.metricText2, icon: '⚠️', onPress: () => navigation.navigate('Inventario') },
    { label: 'Por Cobrar', value: `$${porCobrar.toFixed(0)}`, bg: colors.metricBg3, border: colors.metricBorder3, textColor: colors.metricText3, icon: '💰', onPress: () => navigation.navigate('Pedidos') },
    { label: 'Alertas', value: String(totalAlertas), bg: colors.metricBg4, border: colors.metricBorder4, textColor: colors.metricText4, icon: '🔔', onPress: () => navigation.navigate('AlertasVencimiento') },
  ];

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>¡Hola, {user?.nombre || 'Capibara'}!</Text>
          <Text style={styles.greetingSub}>Resumen de tu cocina hoy</Text>
        </View>

        <View style={styles.metricsGrid}>
          {METRICS.map((m, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.metricCard, { backgroundColor: m.bg, borderColor: m.border }]}
              onPress={m.onPress}
              activeOpacity={0.7}
            >
              <Text style={styles.metricIcon}>{m.icon}</Text>
              <Text style={[styles.metricValue, { color: m.textColor }]}>{m.value}</Text>
              <Text style={[styles.metricLabel, { color: `${m.textColor}CC` }]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.reportesLink} onPress={() => navigation.navigate('Reportes')}>
          <Text style={styles.reportesIcon}>📊</Text>
          <Text style={styles.reportesLabel}>Ver Reportes</Text>
          <Text style={styles.reportesArrow}>→</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Producción Activa</Text>
            <Badge label={`${pedidosEnCocina.length} en cocina`} variant="warning" />
          </View>
          {pedidosEnCocina.length === 0 && (
            <Text style={styles.emptyText}>No hay producción activa</Text>
          )}
          {pedidosEnCocina.map((order) => (
            <Card key={order.id_pedido} style={styles.orderCard}>
              <View style={styles.orderLeft}>
                <View style={styles.orderIdRow}>
                  <Text style={styles.orderId}>#{order.id_pedido}</Text>
                  <View style={styles.orderDot} />
                  <Text style={styles.orderDue}>{order.fecha_entrega}</Text>
                </View>
                <Text style={styles.orderName}>{order.observaciones || `Pedido #${order.id_pedido}`}</Text>
                <Text style={styles.orderClient}>{order.Cliente?.nombre || 'Cliente'}</Text>
              </View>
              <TouchableOpacity style={styles.orderAction} onPress={() => navigation.navigate('DetallePedido', { pedidoId: order.id_pedido })}>
                <Text style={styles.orderActionText}>Ver</Text>
                <Text style={styles.orderActionArrow}>→</Text>
              </TouchableOpacity>
            </Card>
          ))}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 40 },
  greeting: { marginBottom: spacing.lg },
  greetingText: { ...typography.headlineMd, color: colors.onBackground },
  greetingSub: { ...typography.bodySm, color: '#757575' },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  metricCard: {
    width: '47%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  metricIcon: { fontSize: 24 },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  reportesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryContainer,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  reportesIcon: { fontSize: 20 },
  reportesLabel: { ...typography.labelBold, color: colors.onPrimaryContainer, flex: 1 },
  reportesArrow: { fontSize: 18, color: colors.onPrimaryContainer },
  section: { gap: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { ...typography.titleSm, color: colors.onBackground },
  orderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  orderLeft: { gap: spacing.xs, flex: 1 },
  orderIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  orderId: { ...typography.labelBold, color: colors.primary },
  orderDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.outlineVariant,
  },
  orderDue: { ...typography.bodySm, color: colors.outline },
  orderName: { ...typography.titleSm, color: colors.onSurface, fontSize: 16 },
  orderClient: { ...typography.bodySm, color: '#757575' },
  orderAction: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.base,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderActionText: { ...typography.labelBold, color: colors.primary },
  orderActionArrow: { fontSize: 16, color: colors.primary },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', paddingVertical: spacing.lg },
});
