import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Button, Input, ErrorMessage } from '../../components/ui';
import { useForm } from '../../lib/hooks/useForm';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';
import { required } from '../../lib/utils/validators';
import apiClient from '../../lib/api/client';

export const ResetPasswordScreen = ({ navigation }) => {
  const { values, errors, touched, handleChange, handleBlur, validateAll } = useForm(
    { email: '' },
    { email: [required] }
  );
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!validateAll()) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/api/auth/reset-password', values);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Error al enviar solicitud');
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
          <View style={styles.card}>
            {sent ? (
              <View style={styles.successContainer}>
                <Text style={styles.successIcon}>✓</Text>
                <Text style={styles.title}>Revisa tu correo</Text>
                <Text style={styles.message}>
                  Te hemos enviado un enlace para restablecer tu contraseña.
                </Text>
                <Button
                  title="Volver al inicio"
                  onPress={() => navigation?.navigate('Login')}
                  style={styles.button}
                />
              </View>
            ) : (
              <>
                <View style={styles.cardHeader}>
                  <Text style={styles.title}>Restablecer Contraseña</Text>
                  <Text style={styles.message}>
                    Ingresa tu correo y te enviaremos las instrucciones.
                  </Text>
                </View>
                <ErrorMessage message={error} />
                <Input
                  value={values.email}
                  onChangeText={(v) => handleChange('email', v)}
                  onBlur={() => handleBlur('email')}
                  placeholder="tucorreo@ejemplo.com"
                  error={touched.email && errors.email}
                  keyboardType="email-address"
                />
                <Button
                  title="Enviar enlace"
                  onPress={handleReset}
                  loading={loading}
                  style={styles.button}
                />
                <Text
                  style={styles.backLink}
                  onPress={() => navigation?.goBack()}
                >
                  Volver al inicio de sesión
                </Text>
              </>
            )}
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
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.md,
    gap: spacing.lg,
  },
  cardHeader: { alignItems: 'center', gap: spacing.xs },
  successContainer: { alignItems: 'center', gap: spacing.md },
  successIcon: {
    fontSize: 48,
    color: colors.tertiary,
    fontWeight: '700',
  },
  title: { ...typography.headlineMd, color: colors.onSurface, textAlign: 'center' },
  message: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },
  button: { marginTop: spacing.base },
  backLink: {
    ...typography.bodySm,
    color: colors.primary,
    textAlign: 'center',
    fontWeight: '600',
  },
});
