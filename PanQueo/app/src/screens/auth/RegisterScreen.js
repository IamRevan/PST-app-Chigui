import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Button, Input, ErrorMessage } from '../../components/ui';
import { useForm } from '../../lib/hooks/useForm';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';
import { required, minLength } from '../../lib/utils/validators';
import apiClient from '../../lib/api/client';

export const RegisterScreen = ({ navigation }) => {
  const { values, errors, touched, handleChange, handleBlur, validateAll } = useForm(
    { nombre: '', apellido: '', email: '', telefono: '', password: '', confirmPassword: '' },
    {
      nombre: [required],
      apellido: [required],
      email: [required],
      telefono: [required],
      password: [required, minLength(12)],
      confirmPassword: [required],
    }
  );
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleRegister = async () => {
    if (!validateAll()) return;
    if (values.password !== values.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/api/auth/register', {
        nombre: values.nombre.trim(),
        apellido: values.apellido.trim(),
        email: values.email.trim(),
        telefono: values.telefono.trim(),
        password: values.password,
      });
      setResult({
        message: response.data?.message || 'Revisa tu correo para verificar la cuenta.',
      });
    } catch (err) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <ScreenWrapper>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>Revisa tu correo</Text>
              <Text style={styles.subtitle}>{result.message}</Text>
            </View>

            <Button
              title="Ir a iniciar sesión"
              onPress={() => navigation?.navigate('Login')}
              style={styles.button}
            />
          </View>
        </ScrollView>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>Crear Cuenta</Text>
              <Text style={styles.subtitle}>Regístrate para gestionar tu negocio</Text>
            </View>
            <ErrorMessage message={error} />
            <View style={styles.form}>
              <Input
                value={values.nombre}
                onChangeText={(v) => handleChange('nombre', v)}
                onBlur={() => handleBlur('nombre')}
                placeholder="Tu nombre"
                error={touched.nombre && errors.nombre}
                autoComplete="name-given"
                textContentType="givenName"
                autoCapitalize="words"
              />
              <Input
                value={values.apellido}
                onChangeText={(v) => handleChange('apellido', v)}
                onBlur={() => handleBlur('apellido')}
                placeholder="Tu apellido"
                error={touched.apellido && errors.apellido}
                autoComplete="name-family"
                textContentType="familyName"
                autoCapitalize="words"
              />
              <Input
                value={values.email}
                onChangeText={(v) => handleChange('email', v)}
                onBlur={() => handleBlur('email')}
                placeholder="tucorreo@ejemplo.com"
                error={touched.email && errors.email}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
              />
              <Input
                value={values.telefono}
                onChangeText={(v) => handleChange('telefono', v)}
                onBlur={() => handleBlur('telefono')}
                placeholder="+58 412 123 4567"
                error={touched.telefono && errors.telefono}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
              />
              <Input
                value={values.password}
                onChangeText={(v) => handleChange('password', v)}
                onBlur={() => handleBlur('password')}
                placeholder="Contraseña (mín. 12 caracteres)"
                error={touched.password && errors.password}
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
              />
              <Input
                value={values.confirmPassword}
                onChangeText={(v) => handleChange('confirmPassword', v)}
                onBlur={() => handleBlur('confirmPassword')}
                placeholder="Repite la contraseña"
                error={touched.confirmPassword && errors.confirmPassword}
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
              />
              <Text style={styles.hint}>
                Usa al menos 12 caracteres. Mejor una frase larga y fácil de recordar. No se
                permiten contraseñas comunes ni filtradas.
              </Text>
              <Button
                title="Registrarse"
                onPress={handleRegister}
                loading={loading}
                style={styles.button}
              />
            </View>
            <Text style={styles.footerText}>
              ¿Ya tienes cuenta?{' '}
              <Text
                style={styles.footerLink}
                onPress={() => navigation?.navigate('Login')}
              >
                Inicia sesión
              </Text>
            </Text>
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
  cardHeader: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: { ...typography.headlineMd, color: colors.onSurface },
  subtitle: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },
  form: { gap: spacing.md },
  hint: { ...typography.bodySm, color: colors.onSurfaceVariant },
  button: { marginTop: spacing.base },
  footerText: { ...typography.bodySm, color: colors.onSurfaceVariant, textAlign: 'center' },
  footerLink: { color: colors.primary, fontWeight: '600' },
});
