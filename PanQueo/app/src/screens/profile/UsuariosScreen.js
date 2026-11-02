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
import { Card } from '../../components/ui';
import { useAuth } from '../../auth/AuthContext';
import apiClient from '../../lib/api/client';
import { ENDPOINTS } from '../../lib/api/endpoints';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';

const ROLES = ['admin', 'desarrollador', 'cocinero', 'vendedor'];

const ETIQUETAS_ROL = {
  admin: 'Administrador',
  desarrollador: 'Desarrollador',
  cocinero: 'Cocinero',
  vendedor: 'Vendedor',
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

export const UsuariosScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [ocupado, setOcupado] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [aviso, setAviso] = useState(null);

  const esGestor = Boolean(
    user && (user.rol === 'admin' || user.rol === 'desarrollador'),
  );

  const avisar = (tipo, texto) => setAviso({ tipo, texto });

  const cargarUsuarios = useCallback(async () => {
    const res = await apiClient.get(ENDPOINTS.ADMIN_USUARIOS);
    setUsuarios(res.data?.data || []);
  }, []);

  const refrescar = useCallback(async () => {
    setRefrescando(true);
    try {
      await cargarUsuarios();
      setAviso(null);
    } catch (error) {
      avisar('error', error.message || 'No se pudo cargar la lista de usuarios.');
    } finally {
      setRefrescando(false);
      setCargando(false);
    }
  }, [cargarUsuarios]);

  useFocusEffect(
    useCallback(() => {
      if (!esGestor) return undefined;

      cargarUsuarios()
        .then(() => setCargando(false))
        .catch((error) => {
          setCargando(false);
          avisar('error', error.message || 'No tienes permisos para ver los usuarios.');
        });

      return () => {};
    }, [esGestor, cargarUsuarios]),
  );

  const cambiarRol = async (objetivo, rol) => {
    if (rol === objetivo.rol) return;
    setOcupado(`rol-${objetivo.id}`);
    setAviso(null);
    try {
      await apiClient.patch(ENDPOINTS.ADMIN_USUARIO_ROL(objetivo.id), { rol });
      avisar('ok', `Rol de ${objetivo.nombre} actualizado a ${ETIQUETAS_ROL[rol]}.`);
      await cargarUsuarios();
    } catch (error) {
      avisar('error', error.message || 'No se pudo cambiar el rol.');
    } finally {
      setOcupado(null);
    }
  };

  const cambiarEstado = async (objetivo, activo) => {
    const aceptado = await confirmar({
      titulo: activo ? 'Activar cuenta' : 'Desactivar cuenta',
      mensaje: activo
        ? `¿Permitir que ${objetivo.nombre} ${objetivo.apellido || ''} vuelva a iniciar sesión?`
        : `¿Impedir que ${objetivo.nombre} ${objetivo.apellido || ''} inicie sesión? Podrás reactivarla cuando quieras.`,
      textoConfirmar: activo ? 'Activar' : 'Desactivar',
    });
    if (!aceptado) return;

    setOcupado(`estado-${objetivo.id}`);
    setAviso(null);
    try {
      await apiClient.patch(ENDPOINTS.ADMIN_USUARIO_ESTADO(objetivo.id), { activo });
      avisar('ok', activo ? 'Cuenta activada.' : 'Cuenta desactivada.');
      await cargarUsuarios();
    } catch (error) {
      avisar('error', error.message || 'No se pudo actualizar el estado.');
    } finally {
      setOcupado(null);
    }
  };

  if (!esGestor) {
    return (
      <ScreenWrapper>
        <View style={styles.centered}>
          <MaterialIcons name="lock" size={40} color={colors.outline} />
          <Text style={styles.sinAcceso}>
            No tienes permisos para gestionar usuarios.
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colors.primary} />
        }
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.title}>Usuarios y roles</Text>
        </View>
        <Text style={styles.subtitle}>
          Asigna roles y activa o desactiva cuentas. Los cambios aplican de inmediato.
        </Text>

        {aviso && (
          <View style={[styles.aviso, aviso.tipo === 'error' ? styles.avisoError : styles.avisoOk]}>
            <MaterialIcons
              name={aviso.tipo === 'error' ? 'error' : 'check-circle'}
              size={18}
              color={aviso.tipo === 'error' ? colors.error : colors.primary}
            />
            <Text style={[styles.avisoText, aviso.tipo === 'error' && { color: colors.error }]}>
              {aviso.texto}
            </Text>
          </View>
        )}

        {cargando ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          usuarios.map((usuario) => {
            const esYo = user && user.id === usuario.id;
            const ocupandoEstado = ocupado === `estado-${usuario.id}`;
            return (
              <Card key={usuario.id} style={[styles.userCard, !usuario.activo && styles.userCardInactivo]}>
                <View style={styles.userHeader}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>
                      {usuario.nombre} {usuario.apellido}
                      {esYo ? ' (tú)' : ''}
                    </Text>
                    <Text style={styles.userEmail}>{usuario.email}</Text>
                    <View style={styles.badges}>
                      <Text style={[styles.badge, usuario.email_verificado ? styles.badgeOk : styles.badgeWarn]}>
                        {usuario.email_verificado ? '✓ verificado' : '✗ sin verificar'}
                      </Text>
                      {usuario.mfa_habilitado && (
                        <Text style={styles.badge}>MFA</Text>
                      )}
                      {!usuario.activo && (
                        <Text style={[styles.badge, styles.badgeWarn]}>desactivado</Text>
                      )}
                    </View>
                  </View>
                </View>

                <Text style={styles.rolLabel}>Rol</Text>
                <View style={styles.pillsRow}>
                  {ROLES.map((rol) => {
                    const activo = usuario.rol === rol;
                    const ocupandoRol = ocupado === `rol-${usuario.id}`;
                    return (
                      <TouchableOpacity
                        key={rol}
                        disabled={esYo || Boolean(ocupado)}
                        onPress={() => cambiarRol(usuario, rol)}
                        style={[styles.pill, activo && styles.pillActiva, esYo && styles.pillDeshabilitada]}
                        activeOpacity={0.7}
                      >
                        {ocupandoRol && activo && (
                          <ActivityIndicator size="small" color={colors.onPrimaryContainer} style={styles.pillSpinner} />
                        )}
                        <Text style={[styles.pillText, activo && styles.pillTextActiva]}>
                          {ETIQUETAS_ROL[rol]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  disabled={esYo || Boolean(ocupado)}
                  onPress={() => cambiarEstado(usuario, !usuario.activo)}
                  style={[
                    styles.estadoBtn,
                    usuario.activo ? styles.estadoBtnDesactivar : styles.estadoBtnActivar,
                    esYo && styles.pillDeshabilitada,
                  ]}
                  activeOpacity={0.7}
                >
                  {ocupandoEstado ? (
                    <ActivityIndicator size="small" color={usuario.activo ? colors.error : colors.primary} />
                  ) : (
                    <MaterialIcons
                      name={usuario.activo ? 'block' : 'check-circle'}
                      size={18}
                      color={usuario.activo ? colors.error : colors.primary}
                    />
                  )}
                  <Text style={[styles.estadoBtnText, { color: usuario.activo ? colors.error : colors.primary }]}>
                    {usuario.activo ? 'Desactivar cuenta' : 'Activar cuenta'}
                  </Text>
                </TouchableOpacity>
              </Card>
            );
          })
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 100, gap: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { ...typography.headlineMd, color: colors.onSurface },
  subtitle: { ...typography.bodySm, color: colors.onSurfaceVariant, fontSize: 13 },
  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 12 },
  sinAcceso: { ...typography.bodySm, color: colors.onSurfaceVariant, textAlign: 'center' },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  avisoOk: { backgroundColor: `${colors.primaryContainer}30` },
  avisoError: { backgroundColor: `${colors.error}18` },
  avisoText: { ...typography.bodySm, flex: 1, fontSize: 13 },
  userCard: { padding: spacing.md, gap: spacing.sm, borderRadius: borderRadius.lg },
  userCardInactivo: { opacity: 0.75 },
  userHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  userInfo: { flex: 1, gap: 2 },
  userName: { ...typography.labelBold, color: colors.onSurface, fontSize: 15 },
  userEmail: { ...typography.bodySm, color: colors.onSurfaceVariant, fontSize: 12 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  badge: {
    ...typography.labelCaption,
    fontSize: 10,
    color: colors.primary,
    backgroundColor: `${colors.primaryContainer}40`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  badgeOk: { color: colors.tertiary, backgroundColor: `${colors.tertiaryContainer}40` },
  badgeWarn: { color: colors.error, backgroundColor: `${colors.error}20` },
  rolLabel: { ...typography.labelBold, fontSize: 11, color: colors.outline, textTransform: 'uppercase' },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillActiva: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  pillDeshabilitada: { opacity: 0.5 },
  pillText: { ...typography.labelCaption, color: colors.onSurfaceVariant },
  pillTextActiva: { color: colors.onPrimaryContainer, fontWeight: '700' },
  pillSpinner: { marginRight: 4 },
  estadoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  estadoBtnDesactivar: { borderColor: `${colors.error}40`, backgroundColor: 'rgba(255,82,82,0.06)' },
  estadoBtnActivar: { borderColor: `${colors.primary}40`, backgroundColor: `${colors.primaryContainer}20` },
  estadoBtnText: { ...typography.buttonText, fontSize: 13 },
});
