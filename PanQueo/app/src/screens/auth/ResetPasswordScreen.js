import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Button, Input, ErrorMessage } from '../../components/ui';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';
import apiClient from '../../lib/api/client';

export const ResetPasswordScreen = ({ navigation }) => {
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const solicitar = async () => {
    if (!email.trim()) {
      setError('Ingresa tu correo electrónico.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/api/auth/solicitar-recuperacion', {
        email: email.trim(),
      });
      setMessage(
        response.data?.message ||
        'Si el correo está registrado, recibirás las instrucciones para restablecer tu contraseña.'
      );
      setStep('sent');
    } catch (err) {
      setError(err.message || 'Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const restablecer = async () => {
    if (!token.trim()) {
      setError('Ingresa el token o código que recibiste.');
      return;
    }
    if (password.length < 12) {
      setError('La contraseña debe tener al menos 12 caracteres.');
      return;
    }
    if (password.length > 72) {
      setError('La contraseña no puede superar los 72 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/api/auth/restablecer-password', {
        token: token.trim(),
        password,
      });
      setMessage(response.data?.message || 'Contraseña actualizada. Inicia sesión.');
      setStep('done');
    } catch (err) {
      setError(err.message || 'No se pudo restablecer la contraseña');
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
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            {step === 'done' ? (
              <View style={styles.successContainer}>
                <Text style={styles.successIcon}>✓</Text>
                <Text style={styles.title}>Contraseña actualizada</Text>
                <Text style={styles.message}>{message}</Text>
                <Button
                  title="Volver al inicio"
                  onPress={() => navigation?.navigate('Login')}
                  style={styles.button}
                />
              </View>
            ) : step === 'reset' ? (
              <>
                <View style={styles.cardHeader}>
                  <Text style={styles.title}>Nueva contraseña</Text>
                  <Text style={styles.message}>
                    Pega el token de recuperación y elige una contraseña nueva (mínimo 12 caracteres).
                  </Text>
                </View>
                <ErrorMessage message={error} />
                <Input
                  value={token}
                  onChangeText={setToken}
                  placeholder="Token de recuperación"
                  autoComplete="one-time-code"
                  autoCorrect={false}
                />
                <Input
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Nueva contraseña"
                  secureTextEntry
                  autoComplete="new-password"
                  textContentType="newPassword"
                />
                <Input
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repite la contraseña"
                  secureTextEntry
                  autoComplete="new-password"
                  textContentType="newPassword"
                  onSubmitEditing={restablecer}
                />
                <Button title="Guardar contraseña" onPress={restablecer} loading={loading} />
                <Text style={styles.backLink} onPress={() => navigation?.navigate('Login')}>
                  Volver al inicio de sesión
                </Text>
              </>
            ) : step === 'sent' ? (
              <View style={styles.successContainer}>
                <Text style={styles.successIcon}>✓</Text>
                <Text style={styles.title}>Revisa tu correo</Text>
                <Text style={styles.message}>{message}</Text>

                <Button
                  title="Ya tengo un token"
                  onPress={() => {
                    setError(null);
                    setStep('reset');
                  }}
                  style={styles.button}
                />
                <Text style={styles.backLink} onPress={() => navigation?.navigate('Login')}>
                  Volver al inicio de sesión
                </Text>
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
                  value={email}
                  onChangeText={setEmail}
                  placeholder="tucorreo@ejemplo.com"
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  onSubmitEditing={solicitar}
                />
                <Button
                  title="Enviar enlace"
                  onPress={solicitar}
                  loading={loading}
                  style={styles.button}
                />
                <Text style={styles.backLink} onPress={() => navigation?.navigate('Login')}>
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
