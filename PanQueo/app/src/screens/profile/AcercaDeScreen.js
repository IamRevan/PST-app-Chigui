import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';

const LINKS = [
  { icon: 'description', label: 'Términos y Condiciones' },
  { icon: 'privacy-tip', label: 'Política de Privacidad' },
  { icon: 'help-outline', label: 'Preguntas Frecuentes (FAQ)' },
];

export const AcercaDeScreen = ({ navigation }) => {
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
          <Text style={styles.title}>Acerca de PanQueo</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.logoSection}>
          <View style={styles.logoBox}>
            <Image
              source={require('../../../assets/sparkle.png')}
              style={{ width: 64, height: 64, resizeMode: 'contain' }}
            />
          </View>
          <Text style={styles.appName}>PanQueo</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Versión 1.0.0 · SDK 58</Text>
          </View>
        </View>

        <View style={styles.badgesRow}>
          <View style={styles.badge}>
            <MaterialIcons name="verified" size={32} color={colors.primary} style={{ marginBottom: spacing.xs }} />
            <Text style={styles.badgeTitle}>ISO 25010</Text>
            <Text style={styles.badgeSub}>Calidad Software</Text>
          </View>
          <View style={styles.badge}>
            <MaterialIcons name="security" size={32} color={colors.primary} style={{ marginBottom: spacing.xs }} />
            <Text style={styles.badgeTitle}>ISO 27001</Text>
            <Text style={styles.badgeSub}>Seguridad Datos</Text>
          </View>
        </View>

        <View style={styles.linksSection}>
          {LINKS.map((item, i) => (
            <TouchableOpacity key={i} style={[styles.linkItem, i < LINKS.length - 1 && styles.linkBorder]} activeOpacity={0.7}>
              <View style={styles.linkLeft}>
                <MaterialIcons name={item.icon} size={22} color={colors.primary} />
                <Text style={styles.linkLabel}>{item.label}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 PanQueo. Repostería y Panadería Artesanal.</Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 40, gap: spacing.lg, alignItems: 'center' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingTop: 4,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: { ...typography.titleSm, color: colors.onSurface },
  logoSection: { alignItems: 'center', gap: spacing.xs },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  appName: { ...typography.displayLg, color: colors.primary, marginTop: spacing.sm },
  versionBadge: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  versionText: { ...typography.labelBold, color: colors.onPrimaryContainer, fontSize: 12 },
  badgesRow: { flexDirection: 'row', gap: spacing.md, justifyContent: 'center' },
  badge: {
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surfaceContainerLowest,
    width: 140,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  badgeTitle: { ...typography.labelBold, color: colors.onSurface },
  badgeSub: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.outline, marginTop: 2 },
  linksSection: { alignSelf: 'stretch', gap: 0 },
  linkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
  },
  linkBorder: { marginBottom: spacing.base },
  linkLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  linkLabel: { ...typography.bodyMd, color: colors.onSurface },
  footer: { marginTop: spacing.md, alignItems: 'center' },
  footerText: { ...typography.bodySm, color: colors.onSurfaceVariant, textAlign: 'center' },
});
