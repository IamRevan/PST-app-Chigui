import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, typography, borderRadius, spacing } from '../../lib/theme';

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  icon,
}) => {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const bg = isPrimary ? colors.primaryContainer : isOutline ? 'transparent' : colors.primaryContainer;
  const txt = isPrimary ? colors.onPrimaryContainer : isOutline ? colors.primary : colors.onPrimaryContainer;
  const border = isOutline ? colors.outline : 'transparent';

  return (
    <TouchableOpacity
      style={[
        styles.base,
        { backgroundColor: bg, borderColor: border },
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.9}
    >
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={[styles.text, { color: disabled ? colors.onSurfaceVariant : txt }]}>
        {loading ? 'Cargando...' : title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    gap: spacing.base,
  },
  text: {
    ...typography.buttonText,
  },
  icon: {
    fontSize: 20,
  },
  disabled: {
    opacity: 0.5,
  },
});
