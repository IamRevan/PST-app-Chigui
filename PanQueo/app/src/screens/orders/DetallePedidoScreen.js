import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Card, Badge, Button } from '../../components/ui';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';

const ESTADOS_PAGO = ['Pendiente', 'Abonado', 'Pagado'];
const ESTADOS_ENTREGA = ['Por Preparar', 'En Cocina', 'Listo', 'Entregado'];

const MOCK_PEDIDO = {
  id_pedido: 123,
  Cliente: { nombre: 'Juan Pérez' },
  fecha_pedido: '2025-06-15',
  fecha_entrega: '2025-06-17',
  es_delivery: true,
  direccion_delivery: 'Av. Siempre Viva 742, Springfield',
  observaciones: 'Pastel de chocolate + 12 donas',
  costo_total: 45.50,
  monto_abonado: 20.00,
};

const MOCK_PRODUCTOS = [
  { id: 1, nombre: 'Pastel de Chocolate', cantidad: 1, precio: 25.00 },
  { id: 2, nombre: 'Donas (docena)', cantidad: 1, precio: 15.00 },
  { id: 3, nombre: 'Galletas', cantidad: 2, precio: 5.50 },
];

export const DetallePedidoScreen = ({ route, navigation }) => {
  const pedidoId = route?.params?.pedidoId || MOCK_PEDIDO.id_pedido;
  const [estadoPago, setEstadoPago] = useState('Pendiente');
  const [estadoEntrega, setEstadoEntrega] = useState('Por Preparar');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const statusColor = (e) => {
    const m = { 'Pendiente': '#FF9800', 'Abonado': '#2196F3', 'Pagado': '#4CAF50',
                'Por Preparar': '#FF9800', 'En Cocina': '#2196F3', 'Listo': '#4CAF50', 'Entregado': '#9E9E9E' };
    return m[e] || '#999';
  };

  const handleSave = () => {
    setSaving(true);
    setSaved(false);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1000);
    }, 600);
  };

  if (!pedidoId) return <ScreenWrapper><Text style={styles.emptyText}>Selecciona un pedido</Text></ScreenWrapper>;

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.orderId}>Pedido #{pedidoId}</Text>
          <Badge label={estadoPago} variant={estadoPago.toLowerCase()} dot />
        </View>

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cliente</Text>
            <Text style={styles.infoValue}>{MOCK_PEDIDO.Cliente?.nombre || `ID ${MOCK_PEDIDO.id_cliente}`}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha</Text>
            <Text style={styles.infoValue}>{MOCK_PEDIDO.fecha_pedido}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Entrega</Text>
            <Text style={styles.infoValue}>{MOCK_PEDIDO.fecha_entrega}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Delivery</Text>
            <Text style={styles.infoValue}>{MOCK_PEDIDO.es_delivery ? '🚚 Sí' : 'No'}</Text>
          </View>
          {MOCK_PEDIDO.direccion_delivery && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Dirección</Text>
              <Text style={styles.infoValue}>{MOCK_PEDIDO.direccion_delivery}</Text>
            </View>
          )}
        </Card>

        <Card style={styles.productsCard}>
          <Text style={styles.sectionTitle}>Productos</Text>
          {MOCK_PRODUCTOS.map((p) => (
            <View key={p.id} style={styles.productRow}>
              <Text style={styles.productName}>{p.nombre}</Text>
              <Text style={styles.productQty}>x{p.cantidad}</Text>
              <Text style={styles.productPrice}>${p.precio.toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${MOCK_PEDIDO.costo_total.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Abonado</Text>
            <Text style={styles.totalValue}>${MOCK_PEDIDO.monto_abonado.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Balance</Text>
            <Text style={[styles.totalValue, { color: colors.error }]}>
              ${(MOCK_PEDIDO.costo_total - MOCK_PEDIDO.monto_abonado).toFixed(2)}
            </Text>
          </View>
        </Card>

        <Card style={styles.statusCard}>
          <Text style={styles.sectionTitle}>Estado de Pago</Text>
          <View style={styles.statusRow}>
            {ESTADOS_PAGO.map((e) => (
              <TouchableOpacity
                key={e}
                style={[styles.statusPill, estadoPago === e && { backgroundColor: statusColor(e), borderColor: statusColor(e) }]}
                onPress={() => setEstadoPago(e)}
              >
                <Text style={[styles.statusPillText, estadoPago === e && { color: '#fff' }]}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card style={styles.statusCard}>
          <Text style={styles.sectionTitle}>Estado de Entrega</Text>
          <View style={styles.statusRow}>
            {ESTADOS_ENTREGA.map((e) => (
              <TouchableOpacity
                key={e}
                style={[styles.statusPill, estadoEntrega === e && { backgroundColor: statusColor(e), borderColor: statusColor(e) }]}
                onPress={() => setEstadoEntrega(e)}
              >
                <Text style={[styles.statusPillText, estadoEntrega === e && { color: '#fff' }]}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <View style={styles.actions}>
          <Button
            title={saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar Cambios'}
            variant="primary"
            onPress={handleSave}
            disabled={saving || saved}
          />
        </View>
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
    marginBottom: spacing.md,
  },
  orderId: { ...typography.titleSm, color: colors.onSurface },
  infoCard: { marginBottom: spacing.md, gap: spacing.sm },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  infoLabel: { ...typography.bodySm, color: colors.onSurfaceVariant },
  infoValue: { ...typography.bodySm, fontWeight: '600', color: colors.onSurface },
  productsCard: { marginBottom: spacing.md, gap: spacing.sm },
  sectionTitle: { ...typography.labelBold, color: colors.onSurface, marginBottom: spacing.xs },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  productName: { ...typography.bodyMd, color: colors.onSurface },
  productQty: { ...typography.bodySm, color: colors.onSurfaceVariant },
  productPrice: { ...typography.bodyMd, fontWeight: '600' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  totalLabel: { ...typography.labelBold },
  totalValue: { ...typography.titleSm, color: colors.primary },
  statusCard: { marginBottom: spacing.md },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  statusPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    backgroundColor: colors.surface,
  },
  statusPillText: { ...typography.labelBold, fontSize: 12, color: colors.onSurfaceVariant },
  actions: { marginTop: spacing.md },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', paddingVertical: spacing.xl },
});
