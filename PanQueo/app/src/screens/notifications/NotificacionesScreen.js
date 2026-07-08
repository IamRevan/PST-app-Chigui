import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Card } from '../../components/ui';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';

const NOTIFICACIONES = [
  { id: '1', title: 'Stock bajo', message: 'Harina de Trigo está por debajo del mínimo (45 kg restantes)', date: 'Hace 2 horas', type: 'warning', read: false },
  { id: '2', title: 'Lote próximo a vencer', message: 'Lote #L-023 de Leche vence en 3 días', date: 'Hace 5 horas', type: 'critical', read: false },
  { id: '3', title: 'Pedido #P-102 completado', message: 'El pedido de María González está listo para entrega', date: 'Hace 1 día', type: 'success', read: true },
  { id: '4', title: 'Nuevo cliente registrado', message: 'Carlos Mendoza se ha registrado como cliente', date: 'Hace 2 días', type: 'info', read: true },
  { id: '5', title: 'Producción del día', message: 'La producción de hoy incluye 3 órdenes de Pan de Mantequilla', date: 'Hace 2 días', type: 'info', read: true },
  { id: '6', title: 'Ajuste de inventario', message: 'Se registró un ajuste de -0.5 kg en Azúcar Blanca', date: 'Hace 3 días', type: 'warning', read: true },
];

const typeConfig = {
  warning: { icon: '⚠️', bg: '#FFF8E1', border: '#FFE082' },
  critical: { icon: '🔴', bg: '#FFEBEE', border: '#EF9A9A' },
  success: { icon: '✅', bg: '#E8F5E9', border: '#A5D6A7' },
  info: { icon: 'ℹ️', bg: '#E3F2FD', border: '#90CAF9' },
};

export const NotificacionesScreen = ({ navigation }) => {
  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Notificaciones</Text>
          <TouchableOpacity onPress={() => Alert.alert('Notificaciones', 'Todas marcadas como leídas')}>
            <Text style={styles.markAll}>✓ Leídas</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          {['Todas', 'No leídas'].map((f) => (
            <TouchableOpacity key={f} style={[styles.filter, f === 'Todas' && styles.filterActive]}>
              <Text style={[styles.filterText, f === 'Todas' && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {NOTIFICACIONES.map((notif) => {
          const cfg = typeConfig[notif.type];
          return (
            <TouchableOpacity
              key={notif.id}
              style={[styles.notifCard, { backgroundColor: cfg.bg, borderLeftColor: cfg.border }, !notif.read && styles.notifUnread]}
              onPress={() => Alert.alert(notif.title, notif.message)}
            >
              <View style={styles.notifRow}>
                <Text style={styles.notifIcon}>{cfg.icon}</Text>
                <View style={styles.notifContent}>
                  <View style={styles.notifHeader}>
                    <Text style={styles.notifTitle}>{notif.title}</Text>
                    {!notif.read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.notifMessage} numberOfLines={2}>{notif.message}</Text>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  backIcon: { fontSize: 24, color: colors.onSurface },
  title: { ...typography.titleSm, color: colors.onSurface },
  markAll: { ...typography.labelBold, color: colors.primary },
  filterRow: { flexDirection: 'row', gap: spacing.base, marginBottom: spacing.sm },
  filter: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: colors.surfaceContainerLow },
  filterActive: { backgroundColor: colors.primaryContainer },
  filterText: { ...typography.labelCaption, color: colors.onSurfaceVariant },
  filterTextActive: { color: colors.onPrimaryContainer, fontWeight: '700' },
  notifCard: { padding: spacing.md, borderRadius: borderRadius.lg, borderLeftWidth: 4 },
  notifUnread: { ...shadows.sm },
  notifRow: { flexDirection: 'row', gap: spacing.sm },
  notifIcon: { fontSize: 20, marginTop: 2 },
  notifContent: { flex: 1 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.base },
  notifTitle: { ...typography.labelBold, color: colors.onSurface, flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  notifMessage: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },
  notifDate: { ...typography.metadata, color: colors.outline, marginTop: spacing.xs },
});
