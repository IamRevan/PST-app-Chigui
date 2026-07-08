import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Button, Input, ErrorMessage } from '../../components/ui';
import { useForm } from '../../lib/hooks/useForm';
import { useAuth } from '../../auth/AuthContext';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';
import { required } from '../../lib/utils/validators';
import apiClient from '../../lib/api/client';

export const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const { values, errors, touched, handleChange, handleBlur, validateAll } = useForm(
    { email: '', password: '' },
    { email: [required], password: [required] }
  );
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!validateAll()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/api/auth/login', values);
      await login(response.data.token, response.data.user);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.logoArea}>
            <Text style={styles.logo}>🧁</Text>
            <Text style={styles.appName}>PanQueo</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>¡Bienvenido de vuelta!</Text>
              <Text style={styles.subtitle}>Inicia sesión para gestionar tu negocio</Text>
            </View>
            <ErrorMessage message={error} />
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Input
                  value={values.email}
                  onChangeText={(v) => handleChange('email', v)}
                  onBlur={() => handleBlur('email')}
                  placeholder="tucorreo@ejemplo.com"
                  error={touched.email && errors.email}
                  keyboardType="email-address"
                />
              </View>
              <View style={styles.inputGroup}>
                <Input
                  value={values.password}
                  onChangeText={(v) => handleChange('password', v)}
                  onBlur={() => handleBlur('password')}
                  placeholder="••••••••"
                  error={touched.password && errors.password}
                  secureTextEntry
                />
              </View>
              <View style={styles.utilities}>
                <View style={styles.rememberRow}>
                  <View style={styles.checkbox} />
                  <Text style={styles.rememberText}>Recordarme</Text>
                </View>
                <Text
                  style={styles.forgotLink}
                  onPress={() => navigation?.navigate('ResetPassword')}
                >
                  ¿Olvidaste tu contraseña?
                </Text>
              </View>
              <Button
                title="Iniciar Sesión"
                onPress={handleLogin}
                loading={loading}
                style={styles.button}
              />
            </View>
            <Text style={styles.footerText}>
              ¿No tienes una cuenta?{' '}
              <Text
                style={styles.footerLink}
                onPress={() => navigation?.navigate('Register')}
              >
                Regístrate aquí
              </Text>
            </Text>
          </View>
          <View style={styles.securityBadge}>
            <Text style={styles.securityIcon}>✓</Text>
            <Text style={styles.securityText}>ISO 27001 Certified</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.gutter,
    paddingVertical: spacing.xl,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: { fontSize: 64 },
  appName: {
    ...typography.displayLgMobile,
    color: colors.primaryContainer,
    marginTop: spacing.base,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.md,
    gap: spacing.xl,
  },
  cardHeader: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.headlineMd,
    color: colors.onSurface,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
  },
  form: { gap: spacing.lg },
  inputGroup: {
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    paddingBottom: spacing.base,
  },
  utilities: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  rememberText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  forgotLink: {
    ...typography.bodySm,
    color: colors.primary,
    fontWeight: '600',
  },
  button: { marginTop: spacing.base },
  footerText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  footerLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: spacing.lg,
    gap: spacing.xs,
    backgroundColor: `${colors.primaryContainer}33`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${colors.primaryContainer}4D`,
  },
  securityIcon: {
    fontSize: 18,
    color: colors.primary,
    fontWeight: '700',
  },
  securityText: {
    ...typography.labelBold,
    color: colors.primary,
  },
});
