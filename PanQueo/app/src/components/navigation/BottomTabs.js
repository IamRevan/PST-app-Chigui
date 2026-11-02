import { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Linking,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { SheetModal } from '../ui/Modal';
import { colors, typography, borderRadius, spacing, shadows } from '../../lib/theme';
import { useCurrency } from '../../lib/currency';

const Tab = createBottomTabNavigator();

// Iconografía oficial MVP: Material Icons (homologada con Material Symbols de web)
const TAB_ICONS = {
  Dashboard: 'dashboard',
  Inventario: 'inventory-2',
  Pedidos: 'receipt-long',
  Clientes: 'people-alt',
  Perfil: 'account-circle',
};

const TabIcon = ({ label, focused }) => (
  <MaterialIcons
    name={TAB_ICONS[label] || 'apps'}
    size={24}
    color={focused ? colors.primary : colors.onSurfaceVariant}
  />
);

const fmtTasa = (valor) => {
  const num = parseFloat(valor);
  if (!Number.isFinite(num)) return '—';
  return num.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const HeaderRight = () => {
  const navigation = useNavigation();
  const [showCurrency, setShowCurrency] = useState(false);
  const [nuevaTasa, setNuevaTasa] = useState('');
  const [nuevaTasaEur, setNuevaTasaEur] = useState('');
  const [actualizando, setActualizando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
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

  // Al abrir el sheet se precargan las tasas vigentes para el ajuste manual.
  useEffect(() => {
    if (showCurrency) {
      setNuevaTasa(tasa ? String(tasa) : '');
      setNuevaTasaEur(tasaEur ? String(tasaEur) : '');
    }
  }, [showCurrency, tasa, tasaEur]);

  const handleSelectTasaBase = async (base) => {
    try {
      await setTasaBase(base);
    } catch (err) {
      Alert.alert('Tasa no disponible', err.message || 'Sincroniza con el BCV primero.');
    }
  };

  const handleSincronizarTasa = async () => {
    setSincronizando(true);
    try {
      const res = await sincronizarTasa();
      Alert.alert(
        'Tasas BCV actualizadas',
        `USD: ${fmtTasa(res.usd)} Bs.\nEUR: ${fmtTasa(res.eur)} Bs.`,
      );
    } catch (err) {
      Alert.alert('No se pudo sincronizar', err.message || 'Revisa la conexión con el BCV');
    } finally {
      setSincronizando(false);
    }
  };

  const handleUpdateTasa = async () => {
    if (!nuevaTasa.trim() && !nuevaTasaEur.trim()) {
      Alert.alert('Valor requerido', 'Ingresa al menos una de las dos tasas (USD o EUR).');
      return;
    }
    setActualizando(true);
    try {
      const usd = nuevaTasa.trim() || (tasa ? String(tasa) : '');
      const eur = nuevaTasaEur.trim() || null;
      await registrarTasa(usd, 'Manual móvil', eur);
      Alert.alert(
        'Tasas actualizadas',
        `USD: ${fmtTasa(usd)} Bs.${eur ? `\nEUR: ${fmtTasa(eur)} Bs.` : ''}`,
      );
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo actualizar la tasa');
    } finally {
      setActualizando(false);
    }
  };

  const getPillLabel = () => {
    const valor = tasaBase === 'eur' ? tasaEur : tasa;
    if (!Number.isFinite(parseFloat(valor))) return 'Sin tasa';
    return `${tasaBase === 'eur' ? '€' : '$'} ${fmtTasa(valor)}`;
  };

  const getEstadoTasa = () => {
    if (tasaMeta?.sincronizadoEn) {
      const fecha = new Date(tasaMeta.sincronizadoEn).toLocaleString('es-VE', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
      const valor = tasaMeta.fechaValor ? ` · fecha valor ${tasaMeta.fechaValor}` : '';
      return `Automático · ${tasaMeta.fuente || 'BCV'}${valor}\nÚltima sincronización: ${fecha}`;
    }
    if (tasa || tasaEur) {
      return `Tasa manual${tasaMeta?.fuente ? ` (${tasaMeta.fuente})` : ''}. Sincroniza para volver al valor oficial.`;
    }
    return 'Sin tasa registrada. Sincroniza con el BCV para empezar.';
  };

  return (
    <>
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.currencyToggle}
          onPress={() => setShowCurrency(true)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="currency-exchange" size={14} color={colors.primary} />
          <Text style={styles.currencyPill}>{getPillLabel()}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.getParent()?.navigate('Notificaciones')}
          style={styles.iconButton}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="notifications-none" size={22} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => navigation.navigate('Perfil')}
          activeOpacity={0.7}
        >
          <Image source={require('../../../assets/sparkle.png')} style={styles.avatarImage} />
        </TouchableOpacity>
      </View>

      <SheetModal visible={showCurrency} onClose={() => setShowCurrency(false)} title="Tasas oficiales BCV">
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
          <Text style={styles.sheetSub}>
            Dólar y euro oficiales sincronizados desde bcv.org.ve. Elige la tasa con la que quieres
            trabajar: los montos en bolívares se calculan con ella.
          </Text>

          <View style={styles.rateCardsRow}>
            <TouchableOpacity
              style={[styles.rateSelectCard, tasaBase === 'usd' && styles.rateSelectCardActive]}
              onPress={() => handleSelectTasaBase('usd')}
              activeOpacity={0.8}
            >
              {tasaBase === 'usd' && (
                <View style={styles.rateInUse}>
                  <MaterialIcons name="check" size={9} color={colors.onPrimary} />
                  <Text style={styles.rateInUseText}>EN USO</Text>
                </View>
              )}
              <Text style={styles.rateCur}>$ USD</Text>
              <Text style={styles.rateValueBig}>{fmtTasa(tasa)}</Text>
              <Text style={styles.rateUnit}>Bs. por 1 USD</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rateSelectCard, tasaBase === 'eur' && styles.rateSelectCardActive]}
              onPress={() => handleSelectTasaBase('eur')}
              activeOpacity={0.8}
            >
              {tasaBase === 'eur' && (
                <View style={styles.rateInUse}>
                  <MaterialIcons name="check" size={9} color={colors.onPrimary} />
                  <Text style={styles.rateInUseText}>EN USO</Text>
                </View>
              )}
              <Text style={styles.rateCur}>€ EUR</Text>
              <Text style={styles.rateValueBig}>{fmtTasa(tasaEur)}</Text>
              <Text style={styles.rateUnit}>Bs. por 1 EUR</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.tasaHint}>
            Trabajando con la tasa del{' '}
            <Text style={styles.tasaHintStrong}>{tasaBase === 'eur' ? 'euro' : 'dólar'}</Text>
            {Number.isFinite(parseFloat(tasaTrabajo))
              ? `: 1 ${monedaTrabajo} = ${fmtTasa(tasaTrabajo)} Bs.`
              : ''}
            {' · '}los montos en bolívares usan esta tasa.
          </Text>

          <View style={styles.tasaStatusBox}>
            <MaterialIcons
              name={tasaMeta?.sincronizadoEn ? 'verified' : 'info-outline'}
              size={15}
              color={tasaMeta?.sincronizadoEn ? colors.primary : colors.onSurfaceVariant}
            />
            <Text style={styles.tasaStatusText}>{getEstadoTasa()}</Text>
          </View>

          <TouchableOpacity
            style={[styles.syncBtn, sincronizando && { opacity: 0.6 }]}
            onPress={handleSincronizarTasa}
            disabled={sincronizando}
            activeOpacity={0.8}
          >
            <MaterialIcons name="sync" size={18} color={colors.onPrimary} />
            <Text style={styles.syncBtnText}>
              {sincronizando ? 'Sincronizando…' : 'Sincronizar ahora con el BCV'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Linking.openURL('https://www.bcv.org.ve/')}
            activeOpacity={0.7}
            style={styles.tasaLinkBtn}
          >
            <MaterialIcons name="open-in-new" size={13} color={colors.onSurfaceVariant} />
            <Text style={styles.tasaLink}>Ver tasas en bcv.org.ve</Text>
          </TouchableOpacity>

          <Text style={[styles.sectionSubtitle, { marginTop: spacing.md }]}>Modo de visualización</Text>
          {[
            { key: 'dual', label: 'Dual (Bs. y USD en simultáneo)', desc: 'Recomendado para repostería bimonetaria' },
            { key: 'usd', label: 'Dólares (USD $)', desc: 'Muestra únicamente importes en divisas' },
            { key: 'bs', label: 'Bolívares (Bs. Digitales / VES)', desc: `Calculado a la tasa ${monedaTrabajo}` },
          ].map((opt) => {
            const isSelected = currency === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.currencyOption, isSelected && styles.currencyOptionActive]}
                onPress={() => {
                  setCurrency(opt.key);
                  setShowCurrency(false);
                }}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={isSelected ? 'radio-button-checked' : 'radio-button-unchecked'}
                  size={20}
                  color={isSelected ? colors.primary : colors.outline}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.currencyOptionText, isSelected && styles.currencyOptionTextActive]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.currencyOptionDesc}>{opt.desc}</Text>
                </View>
              </TouchableOpacity>
            );
          })}

          <View style={styles.tasaUpdateBox}>
            <Text style={styles.tasaUpdateTitle}>Ajuste manual (opcional)</Text>
            <Text style={styles.tasaUpdateSub}>
              Solo si necesitas fijar un valor distinto al oficial. Se guardan las dos tasas.
            </Text>
            <Text style={styles.tasaFieldLabel}>Bs. por 1 USD</Text>
            <TextInput
              style={styles.tasaInput}
              placeholder={tasa ? String(tasa) : 'Ej: 888.12'}
              placeholderTextColor={colors.outline}
              keyboardType="numeric"
              value={nuevaTasa}
              onChangeText={setNuevaTasa}
            />
            <Text style={styles.tasaFieldLabel}>Bs. por 1 EUR</Text>
            <TextInput
              style={styles.tasaInput}
              placeholder={tasaEur ? String(tasaEur) : 'Ej: 989.72'}
              placeholderTextColor={colors.outline}
              keyboardType="numeric"
              value={nuevaTasaEur}
              onChangeText={setNuevaTasaEur}
            />
            <TouchableOpacity
              style={[styles.tasaSaveBtn, styles.tasaSaveBtnWide, actualizando && { opacity: 0.6 }]}
              onPress={handleUpdateTasa}
              disabled={actualizando}
            >
              <Text style={styles.tasaSaveBtnText}>
                {actualizando ? 'Guardando…' : 'Guardar tasas manuales'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SheetModal>
    </>
  );
};

