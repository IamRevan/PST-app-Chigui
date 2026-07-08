import { View, TextInput, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../lib/theme';

export const Input = ({
  label,
  value,
  onChangeText,
  onBlur,
  placeholder,
  error,
  secureTextEntry,
  keyboardType,
  multiline,
  icon,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputRow, error && styles.inputError]}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <TextInput
          style={[styles.input, multiline && styles.multiline]}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.onSurfaceVariant}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          autoCapitalize="none"
        />
        {secureTextEntry && (
          <Text style={styles.eyeIcon}>visibility</Text>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.labelBold,
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    backgroundColor: 'transparent',
    paddingVertical: spacing.base,
    gap: spacing.sm,
  },
  inputError: {
    borderBottomColor: colors.error,
  },
  icon: {
    fontSize: 20,
    color: colors.secondary,
  },
  input: {
    ...typography.bodyMd,
    flex: 1,
    color: colors.onSurface,
    paddingVertical: 0,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  eyeIcon: {
    fontSize: 20,
    color: colors.secondary,
  },
  error: {
    ...typography.bodySm,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
