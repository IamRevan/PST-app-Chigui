import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Button, Card, Input } from '../../components/ui';
import { useAuth } from '../../auth/AuthContext';
import apiClient from '../../lib/api/client';
import { ENDPOINTS } from '../../lib/api/endpoints';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';

const ETIQUETAS_EVENTO = {
  login_exitoso: 'Inicio de sesión',
  login_fallido: 'Intento fallido',
  login_bloqueado: 'Cuenta bloqueada',
  login_rechazado: 'Inicio rechazado',
  logout: 'Cierre de sesión',
  logout_global: 'Cierre de todas las sesiones',
  registro: 'Registro',
  registro_duplicado: 'Registro duplicado',
  email_verificado: 'Correo verificado',
  verificacion_reenviada: 'Verificación reenviada',
  recuperacion_solicitada: 'Recuperación solicitada',
  password_restablecida: 'Contraseña restablecida',
  password_cambiada: 'Contraseña cambiada',
  cambio_password_rechazado: 'Cambio de contraseña rechazado',
  email_cambiado: 'Correo cambiado',
  mfa_reto: 'Reto de verificación en dos pasos',
  mfa_fallido: 'Código de verificación inválido',
  mfa_activado: 'Verificación en dos pasos activada',
  mfa_desactivado: 'Verificación en dos pasos desactivada',
  mfa_recuperacion_usada: 'Código de recuperación usado',
  sesion_revocada: 'Sesión revocada',
};

