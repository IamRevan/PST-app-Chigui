import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Card, Button } from '../../components/ui';
import { useAuth } from '../../auth/AuthContext';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';

const MENU_ITEMS = [
  { label: 'Configuración y Servidor', icon: 'settings', route: 'Configuracion' },
  { label: 'Seguridad de la Cuenta', icon: 'security', route: 'Seguridad' },
  { label: 'Reportes y Auditoría FEFO', icon: 'insert-chart', route: 'Reportes' },
  { label: 'Acerca de PanQueo', icon: 'help-outline', route: 'AcercaDe' },
];

export const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Card style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Image source={require('../../../assets/sparkle.png')} style={styles.avatarImage} />
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user?.nombre || 'Chef PanQueo'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user?.rol || 'Administrador'}</Text>
            </View>
          </View>
          <View style={styles.contactInfo}>
            <View style={styles.contactRow}>
              <MaterialIcons name="email" size={16} color={colors.primary} />
              <Text style={styles.contactText}>{user?.correo || 'usuario@panqueo.com'}</Text>
            </View>
            <View style={styles.contactRow}>
              <MaterialIcons name="phone" size={16} color={colors.primary} />
              <Text style={styles.contactText}>{user?.telefono || '+58 000 000 0000'}</Text>
            </View>
          </View>
          <Button
            title="Ajustes de Perfil"
            variant="outline"
            onPress={() => navigation.navigate('Configuracion')}
            style={styles.editBtn}
          />
        </Card>

        <Card style={styles.statsCard}>
          <Text style={styles.statsTitle}>INFORMACIÓN DEL SISTEMA</Text>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Identificador</Text>
            <Text style={styles.statValue}>{user?.usuario || 'panqueo_admin'}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Rol Operativo</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{user?.rol || 'Administrador'}</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.menuCard}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.menuItem, i < MENU_ITEMS.length - 1 && styles.menuItemBorder]}
              onPress={() => navigation.navigate(item.route)}
              activeOpacity={0.7}
            >
              <View style={styles.menuIcon}>
                <MaterialIcons name={item.icon} size={22} color={colors.primary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
            </TouchableOpacity>
          ))}
        </Card>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
          <MaterialIcons name="logout" size={18} color={colors.error} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 100, gap: spacing.sm },
  profileCard: {
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
    borderRadius: borderRadius.xl,
  },
  avatarContainer: { alignItems: 'center' },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: colors.primaryContainer,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerLow,
    ...shadows.sm,
  },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  profileInfo: { alignItems: 'center', gap: 4 },
  name: { ...typography.headlineMd, fontSize: 18, color: colors.onSurface },
  roleBadge: {
    backgroundColor: `${colors.primaryContainer}30`,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  roleText: { ...typography.labelCaption, color: colors.primary, fontWeight: '700' },
  contactInfo: { gap: 4, alignItems: 'center', marginVertical: 4 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactText: { ...typography.bodySm, color: colors.onSurfaceVariant, fontSize: 13 },
  editBtn: { width: '100%', marginTop: spacing.xs },
  statsCard: { padding: spacing.md, gap: spacing.xs, borderRadius: borderRadius.lg },
  statsTitle: { ...typography.labelBold, fontSize: 11, color: colors.outline, textTransform: 'uppercase' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  statLabel: { ...typography.bodySm, color: colors.onSurfaceVariant, fontSize: 13 },
  statValue: { ...typography.labelBold, color: colors.onSurface, fontSize: 13 },
  levelBadge: { backgroundColor: colors.metricBg1, paddingHorizontal: 8, paddingVertical: 2, borderRadius: borderRadius.md },
  levelText: { ...typography.labelCaption, color: colors.primary, fontWeight: '700' },
  menuCard: { padding: 0, borderRadius: borderRadius.lg, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    gap: 12,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.surfaceVariant },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: { ...typography.bodySm, flex: 1, color: colors.onSurface, fontWeight: '600' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: `${colors.error}40`,
    backgroundColor: 'rgba(255,82,82,0.06)',
    marginTop: spacing.xs,
  },
  logoutText: { ...typography.buttonText, color: colors.error, fontSize: 14 },
});
