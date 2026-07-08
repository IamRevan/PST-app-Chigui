import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';

const LINKS = [
  { icon: '📄', label: 'Términos y Condiciones' },
  { icon: '🛡️', label: 'Política de Privacidad' },
  { icon: '❓', label: 'Preguntas Frecuentes (FAQ)' },
];

export const AcercaDeScreen = ({ navigation }) => {
  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.logoSection}>
          <View style={styles.logoBox}>
            <Text style={styles.logoEmoji}>🧁</Text>
          </View>
          <Text style={styles.appName}>PanQueo</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Versión 1.0.0</Text>
          </View>
        </View>

        <View style={styles.badgesRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeIcon}>✅</Text>
            <Text style={styles.badgeTitle}>ISO 25010</Text>
            <Text style={styles.badgeSub}>Software Quality</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeIcon}>🔒</Text>
            <Text style={styles.badgeTitle}>ISO 27001</Text>
            <Text style={styles.badgeSub}>Information Security</Text>
          </View>
        </View>

        <View style={styles.linksSection}>
          {LINKS.map((item, i) => (
            <TouchableOpacity key={i} style={[styles.linkItem, i < LINKS.length - 1 && styles.linkBorder]}>
              <View style={styles.linkLeft}>
                <Text style={styles.linkIcon}>{item.icon}</Text>
                <Text style={styles.linkLabel}>{item.label}</Text>
              </View>
              <Text style={styles.linkArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 PanQueo. Hecho con 🧁 y mucho café.</Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 40, gap: spacing.xl, alignItems: 'center' },
  headerRow: { alignSelf: 'stretch' },
  backIcon: { fontSize: 24, color: colors.onSurface },
  logoSection: { alignItems: 'center', gap: spacing.md },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  logoEmoji: { fontSize: 48 },
  appName: { ...typography.displayLg, color: colors.primary },
  versionBadge: { backgroundColor: colors.primaryContainer, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: 999 },
  versionText: { ...typography.labelBold, color: colors.onPrimaryContainer },
  badgesRow: { flexDirection: 'row', gap: spacing.md, justifyContent: 'center' },
  badge: {
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    backgroundColor: `${colors.surfaceContainerLowest}CC`,
    width: 140,
    ...shadows.sm,
  },
  badgeIcon: { fontSize: 36, marginBottom: spacing.base },
  badgeTitle: { ...typography.labelBold, color: colors.onSurface },
  badgeSub: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.outline },
  linksSection: { alignSelf: 'stretch', gap: 0 },
  linkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
  },
  linkBorder: { marginBottom: spacing.base },
  linkLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  linkIcon: { fontSize: 20 },
  linkLabel: { ...typography.bodyMd, color: colors.onSurface },
  linkArrow: { fontSize: 20, color: colors.outline },
  footer: { marginTop: spacing.lg, alignItems: 'center' },
  footerText: { ...typography.bodySm, color: colors.onSurfaceVariant, textAlign: 'center' },
});
