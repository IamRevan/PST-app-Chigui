import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Card, Badge, Button, Loading, ErrorMessage } from '../../components/ui';
import { CenterModal } from '../../components/ui/Modal';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';
import { usePedidoById, usePedidos } from '../../lib/hooks/usePedidos';
import { useCurrency } from '../../lib/currency';
import apiClient from '../../lib/api/client';
import { ENDPOINTS } from '../../lib/api/endpoints';

const SEGUIMIENTO_ENTREGA = ['Por Preparar', 'En Cocina', 'Listo', 'Entregado'];
const ESTADOS_PAGO = ['Pendiente', 'Abonado', 'Pagado'];

export const DetallePedidoScreen = ({ route, navigation }) => {
  const pedidoId = route?.params?.pedidoId;
  const { data: pedido, loading, error, refetch } = usePedidoById(pedidoId);
  const { refetch: refetchPedidos } = usePedidos();
  const { format, formatDual } = useCurrency();

  const [estadoPago, setEstadoPago] = useState(null);
  const [estadoEntrega, setEstadoEntrega] = useState(null);
  const [saving, setSaving] = useState(false);
  const [stockError, setStockError] = useState(null);

  useEffect(() => {
    if (pedido) {
      setEstadoPago(pedido.estado_pago || 'Pendiente');
      setEstadoEntrega(pedido.estado_entrega || 'Por Preparar');
    }
  }, [pedido]);

  if (!pedidoId) {
    return (
      <ScreenWrapper>
        <Text style={styles.emptyText}>Selecciona un pedido para ver el detalle</Text>
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
  const total = parseFloat(pedido.costo_total || 0);
  const abonado = parseFloat(pedido.monto_abonado || 0);
  const balance = Math.max(0, total - abonado);
  const esPagado = pedido.estado_pago === 'Pagado';

  // Lógica de avance secuencial de estado (paridad estricta con app.js web)
  const idx = SEGUIMIENTO_ENTREGA.indexOf(pedido.estado_entrega);
  const nextEstado = idx >= 0 && idx < SEGUIMIENTO_ENTREGA.length - 1 ? SEGUIMIENTO_ENTREGA[idx + 1] : null;

  const parseStockError = (message) => {
    const match = /Stock insuficiente para ([^.]+)\.\s*Requerido: ([\d.]+), Disponible: ([\d.]+)/.exec(message || '');
    if (!match) return { nombre: null, requerido: null, disponible: null, raw: message };
    return { nombre: match[1].trim(), requerido: match[2], disponible: match[3], raw: message };
  };

  const handlePasarEstado = async (targetEstado) => {
    setSaving(true);
    try {
      await apiClient.patch(ENDPOINTS.PEDIDO_ESTADO(pedidoId), {
        estado_entrega: targetEstado,
      });
      await refetch();
      await refetchPedidos();
      Alert.alert(
        'Pedido Actualizado',
        targetEstado === 'En Cocina'
          ? 'Pedido en cocina. El inventario se descontó automáticamente con FIFO/FEFO.'
          : `El pedido avanzó a estado "${targetEstado}".`
      );
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

  const handleMarcarPagado = async () => {
    setSaving(true);
    try {
      await apiClient.patch(ENDPOINTS.PEDIDO_ESTADO(pedidoId), {
        estado_pago: 'Pagado',
        monto_abonado: total,
      });
      await refetch();
      await refetchPedidos();
      Alert.alert('Cobro Registrado', 'El pedido ha sido marcado como totalmente Pagado.');
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo actualizar el pago');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Encabezado con ID y navegación */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderId}>Pedido #{pedido.id_pedido}</Text>
            <Text style={styles.orderDates}>
              Entrega: {pedido.fecha_entrega ? String(pedido.fecha_entrega).slice(0, 10) : '—'}
            </Text>
          </View>
          <Badge
            label={pedido.estado_entrega}
            variant={pedido.estado_entrega === 'Listo' ? 'success' : pedido.estado_entrega === 'En Cocina' ? 'default' : 'warning'}
            dot
          />
        </View>

        {/* Botones de acción rápida operativos */}
        <View style={styles.actionButtonsRow}>
          {nextEstado ? (
            <TouchableOpacity
              style={[styles.quickActionBtn, styles.quickActionNext, saving && { opacity: 0.6 }]}
              onPress={() => handlePasarEstado(nextEstado)}
              disabled={saving}
              activeOpacity={0.7}
            >
              <MaterialIcons name="sync-alt" size={18} color={colors.onPrimaryContainer} />
              <Text style={styles.quickActionNextText}>Pasar a {nextEstado}</Text>
            </TouchableOpacity>
          ) : null}

          {!esPagado ? (
            <TouchableOpacity
              style={[styles.quickActionBtn, styles.quickActionPay, saving && { opacity: 0.6 }]}
              onPress={handleMarcarPagado}
              disabled={saving}
              activeOpacity={0.7}
            >
              <MaterialIcons name="done-all" size={18} color={colors.white} />
              <Text style={styles.quickActionPayText}>Marcar Pagado</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.paidBadgeBox}>
              <MaterialIcons name="check-circle" size={16} color={colors.tertiary} />
              <Text style={styles.paidBadgeText}>Totalmente Pagado</Text>
            </View>
          )}
        </View>

        {/* Tarjeta de Cliente */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="person" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Información del Cliente</Text>
          </View>
          <View style={styles.clientDetailRow}>
            <Text style={styles.clientName}>
              {pedido.Cliente?.nombre || 'Cliente General'} {pedido.Cliente?.apellido || ''}
            </Text>
            {pedido.Cliente?.cedula ? (
              <Text style={styles.clientMeta}>CI: {pedido.Cliente.cedula}</Text>
            ) : null}
            {pedido.Cliente?.telefono ? (
              <Text style={styles.clientMeta}>📞 {pedido.Cliente.telefono}</Text>
            ) : null}
            {pedido.es_delivery ? (
              <View style={styles.deliveryBadge}>
                <MaterialIcons name="delivery-dining" size={16} color={colors.primary} />
                <Text style={styles.deliveryText}>
                  Delivery: {pedido.direccion_delivery || 'Dirección indicada al cliente'}
                </Text>
              </View>
            ) : null}
          </View>
        </Card>

        {/* Tarjeta de Pagos */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="payments" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Balance de Pago</Text>
          </View>
          <View style={styles.paymentGrid}>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Estado de pago:</Text>
              <Badge
                label={pedido.estado_pago || 'Pendiente'}
                variant={esPagado ? 'success' : pedido.estado_pago === 'Abonado' ? 'default' : 'warning'}
              />
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Monto total:</Text>
              <Text style={styles.paymentValueBold}>{formatDual(total)}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Abonado a la fecha:</Text>
              <Text style={styles.paymentValue}>{formatDual(abonado)}</Text>
            </View>
            <View style={[styles.paymentRow, styles.balanceRow]}>
              <Text style={styles.balanceLabel}>Saldo por cobrar:</Text>
              <Text style={[styles.balanceValue, balance > 0 ? { color: colors.error } : { color: colors.tertiary }]}>
                {formatDual(balance)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Recetas del Pedido */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="bakery-dining" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Recetas Solicitadas ({detalles.length})</Text>
          </View>

          {detalles.map((d, i) => {
            const precioU = parseFloat(d.precio_unitario || 0);
            const cant = parseFloat(d.cantidad || 0);
            const subtotal = precioU * cant;
            return (
              <View key={d.id_detalle || i} style={styles.recipeRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recipeName}>
                    {d.Receta?.nombre_receta || `Receta #${d.id_receta}`}
                  </Text>
                  <Text style={styles.recipePriceSub}>
                    {cant} porciones × {formatDual(precioU)}
                  </Text>
                </View>
                <Text style={styles.recipeSubtotal}>{formatDual(subtotal)}</Text>
              </View>
            );
          })}

          <View style={styles.totalOrderBox}>
            <Text style={styles.totalOrderLabel}>Total del Pedido</Text>
            <Text style={styles.totalOrderVal}>{formatDual(total)}</Text>
          </View>
        </Card>

        {pedido.observaciones ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>Observaciones:</Text>
            <Text style={styles.notesText}>{pedido.observaciones}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Modal de Error de Stock en FIFO */}
      <CenterModal
        visible={!!stockError}
        onClose={() => setStockError(null)}
        title="⚠️ Stock Insuficiente (FIFO)"
      >
        <Text style={styles.stockErrorDesc}>
          {stockError?.nombre
            ? `No es posible pasar a "En Cocina" porque falta stock del ingrediente:\n\n• ${stockError.nombre}\nRequerido: ${stockError.requerido}\nDisponible: ${stockError.disponible}`
            : stockError?.raw || 'Stock insuficiente para procesar la receta por FIFO.'}
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
  content: { padding: spacing.gutter, paddingBottom: 40, gap: spacing.sm },
  emptyText: { ...typography.bodySm, textAlign: 'center', padding: spacing.xl, color: colors.onSurfaceVariant },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
    paddingTop: 4,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  orderId: { ...typography.headlineMd, fontSize: 20, color: colors.onSurface },
  orderDates: { ...typography.metadata, color: colors.onSurfaceVariant, fontSize: 11 },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: 4,
    flexWrap: 'wrap',
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    flex: 1,
    minWidth: 140,
    ...shadows.sm,
  },
  quickActionNext: {
    backgroundColor: colors.primaryContainer,
  },
  quickActionNextText: {
    ...typography.buttonText,
    color: colors.onPrimaryContainer,
    fontSize: 13,
  },
  quickActionPay: {
    backgroundColor: colors.tertiary,
  },
  quickActionPayText: {
    ...typography.buttonText,
    color: colors.white,
    fontSize: 13,
  },
  paidBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${colors.tertiaryContainer}30`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
  },
  paidBadgeText: {
    ...typography.labelBold,
    color: colors.tertiary,
    fontSize: 12,
  },
  card: { padding: spacing.md, gap: spacing.xs, borderRadius: borderRadius.lg },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
    paddingBottom: 6,
  },
  cardTitle: {
    ...typography.labelBold,
    color: colors.primary,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  clientDetailRow: { paddingTop: 4, gap: 2 },
  clientName: { ...typography.bodySm, fontWeight: '700', color: colors.onSurface, fontSize: 15 },
  clientMeta: { ...typography.metadata, color: colors.onSurfaceVariant, fontSize: 12 },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceContainerLow,
    padding: 6,
    borderRadius: borderRadius.md,
    marginTop: 4,
  },
  deliveryText: { ...typography.metadata, color: colors.onSurface, fontSize: 12 },
  paymentGrid: { gap: 6, paddingTop: 4 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paymentLabel: { ...typography.bodySm, color: colors.onSurfaceVariant, fontSize: 12 },
  paymentValue: { ...typography.bodySm, color: colors.onSurface, fontSize: 12 },
  paymentValueBold: { ...typography.labelBold, color: colors.onSurface, fontSize: 13 },
  balanceRow: {
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
    paddingTop: 6,
    marginTop: 2,
  },
  balanceLabel: { ...typography.labelBold, color: colors.onSurface, fontSize: 13 },
  balanceValue: { ...typography.headlineMd, fontSize: 15 },
  recipeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  recipeName: { ...typography.bodySm, fontWeight: '600', color: colors.onSurface },
  recipePriceSub: { ...typography.metadata, color: colors.onSurfaceVariant, fontSize: 11 },
  recipeSubtotal: { ...typography.labelBold, color: colors.onSurface, fontSize: 13 },
  totalOrderBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    marginTop: 4,
  },
  totalOrderLabel: { ...typography.titleSm, color: colors.onSurface, fontSize: 15 },
  totalOrderVal: { ...typography.headlineMd, color: colors.primary, fontSize: 18 },
  notesBox: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: 2,
  },
  notesTitle: { ...typography.labelBold, color: colors.onSurfaceVariant, fontSize: 11 },
  notesText: { ...typography.bodySm, color: colors.onSurface, fontSize: 12 },
  stockErrorDesc: { ...typography.bodySm, color: colors.onSurface, lineHeight: 20 },
});
