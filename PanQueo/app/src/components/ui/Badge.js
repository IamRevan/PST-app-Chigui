import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../lib/theme';

const BADGE_VARIANTS = {
  success: { bg: colors.tertiaryFixed, text: colors.onTertiaryContainer },
  warning: { bg: colors.metricBg1, text: colors.metricText1 },
  critical: { bg: colors.errorContainer, text: colors.onErrorContainer },
  default: { bg: colors.surfaceContainerHighest, text: colors.onSurface },
  // Order-specific badges
  pendiente: { bg: colors.pendienteBg, text: colors.pendiente },
  enCocina: { bg: colors.enCocinaBg, text: colors.enCocina },
  listo: { bg: colors.listoBg, text: colors.listo },
  entregado: { bg: colors.entregadoBg, text: colors.entregado },
};

export const Badge = ({ label, variant = 'default', dot }) => {
  const palette = BADGE_VARIANTS[variant] || BADGE_VARIANTS.default;

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      {dot && <View style={[styles.dot, { backgroundColor: palette.text }]} />}
      <Text style={[styles.text, { color: palette.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    ...typography.metadata,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
