import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../lib/theme';

export const ErrorMessage = ({ message }) => {
  if (!message) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.errorContainer,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  text: {
    ...typography.bodySm,
    color: colors.onErrorContainer,
  },
});
