import { View, Text, StyleSheet, TouchableOpacity, useEffect, useRef } from 'react-native';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Button } from '../../components/ui';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';

export const PedidoExitosoScreen = ({ navigation }) => {
  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.successIcon}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>✅</Text>
          </View>
        </View>

        <Text style={styles.title}>¡Pedido Procesado con Éxito!</Text>
        <Text style={styles.subtitle}>El pedido #1045 ha pasado a producción y el inventario se ha actualizado correctamente.</Text>

        <View style={styles.summaryCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderId}>PEDIDO ID: #1045</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>En Cocina</Text>
            </View>
          </View>
          <View style={styles.items}>
            <View style={styles.itemRow}>
              <Text style={styles.itemIcon}>🎂</Text>
              <Text style={styles.itemName}>Pastel de Chocolate</Text>
            </View>
            <View style={styles.itemRow}>
              <Text style={styles.itemIcon}>🍩</Text>
              <Text style={styles.itemName}>Donas de Chocolate</Text>
            </View>
          </View>
          <View style={styles.fifoNotice}>
            <Text style={styles.fifoIcon}>📦</Text>
            <Text style={styles.fifoText}>Se ha aplicado el descuento FIFO a los ingredientes.</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button title="Ver Lista de Pedidos" variant="primary" onPress={() => navigation.navigate('Pedidos')} />
          <Button title="Ir al Dashboard" variant="outline" onPress={() => navigation.navigate('Dashboard')} />
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.gutter, gap: spacing.md },
  successIcon: { marginBottom: spacing.md },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.tertiaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  iconEmoji: { fontSize: 48 },
  title: { ...typography.headlineMd, color: colors.onSurface, textAlign: 'center' },
  subtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', maxWidth: 320 },
  summaryCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    gap: spacing.md,
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { ...typography.labelBold, color: colors.outline },
  statusBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 999 },
  statusText: { fontSize: 12, fontWeight: '700', color: '#1D4ED8', textTransform: 'uppercase' },
  items: { gap: spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemIcon: { fontSize: 20 },
  itemName: { ...typography.bodyMd, color: colors.onSurface },
  fifoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    backgroundColor: '#FFF8E1',
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primaryContainer,
  },
  fifoIcon: { fontSize: 16 },
  fifoText: { ...typography.bodySm, color: colors.onPrimaryContainer, flex: 1 },
  actions: { width: '100%', gap: spacing.sm, marginTop: spacing.md },
});
