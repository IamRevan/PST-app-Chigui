import { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, typography, spacing } from '../../lib/theme';

export const SplashScreen = ({ navigation }) => {
  const scale = new Animated.Value(0.6);
  const opacity = new Animated.Value(0);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigation?.replace('Login');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { transform: [{ scale }], opacity }]}>
        <Text style={styles.logo}>🧁</Text>
        <Text style={styles.appName}>PanQueo</Text>
        <Text style={styles.tagline}>Gestión inteligente para repostería</Text>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.loader}>
          <View style={styles.loaderRing} />
        </View>
        <Text style={styles.loaderText}>Tocando para comenzar...</Text>
        <Text style={styles.version}>v1.0.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  logo: {
    fontSize: 120,
    filter: 'drop-shadow(0 12px 24px rgba(120, 89, 0, 0.15))',
  },
  appName: {
    ...typography.displayLg,
    color: colors.onSurface,
  },
  tagline: {
    ...typography.bodyMd,
    color: colors.secondary,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
  loader: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderRing: {
    width: 40,
    height: 40,
    borderWidth: 3,
    borderColor: `${colors.primaryContainer}1A`,
    borderTopColor: colors.primaryContainer,
    borderRadius: 20,
  },
  loaderText: {
    ...typography.labelBold,
    color: colors.secondary,
  },
  version: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    opacity: 0.6,
  },
});
