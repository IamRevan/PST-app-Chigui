import { View, StyleSheet } from 'react-native';
import { colors, borderRadius, spacing, shadows } from '../../lib/theme';

export const Card = ({ children, style, variant = 'elevated' }) => {
  return (
    <View
      style={[
        styles.card,
        variant === 'elevated' && shadows.md,
        variant === 'border' && styles.border,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  border: {
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
});
