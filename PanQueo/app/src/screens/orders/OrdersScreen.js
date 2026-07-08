import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Card, Badge, Button } from '../../components/ui';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';

const FILTERS = ['Todos', 'Pendientes', 'En Cocina', 'Listos', 'Entregados'];

const FILTER_MAP = {
  'Todos': null,
  'Pendientes': 'Pendiente',
  'En Cocina': 'En Cocina',
  'Listos': 'Listo',
  'Entregados': 'Entregado',
};

const ORDERS = [
  {
    id_pedido: 1001,
    estado_entrega: 'Pendiente',
    es_delivery: false,
    costo_total: 450.00,
    id_cliente: 1,
    Cliente: { nombre: 'María García' },
    fecha_pedido: '2026-07-07',
    estado_pago: 'Pendiente',
  },
  {
    id_pedido: 1002,
    estado_entrega: 'En Cocina',
    es_delivery: true,
    costo_total: 320.50,
    id_cliente: 2,
    Cliente: { nombre: 'Juan Pérez' },
    fecha_pedido: '2026-07-07',
    estado_pago: 'Abonado',
  },
  {
    id_pedido: 1003,
    estado_entrega: 'Listo',
    es_delivery: false,
    costo_total: 675.00,
    id_cliente: 3,
    Cliente: { nombre: 'Ana López' },
    fecha_pedido: '2026-07-06',
    estado_pago: 'Pagado',
  },
  {
    id_pedido: 1004,
    estado_entrega: 'Entregado',
    es_delivery: true,
    costo_total: 890.00,
    id_cliente: 4,
    Cliente: { nombre: 'Carlos Ruiz' },
    fecha_pedido: '2026-07-05',
    estado_pago: 'Pagado',
  },
];

const STATUS_MAP = {
  'Pendiente': { border: '#FF9800', bg: colors.pendienteBg, text: colors.pendiente, dot: '#FF9800' },
  'Abonado': { border: '#2196F3', bg: colors.enCocinaBg, text: colors.enCocina, dot: '#2196F3' },
  'Pagado': { border: '#4CAF50', bg: '#E8F5E9', text: '#2E7D32', dot: '#4CAF50' },
  'Por Preparar': { border: '#FF9800', bg: colors.pendienteBg, text: colors.pendiente, dot: '#FF9800' },
  'En Cocina': { border: '#2196F3', bg: colors.enCocinaBg, text: colors.enCocina, dot: '#2196F3' },
  'Listo': { border: colors.tertiary, bg: `${colors.tertiaryContainer}33`, text: colors.tertiary, dot: colors.tertiary },
  'Entregado': { border: '#9E9E9E', bg: '#F5F5F5', text: '#757575', dot: '#9E9E9E' },
};

export const OrdersScreen = ({ navigation }) => {
  const [activeFilter, setActiveFilter] = useState('Todos');

  const mapEstado = (e) => {
    if (e === 'Por Preparar') return 'Pendiente';
    return e;
  };

  const filtered = ORDERS.filter((p) => {
    if (activeFilter === 'Todos') return true;
    return mapEstado(p.estado_entrega) === FILTER_MAP[activeFilter];
  });

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Órdenes</Text>
          <Button title="+ Nuevo Pedido" variant="primary" onPress={() => navigation.navigate('NuevoPedido')} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filtered.map((order) => {
          const estado = order.estado_entrega === 'Por Preparar' ? 'Pendiente' : order.estado_entrega;
          const sc = STATUS_MAP[order.estado_entrega] || STATUS_MAP['Pendiente'];
          return (
            <View key={order.id_pedido} style={[styles.orderCard, { borderLeftColor: sc.border }]}>
              <View style={styles.orderTop}>
                <View style={styles.orderTopLeft}>
                  <Text style={styles.orderId}>#{order.id_pedido}</Text>
                  <Badge label={order.estado_entrega} variant={order.estado_entrega.toLowerCase().replace(/\s+/g, '-')} dot />
                  {order.es_delivery && <Text style={styles.deliveryIcon}>🚚</Text>}
                </View>
                <Text style={styles.orderTotal}>${parseFloat(order.costo_total || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cliente:</Text>
                  <Text style={styles.detailValue}>{order.Cliente?.nombre || `ID ${order.id_cliente}`}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Fecha:</Text>
                  <Text style={styles.detailValue}>{order.fecha_pedido}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Pago:</Text>
                  <Text style={styles.detailValue}>{order.estado_pago}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.viewDetail} onPress={() => navigation.navigate('DetallePedido', { pedidoId: order.id_pedido })}>
                <Text style={styles.viewDetailText}>Ver Detalle</Text>
                <Text style={styles.viewDetailArrow}>→</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {filtered.length === 0 && (
          <Text style={styles.emptyText}>No hay pedidos {activeFilter !== 'Todos' ? activeFilter.toLowerCase() : ''}</Text>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...typography.titleSm, fontSize: 20, color: colors.onSurface },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  searchIcon: { fontSize: 20, color: colors.onSurfaceVariant },
  searchText: { ...typography.bodyMd, color: colors.onSurfaceVariant, flex: 1 },
  filtersRow: {
    marginBottom: spacing.lg,
  },
  filterPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerHighest,
    marginRight: spacing.sm,
  },
  filterPillActive: {
    backgroundColor: colors.primaryContainer,
  },
  filterText: {
    ...typography.labelBold,
    color: colors.onSurfaceVariant,
  },
  filterTextActive: {
    color: colors.onPrimaryContainer,
  },
  orderCard: {
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    ...shadows.md,
    marginBottom: spacing.md,
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  orderTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  orderId: { ...typography.labelBold, color: colors.onSurface },
  deliveryIcon: { fontSize: 18 },
  orderTotal: { ...typography.titleSm, color: colors.primary, fontSize: 18 },
  orderDetails: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  detailLabel: { ...typography.labelBold, color: colors.onSurfaceVariant, fontSize: 13 },
  detailValue: { ...typography.bodySm, color: colors.onSurfaceVariant },
  viewDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
  },
  viewDetailText: { ...typography.buttonText, color: colors.primary },
  viewDetailArrow: { fontSize: 18, color: colors.primary },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', paddingVertical: spacing.xl },
});