const formatearFecha = (valor) => {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  try {
    return fecha.toLocaleString('es-VE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return fecha.toISOString();
  }
};

const esAppMovil = (userAgent) => {
  const ua = String(userAgent || '');
  return /okhttp|CFNetwork|Expo|Exponent/i.test(ua) && !/Mozilla/i.test(ua);
};

const describirDispositivo = (userAgent) => {
  const ua = String(userAgent || '');
  if (!ua) return 'Dispositivo desconocido';

  if (esAppMovil(ua)) {
    return /Android|okhttp/i.test(ua) ? 'App móvil · Android' : 'App móvil · iOS';
  }

  const navegador = /Edg\//.test(ua) ? 'Edge'
    : /OPR\//.test(ua) ? 'Opera'
      : /Chrome\//.test(ua) ? 'Chrome'
        : /Firefox\//.test(ua) ? 'Firefox'
          : /Safari\//.test(ua) ? 'Safari'
            : 'Navegador';

  const sistema = /Windows/.test(ua) ? 'Windows'
    : /Android/.test(ua) ? 'Android'
      : /iPhone|iPad|iOS/.test(ua) ? 'iOS'
        : /Mac OS X/.test(ua) ? 'macOS'
          : /Linux/.test(ua) ? 'Linux'
            : '';

  return sistema ? `${navegador} · ${sistema}` : navegador;
};

const confirmar = ({ titulo, mensaje, textoConfirmar = 'Confirmar' }) => new Promise((resolve) => {
  if (Platform.OS === 'web') {
    const aceptado = typeof window !== 'undefined'
      ? window.confirm(`${titulo}\n\n${mensaje}`)
      : true;
    resolve(aceptado);
    return;
  }

  Alert.alert(
    titulo,
    mensaje,
    [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      { text: textoConfirmar, style: 'destructive', onPress: () => resolve(true) },
    ],
    { cancelable: true, onDismiss: () => resolve(false) },
  );
});

export const SeguridadScreen = ({ navigation }) => {
  const { logout } = useAuth();

  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [ocupado, setOcupado] = useState(null);
  const [aviso, setAviso] = useState(null);

  const [mfa, setMfa] = useState({ habilitado: false, pendiente: false, codigos_restantes: 0 });
  const [mfaPassword, setMfaPassword] = useState('');
  const [mfaSetup, setMfaSetup] = useState(null);
  const [mfaCodigo, setMfaCodigo] = useState('');
  const [codigosRecuperacion, setCodigosRecuperacion] = useState([]);
  const [mostrarBajaMfa, setMostrarBajaMfa] = useState(false);
  const [bajaPassword, setBajaPassword] = useState('');
  const [bajaCodigo, setBajaCodigo] = useState('');

  const [passActual, setPassActual] = useState('');
  const [passNueva, setPassNueva] = useState('');
  const [passConfirmar, setPassConfirmar] = useState('');

  const [sesiones, setSesiones] = useState([]);
  const [eventos, setEventos] = useState([]);

  const avisar = (tipo, texto) => setAviso({ tipo, texto });

  const aplicarEstadoMfa = (data) => setMfa({
    habilitado: Boolean(data?.habilitado),
    pendiente: Boolean(data?.pendiente),
    codigos_restantes: Number(data?.codigos_restantes) || 0,
  });

  const cargarMfa = useCallback(async () => {
    const res = await apiClient.get(ENDPOINTS.MFA_ESTADO);
    aplicarEstadoMfa(res.data?.data);
  }, []);

  const cargarSesiones = useCallback(async () => {
    const res = await apiClient.get(ENDPOINTS.SESIONES);
    setSesiones(res.data?.data || []);
  }, []);

  const cargarEventos = useCallback(async () => {
    const res = await apiClient.get(ENDPOINTS.EVENTOS, { params: { limit: 10 } });
    setEventos(res.data?.data || []);
  }, []);

  const cargarTodo = useCallback(async () => {
    const resultados = await Promise.allSettled([
      cargarMfa(),
      cargarSesiones(),
      cargarEventos(),
    ]);

    const fallos = resultados.filter((resultado) => resultado.status === 'rejected');
    if (fallos.length) {
      setAviso({
        tipo: 'error',
        texto: fallos[0].reason?.message || 'No se pudo cargar toda la información de seguridad.',
      });
    }

    setCargando(false);
    setRefrescando(false);
  }, [cargarMfa, cargarSesiones, cargarEventos]);

  useFocusEffect(
    useCallback(() => {
      cargarTodo();
    }, [cargarTodo]),
  );

  const iniciarMfa = async () => {
    if (!mfaPassword) {
      avisar('error', 'Confirma tu contraseña para activar la verificación en dos pasos.');
      return;
    }

    setOcupado('mfa-iniciar');
    setAviso(null);
    try {
      const res = await apiClient.post(ENDPOINTS.MFA_INICIAR, { password: mfaPassword });
      const data = res.data?.data || {};
      setMfaSetup({ secreto: data.secreto || '', uri: data.otpauth_uri || '' });
      setMfaPassword('');
      setMfaCodigo('');
      avisar('ok', 'Escanea o copia el secreto en tu aplicación autenticadora.');
    } catch (error) {
      avisar('error', error.message || 'No se pudo iniciar la configuración de MFA.');
    } finally {
      setOcupado(null);
    }
  };

  const activarMfa = async () => {
    const codigo = mfaCodigo.trim();
    if (!/^\d{6}$/.test(codigo)) {
      avisar('error', 'Ingresa el código de 6 dígitos de tu aplicación autenticadora.');
      return;
    }

    setOcupado('mfa-activar');
    setAviso(null);
    try {
      const res = await apiClient.post(ENDPOINTS.MFA_ACTIVAR, { code: codigo });
      const codigos = res.data?.data?.codigos_recuperacion || [];
      setCodigosRecuperacion(codigos);
      setMfaSetup(null);
      setMfaCodigo('');
      await cargarMfa();
      await cargarEventos();
      avisar('ok', 'Verificación en dos pasos activada. Guarda tus códigos de recuperación.');
    } catch (error) {
      avisar('error', error.message || 'No se pudo activar la verificación en dos pasos.');
    } finally {
      setOcupado(null);
    }
  };

  const desactivarMfa = async () => {
    if (!bajaPassword || !bajaCodigo.trim()) {
      avisar('error', 'Confirma tu contraseña e ingresa un código vigente.');
      return;
    }

    const aceptado = await confirmar({
      titulo: 'Desactivar verificación en dos pasos',
      mensaje: 'Tu cuenta quedará protegida solamente con la contraseña.',
      textoConfirmar: 'Desactivar',
    });
    if (!aceptado) return;

    setOcupado('mfa-desactivar');
    setAviso(null);
    try {
      await apiClient.post(ENDPOINTS.MFA_DESACTIVAR, {
        password: bajaPassword,
        code: bajaCodigo.trim(),
      });
      setBajaPassword('');
      setBajaCodigo('');
      setMostrarBajaMfa(false);
      setCodigosRecuperacion([]);
      await cargarMfa();
      await cargarEventos();
      avisar('ok', 'Verificación en dos pasos desactivada.');
    } catch (error) {
      avisar('error', error.message || 'No se pudo desactivar la verificación en dos pasos.');
    } finally {
      setOcupado(null);
    }
  };

  const cambiarPassword = async () => {
    if (!passActual || !passNueva) {
      avisar('error', 'Completa tu contraseña actual y la nueva.');
      return;
    }
    if (passNueva.length < 12) {
      avisar('error', 'La nueva contraseña debe tener al menos 12 caracteres.');
      return;
    }
    if (passNueva.length > 72) {
      avisar('error', 'La nueva contraseña no puede superar los 72 caracteres.');
      return;
    }
    if (passNueva !== passConfirmar) {
      avisar('error', 'Las contraseñas nuevas no coinciden.');
      return;
    }
    if (passNueva === passActual) {
      avisar('error', 'La nueva contraseña debe ser diferente a la actual.');
      return;
    }

    setOcupado('password');
    setAviso(null);
    try {
      const res = await apiClient.post(ENDPOINTS.CAMBIAR_PASSWORD, {
        password_actual: passActual,
        password_nueva: passNueva,
      });
      setPassActual('');
      setPassNueva('');
      setPassConfirmar('');
      await cargarSesiones();
      await cargarEventos();
      avisar('ok', res.data?.message || 'Contraseña actualizada. Cerramos las demás sesiones por seguridad.');
    } catch (error) {
      avisar('error', error.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setOcupado(null);
    }
  };

  const revocarSesion = async (sesion) => {
    const actual = Boolean(sesion.actual);
    const aceptado = await confirmar({
      titulo: actual ? 'Cerrar esta sesión' : 'Revocar sesión',
      mensaje: actual
        ? 'Se cerrará tu sesión actual y volverás a la pantalla de inicio de sesión.'
        : 'El dispositivo perderá el acceso de inmediato.',
      textoConfirmar: actual ? 'Cerrar sesión' : 'Revocar',
    });
    if (!aceptado) return;

    setOcupado(`sesion-${sesion.id}`);
    setAviso(null);
    try {
      await apiClient.delete(ENDPOINTS.SESION_BY_ID(sesion.id));
      if (actual) {
        await logout();
        return;
      }
      await cargarSesiones();
      await cargarEventos();
      avisar('ok', 'Sesión revocada.');
    } catch (error) {
      avisar('error', error.message || 'No se pudo revocar la sesión.');
    } finally {
      setOcupado(null);
    }
  };

  const cerrarTodasLasSesiones = async () => {
    const aceptado = await confirmar({
      titulo: 'Cerrar todas las sesiones',
      mensaje: 'Se cerrará esta sesión y todas las demás. Tendrás que iniciar sesión de nuevo.',
      textoConfirmar: 'Cerrar todas',
    });
    if (!aceptado) return;

    setOcupado('logout-todos');
    setAviso(null);
    try {
      await apiClient.post(ENDPOINTS.LOGOUT_TODOS);
    } catch (error) {
      // Aunque falle la red, cerramos localmente para no dejar la sesión abierta.
      console.warn('[seguridad] logout-todos:', error.message);
    } finally {
      await logout();
    }
  };

  const refrescar = () => {
    setRefrescando(true);
    cargarTodo();
  };

  const renderAviso = () => {
    if (!aviso) return null;
    const esError = aviso.tipo === 'error';
    return (
      <View style={[styles.aviso, esError ? styles.avisoError : styles.avisoOk]}>
        <MaterialIcons
          name={esError ? 'error-outline' : 'check-circle-outline'}
          size={18}
          color={esError ? colors.error : colors.tertiary}
        />
        <Text
          style={[styles.avisoTexto, { color: esError ? colors.onErrorContainer : colors.onTertiaryContainer }]}
          accessibilityLiveRegion="polite"
        >
          {aviso.texto}
        </Text>
        <TouchableOpacity onPress={() => setAviso(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="close" size={18} color={esError ? colors.error : colors.tertiary} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderMfa = () => (
    <Card style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name="verified-user" size={22} color={colors.primary} />
        <Text style={styles.sectionTitle}>Verificación en dos pasos</Text>
      </View>

      <View style={styles.statusRow}>
        <View style={[styles.estadoPill, mfa.habilitado ? styles.estadoOn : styles.estadoOff]}>
          <Text style={[styles.estadoTexto, mfa.habilitado ? styles.estadoTextoOn : styles.estadoTextoOff]}>
            {mfa.habilitado ? 'Activa' : 'Desactivada'}
          </Text>
        </View>
        {mfa.habilitado && (
          <Text style={styles.statusMeta}>
            {mfa.codigos_restantes} código{mfa.codigos_restantes === 1 ? '' : 's'} de recuperación
          </Text>
        )}
      </View>

      <Text style={styles.helpText}>
        {mfa.habilitado
          ? 'Además de tu contraseña, la app pedirá un código temporal de tu autenticador al iniciar sesión.'
          : 'Añade un segundo factor con Google Authenticator, Authy o 1Password. Es opcional, pero muy recomendable.'}
      </Text>

      {!mfa.habilitado && !mfaSetup && (
        <View style={styles.formGroup}>
          {mfa.pendiente && (
            <Text style={styles.helpText}>
              Hay una configuración pendiente. Iníciala de nuevo para obtener la clave secreta.
            </Text>
          )}
          <Input
            label="Contraseña actual"
            value={mfaPassword}
            onChangeText={setMfaPassword}
            placeholder="Confirma tu contraseña"
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            style={styles.inputSinMargen}
          />
          <Button
            title="Comenzar configuración"
            onPress={iniciarMfa}
            loading={ocupado === 'mfa-iniciar'}
            disabled={Boolean(ocupado)}
          />
        </View>
      )}

      {!mfa.habilitado && mfaSetup && (
        <View style={styles.formGroup}>
          <Text style={styles.stepText}>1. Abre tu aplicación autenticadora y añade una cuenta con esta clave:</Text>
          <View style={styles.secretBox}>
            <Text style={styles.secretLabel}>Clave secreta</Text>
            <Text selectable style={styles.secretValue}>{mfaSetup.secreto}</Text>
          </View>
          <Text selectable style={styles.uriText}>{mfaSetup.uri}</Text>
          <Text style={styles.stepText}>2. Escribe el código de 6 dígitos que muestra la app:</Text>
          <Input
            label="Código de verificación"
            value={mfaCodigo}
            onChangeText={setMfaCodigo}
            placeholder="123456"
            keyboardType="number-pad"
            maxLength={6}
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            style={styles.inputSinMargen}
          />
          <Button
            title="Activar verificación en dos pasos"
            onPress={activarMfa}
            loading={ocupado === 'mfa-activar'}
            disabled={Boolean(ocupado)}
          />
          <Button
            title="Cancelar"
            variant="outline"
            onPress={() => {
              setMfaSetup(null);
              setMfaCodigo('');
            }}
            disabled={Boolean(ocupado)}
          />
        </View>
      )}

      {mfa.habilitado && (
        <View style={styles.formGroup}>
          <Button
            title={mostrarBajaMfa ? 'Cancelar desactivación' : 'Desactivar verificación en dos pasos'}
            variant="outline"
            onPress={() => setMostrarBajaMfa((previo) => !previo)}
            disabled={Boolean(ocupado)}
          />
          {mostrarBajaMfa && (
            <View style={styles.formGroup}>
              <Text style={styles.helpText}>
                Confirma con tu contraseña y un código vigente. También sirve uno de tus códigos de recuperación.
              </Text>
              <Input
                label="Contraseña actual"
                value={bajaPassword}
                onChangeText={setBajaPassword}
                placeholder="Confirma tu contraseña"
                secureTextEntry
                autoComplete="current-password"
                textContentType="password"
                style={styles.inputSinMargen}
              />
              <Input
                label="Código o código de recuperación"
                value={bajaCodigo}
                onChangeText={setBajaCodigo}
                placeholder="123456 o XXXXX-XXXXX"
                autoCapitalize="characters"
                maxLength={14}
                style={styles.inputSinMargen}
              />
              <TouchableOpacity
                style={[styles.dangerBtn, Boolean(ocupado) && styles.disabled]}
                onPress={desactivarMfa}
                disabled={Boolean(ocupado)}
                activeOpacity={0.85}
              >
                <MaterialIcons name="gpp-bad" size={18} color={colors.error} />
                <Text style={styles.dangerBtnText}>
                  {ocupado === 'mfa-desactivar' ? 'Desactivando…' : 'Desactivar'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </Card>
  );

  const renderRecoveryCodes = () => {
    if (!codigosRecuperacion.length) return null;
    return (
      <Card style={[styles.section, styles.recoveryCard]}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="key" size={22} color={colors.primary} />
          <Text style={styles.sectionTitle}>Códigos de recuperación</Text>
        </View>
        <Text style={styles.helpText}>
          Guárdalos en un lugar seguro. Cada código sirve una sola vez si pierdes el teléfono.
        </Text>
        <View style={styles.recoveryGrid}>
          {codigosRecuperacion.map((codigo) => (
            <Text key={codigo} selectable style={styles.recoveryCode}>{codigo}</Text>
          ))}
        </View>
        <Button
          title="Ya guardé los códigos"
          variant="outline"
          onPress={() => setCodigosRecuperacion([])}
        />
      </Card>
    );
  };

  const renderPassword = () => (
    <Card style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name="lock-reset" size={22} color={colors.primary} />
        <Text style={styles.sectionTitle}>Cambiar contraseña</Text>
      </View>
      <Text style={styles.helpText}>
        Usa al menos 12 caracteres. No necesitas mayúsculas, números ni símbolos obligatorios.
      </Text>
      <Input
        label="Contraseña actual"
        value={passActual}
        onChangeText={setPassActual}
        placeholder="••••••••"
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        style={styles.inputSinMargen}
      />
      <Input
        label="Nueva contraseña"
        value={passNueva}
        onChangeText={setPassNueva}
        placeholder="Mínimo 12 caracteres"
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        maxLength={72}
        style={styles.inputSinMargen}
      />
      <Input
        label="Confirmar nueva contraseña"
        value={passConfirmar}
        onChangeText={setPassConfirmar}
        placeholder="Repite la nueva contraseña"
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        maxLength={72}
        style={styles.inputSinMargen}
      />
      <Button
        title="Actualizar contraseña"
        onPress={cambiarPassword}
        loading={ocupado === 'password'}
        disabled={Boolean(ocupado)}
      />
      <Text style={styles.footnote}>
        Al cambiarla se cierran tus otras sesiones; esta se mantiene activa.
      </Text>
    </Card>
  );

  const renderSesiones = () => (
    <Card style={styles.section}>
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="devices" size={22} color={colors.primary} />
          <Text style={styles.sectionTitle}>Sesiones activas</Text>
        </View>
        <Text style={styles.countText}>{sesiones.length}</Text>
      </View>

      {sesiones.length === 0 ? (
        <Text style={styles.helpText}>No hay sesiones activas.</Text>
      ) : (
        <View style={styles.list}>
          {sesiones.map((sesion) => {
            const actual = Boolean(sesion.actual);
            const revocando = ocupado === `sesion-${sesion.id}`;
            return (
              <View key={sesion.id} style={styles.sessionItem}>
                <View style={styles.sessionIcon}>
                  <MaterialIcons
                    name={esAppMovil(sesion.user_agent) ? 'smartphone' : 'computer'}
                    size={22}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.sessionInfo}>
                  <View style={styles.sessionTitleRow}>
                    <Text style={styles.sessionName} numberOfLines={1}>
                      {describirDispositivo(sesion.user_agent)}
                    </Text>
                    {actual && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>Esta sesión</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.sessionMeta}>IP {sesion.ip || 'desconocida'}</Text>
                  <Text style={styles.sessionMeta}>Inicio {formatearFecha(sesion.creada_at)}</Text>
                  <Text style={styles.sessionMeta}>Expira {formatearFecha(sesion.expira_at)}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => revocarSesion(sesion)}
                  disabled={Boolean(ocupado)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={[styles.linkBtn, Boolean(ocupado) && styles.disabled]}
                >
                  <Text style={styles.linkDanger}>{revocando ? '…' : actual ? 'Cerrar' : 'Revocar'}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      <TouchableOpacity
        style={[styles.dangerBtn, Boolean(ocupado) && styles.disabled]}
        onPress={cerrarTodasLasSesiones}
        disabled={Boolean(ocupado)}
        activeOpacity={0.85}
      >
        <MaterialIcons name="logout" size={18} color={colors.error} />
        <Text style={styles.dangerBtnText}>
          {ocupado === 'logout-todos' ? 'Cerrando sesiones…' : 'Cerrar todas las sesiones'}
        </Text>
      </TouchableOpacity>
      <Text style={styles.footnote}>Cada sesión dura como máximo 12 horas y puede revocarse al instante.</Text>
    </Card>
  );

  const renderEventos = () => (
    <Card style={styles.section}>
      <View style={styles.sectionHeader}>
        <MaterialIcons name="history" size={22} color={colors.primary} />
        <Text style={styles.sectionTitle}>Actividad reciente</Text>
      </View>

      {eventos.length === 0 ? (
        <Text style={styles.helpText}>Todavía no hay actividad registrada.</Text>
      ) : (
        <View style={styles.list}>
          {eventos.map((evento) => (
            <View key={evento.id_evento} style={styles.eventItem}>
              <View style={[styles.eventDot, !evento.exito && styles.eventDotError]} />
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{ETIQUETAS_EVENTO[evento.tipo] || evento.tipo}</Text>
                <Text style={styles.eventMeta}>
                  {formatearFecha(evento.created_at)}{evento.ip ? ` · IP ${evento.ip}` : ''}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </Card>
  );

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={(
          <RefreshControl
            refreshing={refrescando}
            onRefresh={refrescar}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        )}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Volver"
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Seguridad y Acceso</Text>
          <View style={{ width: 44 }} />
        </View>

        {renderAviso()}

        {cargando ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando información de seguridad…</Text>
          </View>
        ) : (
          <>
            {renderMfa()}
            {renderRecoveryCodes()}
            {renderPassword()}
            {renderSesiones()}
            {renderEventos()}
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 40, gap: spacing.md },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: { ...typography.titleSm, color: colors.onSurface },
  aviso: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  avisoOk: {
    backgroundColor: colors.metricBg4,
    borderColor: colors.metricBorder4,
  },
  avisoError: {
    backgroundColor: colors.errorContainer,
    borderColor: '#ffb4ab',
  },
  avisoTexto: { ...typography.bodySm, flex: 1, fontSize: 13 },
  loadingBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
  loadingText: { ...typography.bodySm, color: colors.onSurfaceVariant },
  section: { gap: spacing.md, padding: spacing.lg },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  sectionTitle: { ...typography.titleSm, color: colors.onSurface, flexShrink: 1 },
  countText: { ...typography.labelCaption, color: colors.onSurfaceVariant },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  estadoPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  estadoOn: { backgroundColor: colors.metricBg4 },
  estadoOff: { backgroundColor: colors.surfaceContainerHigh },
  estadoTexto: { ...typography.labelCaption, fontWeight: '700', textTransform: 'uppercase' },
  estadoTextoOn: { color: colors.metricText4 },
  estadoTextoOff: { color: colors.onSurfaceVariant },
  statusMeta: { ...typography.bodySm, color: colors.onSurfaceVariant, fontSize: 12 },
  helpText: { ...typography.bodySm, color: colors.onSurfaceVariant },
  stepText: { ...typography.bodySm, color: colors.onSurface },
  formGroup: { gap: spacing.sm },
  inputSinMargen: { marginBottom: 0 },
  secretBox: {
    backgroundColor: colors.metricBg1,
    borderWidth: 1,
    borderColor: colors.metricBorder1,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: 2,
  },
  secretLabel: { ...typography.labelCaption, color: colors.primary, textTransform: 'uppercase' },
  secretValue: {
    fontFamily: 'monospace',
    fontSize: 15,
    letterSpacing: 1.2,
    color: colors.onSurface,
  },
  uriText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: colors.onSurfaceVariant,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  footnote: { ...typography.metadata, color: colors.outline },
  recoveryCard: {
    backgroundColor: colors.metricBg1,
    borderWidth: 1,
    borderColor: colors.metricBorder1,
  },
  recoveryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  recoveryCode: {
    fontFamily: 'monospace',
    fontSize: 14,
    letterSpacing: 0.6,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    minWidth: '46%',
    textAlign: 'center',
  },
  list: { gap: spacing.sm },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  sessionIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.metricBg1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionInfo: { flex: 1, gap: 1 },
  sessionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  sessionName: { ...typography.labelBold, color: colors.onSurface, flexShrink: 1 },
  badge: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: spacing.base,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.onPrimaryContainer,
    textTransform: 'uppercase',
  },
  sessionMeta: { ...typography.metadata, color: colors.onSurfaceVariant },
  linkBtn: { paddingVertical: 2, paddingHorizontal: 2 },
  linkDanger: { ...typography.labelBold, color: colors.error, fontSize: 13 },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.base,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: `${colors.error}55`,
    backgroundColor: 'rgba(186,26,26,0.06)',
  },
  dangerBtnText: { ...typography.labelBold, color: colors.error },
  disabled: { opacity: 0.5 },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  eventDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.tertiary,
    marginTop: 6,
  },
  eventDotError: { backgroundColor: colors.error },
  eventInfo: { flex: 1, gap: 1 },
  eventTitle: { ...typography.bodySm, color: colors.onSurface, fontWeight: '600' },
  eventMeta: { ...typography.metadata, color: colors.onSurfaceVariant },
});
