import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Card, Button } from '../../components/ui';
import { useAuth } from '../../auth/AuthContext';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';

const MENU_ITEMS = [
  { label: 'Configuración', icon: '⚙️', route: 'Configuracion' },
  { label: 'Seguridad', icon: '🔒', route: 'Seguridad' },
  { label: 'Mis Reportes', icon: '📄', route: 'Reportes' },
  { label: 'Ayuda', icon: '❓', route: 'AcercaDe' },
];

export const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Card style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>🧑‍🍳</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Configuracion')}>
              <Text style={styles.changePhoto}>Cambiar foto</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user?.nombre || 'Usuario PanQueo'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.rol || 'Administrador'}</Text>
            </View>
          </View>
          <View style={styles.contactInfo}>
            <Text style={styles.contactRow}>✉️ {user?.correo || 'usuario@panqueo.com'}</Text>
            <Text style={styles.contactRow}>📱 {user?.telefono || '+58 000 000 0000'}</Text>
          </View>
          <Button title="Editar Perfil" variant="primary" onPress={() => navigation.navigate('Configuracion')} style={styles.editBtn} />
        </Card>

        <Card style={styles.statsCard}>
          <Text style={styles.statsTitle}>ESTADÍSTICAS</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Usuario</Text>
            <Text style={styles.statValue}>{user?.usuario || 'panqueo'}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Rol</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{user?.rol || 'Administrador'} 🧁</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.menuCard}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.menuItem, i < MENU_ITEMS.length - 1 && styles.menuItemBorder]}
              onPress={() => navigation.navigate(item.route)}
            >
              <View style={styles.menuIcon}>
                <Text style={styles.menuIconText}>{item.icon}</Text>
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </Card>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 40, gap: spacing.md },
  profileCard: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  avatarContainer: { alignItems: 'center', gap: spacing.xs },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.surfaceContainerLowest,
    ...shadows.sm,
  },
  avatarText: { fontSize: 36 },
  changePhoto: { ...typography.labelBold, color: colors.primary },
  profileInfo: { alignItems: 'center', gap: spacing.xs },
  name: { ...typography.titleSm, color: colors.onSurface },
  roleBadge: {
    backgroundColor: colors.tertiaryContainer,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  roleText: { ...typography.metadata, fontWeight: '700', color: colors.onTertiaryContainer },
  contactInfo: { gap: spacing.xs, alignItems: 'center' },
  contactRow: { ...typography.bodySm, color: colors.onSurfaceVariant },
  editBtn: { width: '100%' },
  statsCard: { gap: spacing.sm },
  statsTitle: {
    ...typography.labelCaption,
    letterSpacing: 1,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.outlineVariant}4D`,
  },
  statLabel: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  statValue: { ...typography.labelBold, color: colors.onSurface },
  levelBadge: {
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  levelText: { ...typography.labelBold, fontSize: 13, color: colors.onSecondaryContainer },
  menuCard: { padding: 0, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: `${colors.outlineVariant}33`,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconText: { fontSize: 20 },
  menuLabel: { ...typography.labelBold, color: colors.onSurface, flex: 1 },
  menuArrow: { fontSize: 20, color: colors.onSurfaceVariant },
  logoutBtn: {
    padding: spacing.md,
    alignItems: 'center',
  },
  logoutText: {
    ...typography.labelBold,
    color: colors.error,
    fontSize: 16,
  },
});
