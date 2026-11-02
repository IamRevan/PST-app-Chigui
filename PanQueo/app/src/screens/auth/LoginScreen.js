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
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mfaToken, setMfaToken] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);

  const completeLogin = async (response) => {
    const token = response.data?.data?.token || response.data?.token;
    const user = response.data?.data?.user || response.data?.user;
    if (!token || !user) {
      throw { message: 'Respuesta de autenticación no válida.' };
    }
    await login(token, user);
  };

  const verifyMfa = async () => {
    const code = mfaCode.trim();
    if (!code) {
      setError('Ingresa el código de verificación.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/api/auth/mfa/verificar', {
        mfa_token: mfaToken,
        code,
      });
      await completeLogin(response);
    } catch (err) {
      const code = err.data?.code;
      if (code === 'MFA_TOKEN_INVALIDO') {
        setMfaToken(null);
        setMfaCode('');
        setInfo(null);
        setError('La verificación expiró. Inicia sesión de nuevo.');
      } else if (code === 'MFA_INVALIDO') {
        setError('Código inválido. Revisa la hora de tu dispositivo o usa un código de recuperación.');
      } else {
        setError(err.message || 'No se pudo verificar el código.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (mfaToken) {
      await verifyMfa();
      return;
    }
    if (!validateAll()) return;

    setLoading(true);
    setError(null);
    setInfo(null);
    setNeedsVerification(false);
    try {
      const response = await apiClient.post('/api/auth/login', values);

      if (response.data?.status === 'mfa_required' || response.data?.code === 'MFA_REQUERIDO') {
        setMfaToken(response.data?.data?.mfa_token || null);
        setMfaCode('');
        setInfo('Ingresa el código de 6 dígitos de tu aplicación autenticadora o un código de recuperación.');
        return;
      }

      await completeLogin(response);
    } catch (err) {
      const code = err.data?.code;
      if (code === 'EMAIL_NO_VERIFICADO') {
        setNeedsVerification(true);
        setError('Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.');
      } else if (code === 'CUENTA_BLOQUEADA') {
        setError(err.message || 'Demasiados intentos fallidos. Intenta más tarde.');
      } else if (code === 'CREDENCIALES_INVALIDAS') {
        setError('Correo o contraseña incorrectos.');
      } else {
        setError(err.message || 'Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!values.email.trim()) {
      setError('Escribe tu correo para reenviar la verificación.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/api/auth/reenviar-verificacion', {
        email: values.email.trim(),
      });
      setInfo(
        response.data?.message ||
        'Si el correo está pendiente, enviamos un nuevo enlace de verificación.'
      );
    } catch (err) {
      setError(err.message || 'No se pudo reenviar la verificación.');
    } finally {
      setLoading(false);
    }
  };

  const volverAlLogin = () => {
    setMfaToken(null);
    setMfaCode('');
    setInfo(null);
    setError(null);
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoArea}>
            <Text style={styles.logo}>🧁</Text>
            <Text style={styles.appName}>PanQueo</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>{mfaToken ? 'Verificación en dos pasos' : '¡Bienvenido de vuelta!'}</Text>
              <Text style={styles.subtitle}>
                {mfaToken
                  ? 'Confirma tu identidad para continuar'
                  : 'Inicia sesión para gestionar tu negocio'}
              </Text>
            </View>
            <ErrorMessage message={error} />
            {info ? <Text style={styles.info}>{info}</Text> : null}
            {needsVerification ? (
              <Text style={styles.centerLink} onPress={resendVerification}>
                Reenviar correo de verificación
              </Text>
            ) : null}

            {mfaToken ? (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Input
                    value={mfaCode}
                    onChangeText={setMfaCode}
                    placeholder="123 456"
                    keyboardType="number-pad"
                    maxLength={11}
                    autoComplete="one-time-code"
                    textContentType="oneTimeCode"
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                </View>
                <Button
                  title="Verificar"
                  onPress={handleLogin}
                  loading={loading}
                  style={styles.button}
                />
                <Text style={styles.centerLink} onPress={volverAlLogin}>
                  Volver al inicio de sesión
                </Text>
              </View>
            ) : (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Input
                    value={values.email}
                    onChangeText={(v) => handleChange('email', v)}
                    onBlur={() => handleBlur('email')}
                    placeholder="tucorreo@ejemplo.com"
                    error={touched.email && errors.email}
                    keyboardType="email-address"
                    autoComplete="email"
                    textContentType="username"
                    returnKeyType="next"
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
                    autoComplete="current-password"
                    textContentType="password"
                    returnKeyType="go"
                    onSubmitEditing={handleLogin}
                  />
                </View>
                <View style={styles.utilities}>
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
            )}

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
            <Text style={styles.securityText}>Sesión protegida</Text>
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
    textAlign: 'center',
  },
  info: {
    ...typography.bodySm,
    color: colors.onSurface,
    backgroundColor: `${colors.primaryContainer}26`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  form: { gap: spacing.lg },
  inputGroup: {
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
    paddingBottom: spacing.base,
  },
  utilities: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  forgotLink: {
    ...typography.bodySm,
    color: colors.primary,
    fontWeight: '600',
  },
  centerLink: {
    ...typography.bodySm,
    color: colors.primary,
    fontWeight: '600',
    textAlign: 'center',
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
