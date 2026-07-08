import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors, typography } from '../../lib/theme';

export const Loading = ({ message = 'Cargando...' }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginTop: 12,
  },
});