export const createBottomTabs = (screens) => {
  return function BottomTabsNavigator() {
    const insets = useSafeAreaInsets();
    // En Android e iOS, ajustamos dinámicamente la altura para que la barra de navegación del sistema
    // (Atrás, Inicio, Recientes o la píldora de gestos) nunca se superponga con los ítems del tab bar.
    const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 12 : 8);
    const tabHeight = 58 + bottomInset;

    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.onSurfaceVariant,
          tabBarStyle: [
            styles.tabBar,
            {
              height: tabHeight,
              paddingBottom: bottomInset,
            },
          ],
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
          headerStyle: styles.header,
          headerTitleStyle: styles.headerTitle,
          headerTitleAlign: 'left',
          headerShown: true,
        })}
      >
        {screens.map(({ name, component, options }) => (
          <Tab.Screen
            key={name}
            name={name}
            component={component}
            options={{
              title: name,
              headerTitle: name,
              headerRight: () => <HeaderRight />,
              ...options,
            }}
          />
        ))}
      </Tab.Navigator>
    );
  };
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
    paddingTop: 6,
    ...shadows.sm,
  },
  tabItem: { paddingHorizontal: 4, borderRadius: borderRadius.lg },
  tabLabel: { ...typography.labelCaption, fontSize: 11, fontWeight: '600' },
  header: {
    backgroundColor: colors.surfaceContainerLowest,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  headerTitle: {
    ...typography.headlineMd,
    fontSize: 20,
    color: colors.onSurface,
    marginLeft: spacing.xs,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: spacing.md,
  },
  iconButton: {
    padding: 6,
    borderRadius: borderRadius.full,
  },
  currencyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.metricBg1,
    borderRadius: borderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.metricBorder1,
  },
  currencyPill: {
    ...typography.labelBold,
    fontSize: 12,
    color: colors.primary,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: colors.primaryContainer,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerLow,
  },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  sheetContent: { paddingBottom: spacing.xs },
  sheetSub: {
    ...typography.metadata,
    color: colors.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: spacing.md,
  },
  rateCardsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rateSelectCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: 2,
  },
  rateSelectCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.metricBg1,
  },
  rateInUse: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
  },
  rateInUseText: {
    ...typography.labelCaption,
    color: colors.onPrimary,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  rateCur: {
    ...typography.labelCaption,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  rateValueBig: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginTop: 2,
  },
  rateUnit: {
    ...typography.metadata,
    color: colors.onSurfaceVariant,
    fontSize: 10,
  },
  tasaHint: {
    ...typography.metadata,
    color: colors.onSurfaceVariant,
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: spacing.sm,
  },
  tasaHintStrong: { color: colors.primary, fontWeight: '700' },
  tasaStatusBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  tasaStatusText: {
    ...typography.metadata,
    color: colors.onSurfaceVariant,
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    marginTop: spacing.md,
  },
  syncBtnText: {
    ...typography.buttonText,
    color: colors.onPrimary,
    fontSize: 14,
  },
  tasaLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
    marginTop: 2,
  },
  tasaLink: {
    ...typography.metadata,
    color: colors.onSurfaceVariant,
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  sectionSubtitle: {
    ...typography.labelBold,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    fontSize: 12,
  },
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
  tasaUpdateBox: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
  },
  tasaUpdateTitle: {
    ...typography.labelBold,
    color: colors.onSurface,
    marginBottom: 2,
  },
  tasaUpdateSub: {
    ...typography.metadata,
    color: colors.onSurfaceVariant,
    fontSize: 11,
    lineHeight: 15,
    marginBottom: spacing.xs,
  },
  tasaFieldLabel: {
    ...typography.labelCaption,
    color: colors.onSurfaceVariant,
    fontWeight: '600',
    marginTop: spacing.xs,
    marginBottom: 3,
  },
  tasaInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  tasaInput: {
    width: '100%',
    height: 44,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.onSurface,
  },
  tasaSaveBtn: {
    height: 44,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tasaSaveBtnWide: {
    width: '100%',
    marginTop: spacing.sm,
  },
  tasaSaveBtnText: {
    ...typography.buttonText,
    color: colors.white,
    fontSize: 14,
  },
});
