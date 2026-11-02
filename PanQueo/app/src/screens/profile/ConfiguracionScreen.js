import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Button, Card } from '../../components/ui';
import { CenterModal, SheetModal } from '../../components/ui/Modal';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';
import { useCurrency } from '../../lib/currency';
import { getItem, setItem } from '../../lib/utils/storage';
import { STORAGE_KEYS, getDefaultApiUrl } from '../../lib/utils/constants';
import apiClient from '../../lib/api/client';
import { ENDPOINTS } from '../../lib/api/endpoints';

export const ConfiguracionScreen = ({ navigation }) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [apiUrl, setApiUrl] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null); // 'ok' | 'error' | null
  const [notifPush, setNotifPush] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  const {
    currency,
    setCurrency,
    tasa,
    tasaEur,
    tasaBase,
    tasaTrabajo,
    monedaTrabajo,
    setTasaBase,
    tasaMeta,
    registrarTasa,
    sincronizarTasa,
  } = useCurrency();
  const [tasaInput, setTasaInput] = useState('');
  const [tasaEurInput, setTasaEurInput] = useState('');
  const [syncingTasa, setSyncingTasa] = useState(false);

  const fmtTasa = (valor) => {
    const num = parseFloat(valor);
    if (!Number.isFinite(num)) return '—';
    return num.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleSincronizarTasa = async () => {
    setSyncingTasa(true);
    try {
      const res = await sincronizarTasa();
      Alert.alert(
        'Tasas BCV actualizadas',
        `USD: ${fmtTasa(res.usd)} Bs.\nEUR: ${fmtTasa(res.eur)} Bs.`,
      );
    } catch (err) {
      Alert.alert('No se pudo sincronizar', err.message || 'Revisa la conexión con el BCV');
    } finally {
      setSyncingTasa(false);
    }
  };

  const handleSelectTasaBase = async (base) => {
    try {
      await setTasaBase(base);
    } catch (err) {
      Alert.alert('Tasa no disponible', err.message);
    }
  };

  useEffect(() => {
    (async () => {
      const savedUrl = await getItem(STORAGE_KEYS.API_URL);
      setApiUrl(savedUrl || getDefaultApiUrl());
      const savedTheme = await getItem(STORAGE_KEYS.THEME_MODE);
      setIsDarkMode(savedTheme === 'dark');
    })();
  }, []);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const cleanUrl = (apiUrl || getDefaultApiUrl()).trim().replace(/\/+$/, '');
      const res = await apiClient.get(ENDPOINTS.HEALTH, {
        baseURL: cleanUrl,
        timeout: 5000,
      });
      if (res.data?.status === 'success' || res.status === 200) {
        setConnectionStatus('ok');
        Alert.alert('¡Conexión Exitosa!', `Servidor PanQueo respondiendo en: ${cleanUrl}`);
      } else {
        setConnectionStatus('error');
        Alert.alert('Aviso', 'El servidor respondió pero con código inesperado.');
      }
    } catch (err) {
      setConnectionStatus('error');
      Alert.alert(
        'Fallo de Conexión',
        `No se pudo conectar a ${apiUrl}.\nDetalle: ${err.message || 'Sin respuesta'}`
      );
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = async () => {
    try {
      if (apiUrl.trim()) {
        await setItem(STORAGE_KEYS.API_URL, apiUrl.trim().replace(/\/+$/, ''));
      }
      if (tasaInput.trim() || tasaEurInput.trim()) {
        await registrarTasa(
          tasaInput.trim() || String(tasa ?? ''),
          'Configuración Móvil',
          tasaEurInput.trim() || null,
        );
      }
      await setItem(STORAGE_KEYS.THEME_MODE, isDarkMode ? 'dark' : 'light');
      setShowSuccess(true);
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo guardar la configuración');
    }
  };

  const getCurrencyLabel = () => {
    if (currency === 'usd') return 'Dólares (USD $)';
    if (currency === 'bs') return 'Bolívares (Bs. Digitales)';
    return 'Dual (Bs. y USD en simultáneo)';
  };

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.title}>Configuración</Text>
        </View>
        <Text style={styles.subtitle}>Sincronización, conectividad y preferencias del sistema</Text>

        <Card style={styles.card}>
          {/* Servidor API Backend */}
          <View style={styles.sectionHeader}>
            <MaterialIcons name="dns" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Conexión con el Servidor API</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>URL Base del Backend</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={apiUrl}
                onChangeText={setApiUrl}
                placeholder="http://192.168.1.X:3000 o http://localhost:3000"
                placeholderTextColor={colors.outline}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <Text style={styles.helperText}>
              En móvil físico: usa la IP local de tu PC en la misma red Wi-Fi (ej: http://192.168.1.15:3000). En emulador: http://10.0.2.2:3000.
            </Text>
            <View style={styles.testRow}>
              <TouchableOpacity
                style={[styles.testBtn, testingConnection && { opacity: 0.6 }]}
                onPress={handleTestConnection}
                disabled={testingConnection}
              >
                <MaterialIcons
                  name={connectionStatus === 'ok' ? 'check-circle' : connectionStatus === 'error' ? 'error' : 'wifi'}
                  size={18}
                  color={connectionStatus === 'ok' ? colors.tertiary : connectionStatus === 'error' ? colors.error : colors.primary}
                />
                <Text style={styles.testBtnText}>
                  {testingConnection ? 'Probando...' : 'Probar conexión API'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Moneda y Tasa */}
          <View style={[styles.sectionHeader, { marginTop: spacing.md }]}>
            <MaterialIcons name="payments" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Bimoneda y Finanzas</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Modo de Moneda Activo</Text>
            <TouchableOpacity style={styles.select} onPress={() => setShowCurrencyModal(true)}>
              <Text style={styles.selectText}>{getCurrencyLabel()}</Text>
              <MaterialIcons name="expand-more" size={20} color={colors.outline} />
            </TouchableOpacity>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Tasas oficiales BCV (automáticas)</Text>
            <Text style={styles.helperText}>
              Elige con qué tasa se calculan los bolívares.
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
              <TouchableOpacity
                style={[styles.tasaCard, { flex: 1 }, tasaBase === 'usd' && styles.tasaCardActive]}
                onPress={() => handleSelectTasaBase('usd')}
                activeOpacity={0.8}
              >
                {tasaBase === 'usd' && (
                  <View style={styles.tasaBadge}>
                    <MaterialIcons name="check" size={10} color={colors.onPrimary} />
                    <Text style={styles.tasaBadgeText}>EN USO</Text>
                  </View>
                )}
                <Text style={styles.tasaCur}>$ USD</Text>
                <Text style={styles.tasaValue}>{fmtTasa(tasa)}</Text>
                <Text style={styles.tasaUnit}>Bs. por 1 USD</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tasaCard, { flex: 1 }, tasaBase === 'eur' && styles.tasaCardActive]}
                onPress={() => handleSelectTasaBase('eur')}
                activeOpacity={0.8}
              >
                {tasaBase === 'eur' && (
                  <View style={styles.tasaBadge}>
                    <MaterialIcons name="check" size={10} color={colors.onPrimary} />
                    <Text style={styles.tasaBadgeText}>EN USO</Text>
                  </View>
                )}
                <Text style={styles.tasaCur}>€ EUR</Text>
                <Text style={styles.tasaValue}>{fmtTasa(tasaEur)}</Text>
                <Text style={styles.tasaUnit}>Bs. por 1 EUR</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>
              {tasaBase === 'eur' ? 'Trabajando con tasa EUR' : 'Trabajando con tasa USD'}
              {tasaTrabajo ? `: 1 ${monedaTrabajo} = ${fmtTasa(tasaTrabajo)} Bs.` : ''}
              {tasaMeta?.sincronizadoEn
                ? `\nAutomático · ${tasaMeta.fuente || 'BCV'} · fecha valor ${tasaMeta.fechaValor || 'n/d'}`
                : tasa
                  ? `\nTasa manual${tasaMeta?.fuente ? ` (${tasaMeta.fuente})` : ''}`
                  : '\nSin tasa oficial registrada'}
            </Text>
            <TouchableOpacity
              style={[styles.syncTasaBtn, syncingTasa && { opacity: 0.6 }]}
              onPress={handleSincronizarTasa}
              disabled={syncingTasa}
            >
              <MaterialIcons name="sync" size={16} color={colors.onPrimary} />
              <Text style={styles.syncTasaBtnText}>
                {syncingTasa ? 'Consultando BCV...' : 'Sincronizar ahora con el BCV'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Ajuste manual de tasas (opcional)</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={tasaInput}
                onChangeText={setTasaInput}
                placeholder={tasa ? `USD actual: ${fmtTasa(tasa)} Bs.` : 'Bs. por 1 USD'}
                placeholderTextColor={colors.outline}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputContainer, { marginTop: spacing.xs }]}>
              <TextInput
                style={styles.textInput}
                value={tasaEurInput}
                onChangeText={setTasaEurInput}
                placeholder={tasaEur ? `EUR actual: ${fmtTasa(tasaEur)} Bs.` : 'Bs. por 1 EUR'}
                placeholderTextColor={colors.outline}
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.helperText}>
              Si guardas un valor manual se sobrescribe la tasa automática hasta la próxima sincronización.
            </Text>
          </View>

          {/* Preferencias de UI */}
          <View style={[styles.sectionHeader, { marginTop: spacing.md }]}>
            <MaterialIcons name="tune" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Experiencia de Usuario</Text>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Notificaciones de Stock y Pedidos</Text>
              <Text style={styles.toggleDesc}>Alertas preventivas de vencimiento y cambios de estado</Text>
            </View>
            <TouchableOpacity
              style={[styles.switchTrack, notifPush && styles.switchTrackActive]}
              onPress={() => setNotifPush(!notifPush)}
            >
              <View style={[styles.switchThumb, notifPush && styles.switchThumbActive]} />
            </TouchableOpacity>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Tema Visual</Text>
              <Text style={styles.toggleDesc}>
                {isDarkMode ? 'Tema Oscuro (Artesanal)' : 'Tema Claro (Crema y Vainilla)'}
              </Text>
            </View>
            <View style={styles.modeSwitch}>
              <TouchableOpacity
                style={[styles.modeBtn, !isDarkMode && styles.modeBtnActive]}
                onPress={() => setIsDarkMode(false)}
              >
                <MaterialIcons name="light-mode" size={16} color={!isDarkMode ? colors.onPrimaryContainer : colors.outline} />
                <Text style={[styles.modeBtnLabel, !isDarkMode && styles.modeBtnLabelActive]}>Claro</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, isDarkMode && styles.modeBtnActive]}
                onPress={() => setIsDarkMode(true)}
              >
                <MaterialIcons name="dark-mode" size={16} color={isDarkMode ? colors.onPrimaryContainer : colors.outline} />
                <Text style={[styles.modeBtnLabel, isDarkMode && styles.modeBtnLabelActive]}>Oscuro</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Button
            title="Guardar Configuración"
            variant="primary"
            onPress={handleSave}
            style={styles.saveBtn}
          />
        </Card>

        <Text style={styles.footnote}>PanQueo v1.0.0 · Inversiones Dulsal Johanel C.A.</Text>
      </ScrollView>

      {/* Modal selector de moneda */}
      <SheetModal visible={showCurrencyModal} onClose={() => setShowCurrencyModal(false)} title="Seleccionar Moneda">
        {[
          { key: 'dual', label: 'Dual (Bs. y USD en simultáneo)', desc: 'Muestra importes en ambas monedas' },
          { key: 'usd', label: 'Dólares (USD $)', desc: 'Precios base de venta' },
          { key: 'bs', label: 'Bolívares (Bs. Digitales / VES)', desc: `Precios convertidos a tasa ${monedaTrabajo}` },
        ].map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.currencyOption, currency === opt.key && styles.currencyOptionActive]}
            onPress={() => {
              setCurrency(opt.key);
              setShowCurrencyModal(false);
            }}
          >
            <MaterialIcons
              name={currency === opt.key ? 'radio-button-checked' : 'radio-button-unchecked'}
              size={20}
              color={currency === opt.key ? colors.primary : colors.outline}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.currencyOptionText, currency === opt.key && styles.currencyOptionTextActive]}>
                {opt.label}
              </Text>
              <Text style={styles.currencyOptionDesc}>{opt.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </SheetModal>

      <CenterModal visible={showSuccess} onClose={() => setShowSuccess(false)} title="✓ Configuración Aplicada">
        <Text style={styles.successDesc}>Tus preferencias y parámetros de red se han guardado con éxito.</Text>
        <Button title="Entendido" variant="primary" onPress={() => setShowSuccess(false)} style={{ marginTop: spacing.md }} />
      </CenterModal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 40, gap: spacing.md },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: 4,
    marginBottom: spacing.xs,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: { ...typography.headlineMd, color: colors.onSurface },
  subtitle: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: -spacing.xs },
  card: { gap: spacing.md, padding: spacing.lg, borderRadius: borderRadius.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.surfaceVariant, paddingBottom: spacing.xs },
  sectionTitle: { ...typography.labelBold, color: colors.primary, fontSize: 13, textTransform: 'uppercase' },
  field: { gap: 6 },
  label: { ...typography.labelBold, color: colors.onSurface, fontSize: 13 },
  inputContainer: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 46,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 14,
    color: colors.onSurface,
  },
  helperText: { ...typography.metadata, color: colors.onSurfaceVariant, fontSize: 11 },
  tasaCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: 2,
  },
  tasaCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF8E1',
  },
  tasaBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: borderRadius.full ?? 999,
    backgroundColor: colors.primary,
  },
  tasaBadgeText: { ...typography.labelCaption, color: colors.onPrimary, fontSize: 8, letterSpacing: 0.3 },
  tasaCur: { ...typography.labelCaption, color: colors.onSurfaceVariant, fontSize: 11, letterSpacing: 0.4 },
  tasaValue: { ...typography.valueDisplay, color: colors.primary, fontSize: 20 },
  tasaUnit: { ...typography.metadata, color: colors.onSurfaceVariant, fontSize: 10 },
  syncTasaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: 40,
    marginTop: spacing.xs,
  },
  syncTasaBtnText: { ...typography.labelBold, color: colors.onPrimary, fontSize: 12 },
  testRow: { marginTop: 4 },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  testBtnText: { ...typography.labelBold, fontSize: 12, color: colors.onSurface },
  select: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 46,
  },
  selectText: { ...typography.bodyMd, fontSize: 14, color: colors.onSurface },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  toggleInfo: { flex: 1, marginRight: spacing.md },
  toggleLabel: { ...typography.labelBold, color: colors.onSurface, fontSize: 13 },
  toggleDesc: { ...typography.metadata, color: colors.onSurfaceVariant, fontSize: 11, marginTop: 2 },
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceContainerHighest,
    padding: 3,
    justifyContent: 'center',
  },
  switchTrackActive: {
    backgroundColor: colors.primaryContainer,
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  modeBtnActive: {
    backgroundColor: colors.primaryContainer,
  },
  modeBtnLabel: { ...typography.labelCaption, color: colors.outline, fontSize: 11 },
  modeBtnLabelActive: { color: colors.onPrimaryContainer, fontWeight: '700' },
  saveBtn: { marginTop: spacing.md },
  footnote: { ...typography.metadata, textAlign: 'center', color: colors.onSurfaceVariant, fontSize: 12 },
  successDesc: { ...typography.bodyMd, color: colors.onSurface, marginVertical: spacing.sm },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.surfaceContainerLow,
  },
  currencyOptionActive: {
    backgroundColor: `${colors.primaryContainer}30`,
    borderWidth: 1,
    borderColor: colors.primaryContainer,
  },
  currencyOptionText: { ...typography.bodyMd, color: colors.onSurface, fontWeight: '500' },
  currencyOptionTextActive: { color: colors.primary, fontWeight: '700' },
  currencyOptionDesc: { ...typography.metadata, color: colors.onSurfaceVariant, fontSize: 11 },
});
