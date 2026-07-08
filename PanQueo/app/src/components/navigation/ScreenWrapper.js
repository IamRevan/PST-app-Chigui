import { SafeAreaView, StyleSheet } from 'react-native';
import { colors } from '../../lib/theme';

export const ScreenWrapper = ({ children, style }) => {
  return (
    <SafeAreaView style={[styles.container, style]}>
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
});
