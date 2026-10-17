import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Card, Badge, Button, Loading, ErrorMessage } from '../../components/ui';
import { CenterModal } from '../../components/ui/Modal';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';
import { usePedidoById, usePedidos } from '../../lib/hooks/usePedidos';
import { useCurrency } from '../../lib/currency';
import apiClient from '../../lib/api/client';
import { ENDPOINTS } from '../../lib/api/endpoints';

const ESTADOS_PAGO = ['Pendiente', 'Abonado', 'Pagado'];
const ESTADOS_ENTREGA = ['Por Preparar', 'En Cocina', 'Listo', 'Entregado'];

const statusColor = (e) => {
  const m = {
    Pendiente: '#FF9800', Abonado: '#2196F3', Pagado: '#4CAF50',
    'Por Preparar': '#FF9800', 'En Cocina': '#2196F3', Listo: '#4CAF50', Entregado: '#9E9E9E',
  };
  return m[e] || '#999';
};

export const DetallePedidoScreen = ({ route, navigation }) => {
  const pedidoId = route?.params?.pedidoId;
  const { data: pedido, loading, error, refetch } = usePedidoById(pedidoId);
  const { refetch: refetchPedidos } = usePedidos();
  const { format } = useCurrency();

  const [estadoPago, setEstadoPago] = useState(null);
  const [estadoEntrega, setEstadoEntrega] = useState(null);
  const [saving, setSaving] = useState(false);
  const [stockError, setStockError] = useState(null); // { message }

  // Al cargar los datos reales, sincronizar los selectores de estado
  useEffect(() => {
    if (pedido) {
      setEstadoPago(pedido.estado_pago || 'Pendiente');
      setEstadoEntrega(pedido.estado_entrega || 'Por Preparar');
    }
  }, [pedido]);

  if (!pedidoId) {
    return (
      <ScreenWrapper>
        <Text style={styles.emptyText}>Selecciona un pedido</Text>
      </ScreenWrapper>
    );
  }

  if (loading) {
    return (
      <ScreenWrapper>
        <Loading />
      </ScreenWrapper>
    );
  }

  if (error || !pedido) {
    return (
      <ScreenWrapper>
        <ErrorMessage message={error || 'Pedido no encontrado'} />
      </ScreenWrapper>
    );
  }

  const detalles = Array.isArray(pedido.DetallePedidos) ? pedido.DetallePedidos : [];
  const abonado = parseFloat(pedido.monto_abonado || 0);
  const balance = parseFloat(pedido.costo_total || 0) - abonado;

  const dirty = estadoPago !== pedido.estado_pago || estadoEntrega !== pedido.estado_entrega;

  const parseStockError = (message) => {
    // Formato backend: "Stock insuficiente para X. Requerido: N, Disponible: M"
    const match = /Stock insuficiente para ([^.]+)\.\s*Requerido: ([\d.]+), Disponible: ([\d.]+)/.exec(message || '');
    if (!match) return { nombre: null, requerido: null, disponible: null };
    return { nombre: match[1].trim(), requerido: match[2], disponible: match[3] };
  };

  const handleSave = async () => {
    if (!dirty) return;
    setSaving(true);
    try {
      const payload = {};
      if (estadoEntrega !== pedido.estado_entrega) payload.estado_entrega = estadoEntrega;
      if (estadoPago !== pedido.estado_pago) payload.estado_pago = estadoPago;

      await apiClient.patch(ENDPOINTS.PEDIDO_ESTADO(pedidoId), payload);
      await refetch();
      await refetchPedidos();
      Alert.alert('Éxito', 'Estado actualizado. Si pasó a "En Cocina", el inventario se descontó por FIFO.');
    } catch (err) {
      const message = err?.message || 'Error al actualizar el estado';
      if (message.includes('Stock insuficiente')) {
        setStockError(parseStockError(message));
      } else {
        Alert.alert('No se pudo actualizar', message);
      }
    } finally {
      setSaving(false);
    }
  };

  const esEnCocina = pedido.estado_entrega === 'En Cocina';

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.orderId}>Pedido #{pedido.id_pedido}</Text>
          <Badge
            label={pedido.estado_entrega}
            variant={pedido.estado_entrega.toLowerCase().replace(/\s+/g, '-')}
            dot
          />
        </View>

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Cliente</Text>
            <Text style={styles.infoValue}>
              {pedido.Cliente
                ? `${pedido.Cliente.nombre} ${pedido.Cliente.apellido || ''}`.trim()
                : `ID ${pedido.id_cliente}`}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Fecha de Pedido</Text>
            <Text style={styles.infoValue}>{pedido.fecha_pedido?.split('T')[0] || '—'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Entrega</Text>
            <Text style={styles.infoValue}>{pedido.fecha_entrega}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Delivery</Text>
            <Text style={styles.infoValue}>
              {pedido.es_delivery ? '🚚 Sí' : 'No'}
            </Text>
          </View>
          {pedido.direccion_delivery && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Dirección</Text>
              <Text style={styles.infoValue}>{pedido.direccion_delivery}</Text>
            </View>
          )}
          {pedido.observaciones && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Observaciones</Text>
              <Text style={styles.infoValue}>{pedido.observaciones}</Text>
            </View>
          )}
        </Card>

        <Card style={styles.productsCard}>
          <Text style={styles.sectionTitle}>Productos</Text>
          {detalles.length === 0 && (
            <Text style={styles.emptyText}>Sin recetas registradas</Text>
          )}
          {detalles.map((d) => (
            <View key={d.id_detalle} style={styles.productRow}>
              <Text style={styles.productName}>
                {d.Receta?.nombre_receta || `Receta #${d.id_receta}`}
              </Text>
              <Text style={styles.productQty}>x{parseFloat(d.cantidad)}</Text>
              <Text style={styles.productPrice}>{format(d.precio_unitario || 0)}</Text>
            </View>
          ))}
          <View style={[styles.totalRow, styles.firstTotalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{format(pedido.costo_total)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Abonado</Text>
            <Text style={styles.totalValue}>{format(abonado)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Balance</Text>
            <Text style={[styles.totalValue, { color: balance > 0 ? colors.error : colors.tertiary }]}>
              {format(balance)}
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
          {esEnCocina && (
            <Text style={styles.fifoHint}>
              ✓ Los ingredientes ya fueron descontados del inventario (FIFO)
            </Text>
          )}
          {!esEnCocina && pedido.estado_entrega === 'Por Preparar' && estadoEntrega === 'En Cocina' && (
            <Text style={styles.fifoWarn}>
              ⓘ Al confirmar "En Cocina" se descontarán los ingredientes del inventario. Si no hay stock suficiente, el operativo mostrará un error y no se aplicará ningún cambio.
            </Text>
          )}
          <View style={styles.statusRow}>
            {ESTADOS_ENTREGA.map((e) => {
              // El flujo es lineal: no regresar a estados previos al actual
              const order = ESTADOS_ENTREGA.indexOf(pedido.estado_entrega);
              const target = ESTADOS_ENTREGA.indexOf(e);
              const bloqueado = target < order;
              return (
                <TouchableOpacity
                  key={e}
                  disabled={bloqueado}
                  style={[
                    styles.statusPill,
                    estadoEntrega === e && { backgroundColor: statusColor(e), borderColor: statusColor(e) },
                    bloqueado && styles.statusPillDisabled,
                  ]}
                  onPress={() => setEstadoEntrega(e)}
                >
                  <Text style={[styles.statusPillText, estadoEntrega === e && { color: '#fff' }]}>{e}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <View style={styles.actions}>
          <Button
            title={saving ? 'Guardando...' : dirty ? 'Guardar Cambios' : 'Sin cambios pendientes'}
            variant="primary"
            onPress={handleSave}
            disabled={saving || !dirty}
          />
        </View>
      </ScrollView>

      {/* Modal equivalente al view-stock-error del MVP web */}
      <CenterModal
        visible={!!stockError}
        onClose={() => setStockError(null)}
        title="❌ Stock insuficiente"
      >
        <Text style={styles.stockErrorText}>
          No hay suficiente inventario para preparar este pedido con la regla FIFO.
        </Text>
        {stockError?.nombre && (
          <Card variant="border" style={styles.stockErrorCard}>
            <View style={styles.stockErrorRow}>
              <MaterialIcons name='inventory' size={20} color={colors.error} />
              <Text style={styles.stockErrorName}>{stockError.nombre}</Text>
            </View>
            <View style={styles.stockDataRow}>
              <Text style={styles.stockDataLabel}>Requerido</Text>
              <Text style={styles.stockDataValue}>{stockError.requerido}</Text>
            </View>
            <View style={styles.stockDataRow}>
              <Text style={styles.stockDataLabel}>Disponible</Text>
              <Text style={[styles.stockDataValue, { color: colors.error }]}>
                {stockError.disponible}
              </Text>
            </View>
          </Card>
        )}
        <Text style={styles.stockErrorHint}>
          Registra un lote nuevo (o completa tu Lista de Compras) para reponer el inventario y vuelve a intentarlo.
        </Text>
        <Button
          title="Entendido"
          variant="primary"
          onPress={() => setStockError(null)}
          style={{ marginTop: spacing.md }}
        />
      </CenterModal>
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
  infoValue: { ...typography.bodySm, fontWeight: '600', color: colors.onSurface, flexShrink: 1 },
  productsCard: { marginBottom: spacing.md, gap: spacing.sm },
  sectionTitle: { ...typography.labelBold, color: colors.onSurface, marginBottom: spacing.xs },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  productName: { ...typography.bodyMd, color: colors.onSurface, flexShrink: 1 },
  productQty: { ...typography.bodySm, color: colors.onSurfaceVariant },
  productPrice: { ...typography.bodyMd, fontWeight: '600' },
  firstTotalRow: { marginTop: spacing.sm },
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
  fifoHint: { ...typography.bodySm, color: colors.tertiary, marginTop: spacing.xs },
  fifoWarn: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: spacing.xs },
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
  statusPillDisabled: { opacity: 0.4 },
  statusPillText: { ...typography.labelBold, fontSize: 12, color: colors.onSurfaceVariant },
  actions: { marginTop: spacing.md },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', paddingVertical: spacing.xl },
  stockErrorText: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: spacing.sm },
  stockErrorCard: { padding: spacing.md, gap: spacing.xs },
  stockErrorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  stockErrorName: { ...typography.labelBold, color: colors.onSurface },
  stockDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  stockDataLabel: { ...typography.bodySm, color: colors.onSurfaceVariant },
  stockDataValue: { ...typography.labelBold, color: colors.onSurface },
  stockErrorHint: { ...typography.bodySm, color: colors.outline },
});
