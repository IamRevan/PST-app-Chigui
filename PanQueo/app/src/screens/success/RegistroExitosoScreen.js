import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Button } from '../../components/ui';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';

export const RegistroExitosoScreen = ({ navigation }) => {
  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.logoArea}>
          <Text style={styles.logoEmoji}>🧁</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.iconSection}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>🎂</Text>
            </View>
            <View style={styles.rewardChip}>
              <Text style={styles.rewardIcon}>⭐</Text>
              <Text style={styles.rewardText}>+50 Puntos</Text>
            </View>
          </View>

          <Text style={styles.title}>¡Registro Exitoso!</Text>
          <Text style={styles.subtitle}>Tu cuenta ha sido creada correctamente. Ya puedes comenzar a gestionar tu panadería.</Text>

          <View style={styles.divider} />

          <Button
            title="Ir al Inicio de Sesión"
            variant="primary"
            onPress={() => navigation.navigate('Login')}
            style={styles.actionBtn}
          />

          <View style={styles.footerBadges}>
            <View style={styles.footerBadge}>
              <Text style={styles.footerIcon}>🔒</Text>
              <Text style={styles.footerLabel}>Conexión segura</Text>
            </View>
          </View>
        </View>

        <Text style={styles.helpText}>
          ¿Necesitas ayuda? <Text style={styles.helpLink}>Contactar soporte</Text>
        </Text>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.gutter, gap: spacing.xl },
  logoArea: { alignItems: 'center' },
  logoEmoji: { fontSize: 48 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    alignItems: 'center',
    gap: spacing.lg,
    ...shadows.md,
  },
  iconSection: { position: 'relative', alignItems: 'center', paddingVertical: spacing.md },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primaryContainer}33`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: { fontSize: 48, color: colors.primary },
  rewardChip: {
    position: 'absolute',
    top: -spacing.base,
    right: -spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    ...shadows.sm,
  },
  rewardIcon: { fontSize: 14 },
  rewardText: { ...typography.labelBold, fontSize: 12, color: colors.primaryContainer },
  title: { ...typography.headlineMd, color: colors.onSurface, textAlign: 'center' },
  subtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', paddingHorizontal: spacing.sm },
  divider: { height: 1, width: '100%', backgroundColor: `${colors.outlineVariant}4D` },
  actionBtn: { width: '100%' },
  footerBadges: { flexDirection: 'row', gap: spacing.md, paddingTop: spacing.sm },
  footerBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, opacity: 0.6 },
  footerIcon: { fontSize: 14 },
  footerLabel: { ...typography.labelBold, fontSize: 12 },
  helpText: { ...typography.bodySm, color: colors.onSurfaceVariant, textAlign: 'center' },
  helpLink: { ...typography.labelBold, color: colors.primary },
});
