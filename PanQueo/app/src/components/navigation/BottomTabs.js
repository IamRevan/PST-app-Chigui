import { useState } from 'react';
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
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { SheetModal } from '../ui/Modal';
import { colors, typography, borderRadius, spacing, shadows } from '../../lib/theme';
import { useCurrency, MODE_LABELS } from '../../lib/currency';

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

const HeaderRight = () => {
  const navigation = useNavigation();
  const [showCurrency, setShowCurrency] = useState(false);
  const [nuevaTasa, setNuevaTasa] = useState('');
  const [actualizando, setActualizando] = useState(false);
  const { currency, setCurrency, tasa, registrarTasa } = useCurrency();

  const handleUpdateTasa = async () => {
    if (!nuevaTasa.trim()) {
      Alert.alert('Valor requerido', 'Ingresa el nuevo valor de la tasa BCV.');
      return;
    }
    setActualizando(true);
    try {
      await registrarTasa(nuevaTasa, 'BCV Móvil');
      Alert.alert('Tasa Actualizada', `Nueva tasa vigente: ${nuevaTasa} Bs/USD`);
      setNuevaTasa('');
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo actualizar la tasa');
    } finally {
      setActualizando(false);
    }
  };

  const getPillLabel = () => {
    if (currency === 'usd') return 'USD';
    if (currency === 'bs') return 'Bs.';
    return 'Bs/$';
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

      <SheetModal visible={showCurrency} onClose={() => setShowCurrency(false)} title="Moneda y Tasa BCV">
        <View style={styles.rateCard}>
          <Text style={styles.rateLabel}>Tasa de cambio vigente</Text>
          <Text style={styles.rateValue}>
            {tasa ? `${tasa.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs. / USD` : 'Sin tasa registrada'}
          </Text>
          <Text style={styles.rateSource}>Fuente: Banco Central de Venezuela</Text>
        </View>

        <Text style={styles.sectionSubtitle}>Modo de visualización</Text>
        {[
          { key: 'dual', label: 'Dual (Bs. y USD en simultáneo)', desc: 'Recomendado para repostería bimonetaria' },
          { key: 'usd', label: 'Dólares (USD $)', desc: 'Muestra únicamente importes en divisas' },
          { key: 'bs', label: 'Bolívares (Bs. Digitales / VES)', desc: 'Calculado a la tasa oficial BCV' },
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
          <Text style={styles.tasaUpdateTitle}>Actualizar Tasa Oficial BCV</Text>
          <View style={styles.tasaInputRow}>
            <TextInput
              style={styles.tasaInput}
              placeholder={tasa ? String(tasa) : 'Ej: 42.50'}
              placeholderTextColor={colors.outline}
              keyboardType="numeric"
              value={nuevaTasa}
              onChangeText={setNuevaTasa}
            />
            <TouchableOpacity
              style={[styles.tasaSaveBtn, actualizando && { opacity: 0.6 }]}
              onPress={handleUpdateTasa}
              disabled={actualizando}
            >
              <Text style={styles.tasaSaveBtnText}>{actualizando ? 'Guardando...' : 'Actualizar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  rateCard: {
    backgroundColor: colors.metricBg1,
    borderWidth: 1,
    borderColor: colors.metricBorder1,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  rateLabel: {
    ...typography.labelCaption,
    color: colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  rateValue: {
    ...typography.headlineMd,
    color: colors.primary,
    marginTop: 2,
  },
  rateSource: {
    ...typography.metadata,
    color: colors.onSurfaceVariant,
    marginTop: 4,
    fontSize: 11,
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
    marginBottom: spacing.xs,
  },
  tasaInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  tasaInput: {
    flex: 1,
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
  tasaSaveBtnText: {
    ...typography.buttonText,
    color: colors.white,
    fontSize: 14,
  },
});
