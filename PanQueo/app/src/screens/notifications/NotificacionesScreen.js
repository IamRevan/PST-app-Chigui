import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Loading } from '../../components/ui';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';
import { useAlertasInventario } from '../../lib/hooks/useInventario';

export const NotificacionesScreen = ({ navigation }) => {
  const { data: rawAlertas, loading, refetch } = useAlertasInventario();
  const [filter, setFilter] = useState('Todas');

  const proximos = Array.isArray(rawAlertas?.proximosAVencer) ? rawAlertas.proximosAVencer : [];
  const stockBajo = Array.isArray(rawAlertas?.stockBajo) ? rawAlertas.stockBajo : [];

  const notificaciones = [
    ...proximos.map((item, idx) => ({
      id: `venc-${idx}`,
      title: 'Lote próximo a vencer',
      message: `${item.ingrediente?.nombre_ing || 'Ingrediente'} (${item.cantidad || 0} ${item.ingrediente?.unidad_medida || 'unidades'}) vence en ${item.diasRestantes ?? 'pocos'} días.`,
      date: item.fechaVencimiento ? `Vence: ${item.fechaVencimiento}` : 'Próximo',
      type: 'critical',
      target: 'AlertasVencimiento',
    })),
    ...stockBajo.map((item, idx) => ({
      id: `stock-${idx}`,
      title: 'Stock bajo en inventario',
      message: `${item.nombre_ing} tiene ${item.stock_actual} ${item.unidad_medida} (mínimo requerido: ${item.stock_minimo} ${item.unidad_medida}).`,
      date: 'Alerta inmediata',
      type: 'warning',
      target: 'Inventario',
    })),
  ];

  const typeConfig = {
    warning: {
      icon: 'warning',
      color: colors.primary,
      bg: colors.surfaceContainerLow,
      border: colors.primaryContainer,
    },
    critical: {
      icon: 'error',
      color: colors.error,
      bg: '#FFF0F0',
      border: colors.error,
    },
    info: {
      icon: 'info',
      color: colors.outline,
      bg: colors.surfaceContainerLow,
      border: colors.outlineVariant,
    },
  };

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.backBtn}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.title}>Notificaciones y Alertas</Text>
          <TouchableOpacity
            onPress={() => {
              refetch();
              Alert.alert('Actualizado', 'Centro de notificaciones sincronizado con el inventario.');
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="refresh" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          {['Todas', 'Vencimientos', 'Stock Bajo'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filter, filter === f && styles.filterActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && <Loading />}

        {!loading && notificaciones.length === 0 && (
          <View style={styles.emptyCard}>
            <MaterialIcons name="check-circle" size={48} color={colors.tertiary} />
            <Text style={styles.emptyTitle}>Todo en orden</Text>
            <Text style={styles.emptySub}>No hay alertas críticas ni ingredientes próximos a vencer.</Text>
          </View>
        )}

        {notificaciones
          .filter((n) => {
            if (filter === 'Vencimientos') return n.type === 'critical';
            if (filter === 'Stock Bajo') return n.type === 'warning';
            return true;
          })
          .map((notif) => {
            const cfg = typeConfig[notif.type] || typeConfig.info;
            return (
              <TouchableOpacity
                key={notif.id}
                style={[styles.notifCard, { backgroundColor: cfg.bg, borderLeftColor: cfg.border }]}
                onPress={() => {
                  if (notif.target) {
                    navigation.navigate(notif.target);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.notifRow}>
                  <MaterialIcons name={cfg.icon} size={22} color={cfg.color} style={{ marginTop: 2 }} />
                  <View style={styles.notifContent}>
                    <View style={styles.notifHeader}>
                      <Text style={styles.notifTitle}>{notif.title}</Text>
                      <MaterialIcons name="chevron-right" size={18} color={colors.outline} />
                    </View>
                    <Text style={styles.notifMessage} numberOfLines={2}>
                      {notif.message}
                    </Text>
                    <Text style={styles.notifDate}>{notif.date}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 40, gap: spacing.sm },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingTop: 4,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: { ...typography.titleSm, color: colors.onSurface },
  filterRow: { flexDirection: 'row', gap: spacing.base, marginBottom: spacing.sm },
  filter: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerLow,
  },
  filterActive: { backgroundColor: colors.primaryContainer },
  filterText: { ...typography.labelCaption, color: colors.onSurfaceVariant },
  filterTextActive: { color: colors.onPrimaryContainer, fontWeight: '700' },
  notifCard: { padding: spacing.md, borderRadius: borderRadius.lg, borderLeftWidth: 4, ...shadows.sm },
  notifRow: { flexDirection: 'row', gap: spacing.sm },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notifTitle: { ...typography.labelBold, color: colors.onSurface, flex: 1 },
  notifMessage: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },
  notifDate: { ...typography.metadata, color: colors.outline, marginTop: spacing.xs },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: spacing.sm,
  },
  emptyTitle: { ...typography.titleSm, color: colors.onSurface },
  emptySub: { ...typography.bodySm, color: colors.onSurfaceVariant, textAlign: 'center', paddingHorizontal: 32 },
});
