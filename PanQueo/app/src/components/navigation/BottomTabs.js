import { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SheetModal } from '../ui/Modal';
import { colors, typography, borderRadius, spacing, shadows } from '../../lib/theme';
import { useCurrency } from '../../lib/currency';

const Tab = createBottomTabNavigator();

// Iconografía oficial MVP: Material Icons (PanQueo/web usa Material Symbols)
const TAB_ICONS = {
  Dashboard: 'home',
  Inventario: 'inventory',
  Pedidos: 'shopping-cart',
  Clientes: 'people',
  Perfil: 'person',
};

const TabIcon = ({ label, focused }) => (
  <MaterialIcons
    name={TAB_ICONS[label] || 'description'}
    size={22}
    color={focused ? colors.onPrimaryContainer : colors.onSurfaceVariant}
  />
);

const HeaderRight = () => {
  const navigation = useNavigation();
  const [showCurrency, setShowCurrency] = useState(false);
  const { currency, setCurrency, tasa } = useCurrency();

  return (
    <>
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.currencyToggle}
          onPress={() => setShowCurrency(true)}
        >
          <Text style={[styles.currencyPill, currency === 'Bs' && styles.currencyActive]}>Bs</Text>
          <Text style={[styles.currencyPill, currency === 'USD' && styles.currencyActive]}>USD</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Notificaciones')}>
          <MaterialIcons name="notifications" size={22} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Perfil')}>
          <Image source={require('../../../assets/sparkle.png')} style={styles.avatarImage} />
        </TouchableOpacity>
      </View>
      <SheetModal visible={showCurrency} onClose={() => setShowCurrency(false)} title="Moneda">
        <Text style={styles.rateCaption}>
          {tasa ? `Tasa BCV vigente: ${tasa} Bs/USD` : 'Tasa BCV no disponible'}
        </Text>
        {['Bs (Bolivianos)', 'USD (Dólares)'].map((opt) => {
          const val = opt.startsWith('Bs') ? 'Bs' : 'USD';
          return (
            <TouchableOpacity
              key={val}
              style={[styles.currencyOption, currency === val && styles.currencyOptionActive]}
              onPress={() => {
                setCurrency(val);
                setShowCurrency(false);
              }}
            >
              <MaterialIcons
                name={currency === val ? 'radio-button-checked' : 'radio-button-unchecked'}
                size={18}
                color={currency === val ? colors.onPrimaryContainer : colors.outline}
              />
              <Text style={[styles.currencyOptionText, currency === val && styles.currencyOptionTextActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </SheetModal>
    </>
  );
};

export const createBottomTabs = (screens) => {
  return () => (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
        tabBarActiveTintColor: colors.onPrimaryContainer,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerTitleAlign: 'center',
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

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    height: 64,
    paddingBottom: 8,
    paddingTop: 4,
    ...shadows.sm,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  tabItem: { paddingHorizontal: 4, borderRadius: borderRadius.lg },
  tabLabel: { ...typography.metadata, fontSize: 10, fontWeight: '700' },
  header: {
    backgroundColor: colors.surface,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  headerTitle: { ...typography.titleSm, color: colors.onSurface },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: spacing.md,
  },
  currencyToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 999,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  currencyPill: {
    fontFamily: typography.metadata.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: colors.outline,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  currencyActive: {
    color: colors.onPrimaryContainer,
    backgroundColor: colors.primaryContainer,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primaryContainer,
    overflow: 'hidden',
    backgroundColor: colors.secondaryContainer,
  },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  rateCaption: {
    ...typography.labelCaption,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  currencyOptionActive: { backgroundColor: colors.primaryContainer },
  currencyOptionText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  currencyOptionTextActive: { color: colors.onPrimaryContainer, fontWeight: '600' },
});
