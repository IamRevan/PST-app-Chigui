import { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SheetModal } from '../ui/Modal';
import { colors, typography, borderRadius, spacing, shadows } from '../../lib/theme';

const Tab = createBottomTabNavigator();

const TabIcon = ({ label, focused }) => (
  <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>
    {label === 'Dashboard' ? '🏠' :
     label === 'Inventario' ? '📦' :
     label === 'Pedidos' ? '🛒' :
     label === 'Clientes' ? '👥' :
     label === 'Perfil' ? '👤' : '📄'}
  </Text>
);

const HeaderRight = () => {
  const navigation = useNavigation();
  const [showCurrency, setShowCurrency] = useState(false);
  const [currency, setCurrency] = useState('Bs');

  return (
    <>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.currencyToggle} onPress={() => setShowCurrency(true)}>
          <Text style={[styles.currencyPill, currency === 'Bs' && styles.currencyActive]}>Bs</Text>
          <Text style={[styles.currencyPill, currency === 'USD' && styles.currencyActive]}>USD</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.getParent()?.navigate('Notificaciones')}>
          <Text style={styles.notifIcon}>🔔</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Perfil')}>
          <Text style={styles.avatarText}>🐹</Text>
        </TouchableOpacity>
      </View>
      <SheetModal visible={showCurrency} onClose={() => setShowCurrency(false)} title="Moneda">
        {['Bs (Bolivianos)', 'USD (Dólares)'].map((opt) => {
          const val = opt.startsWith('Bs') ? 'Bs' : 'USD';
          return (
            <TouchableOpacity
              key={val}
              style={[styles.currencyOption, currency === val && styles.currencyOptionActive]}
              onPress={() => { setCurrency(val); setShowCurrency(false); }}
            >
              <Text style={[styles.currencyOptionText, currency === val && styles.currencyOptionTextActive]}>
                {currency === val ? '● ' : '○ '}{opt}
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
  tabEmoji: { fontSize: 22, opacity: 0.5 },
  tabEmojiActive: { opacity: 1 },
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
  notifIcon: { fontSize: 20 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondaryContainer,
  },
  avatarText: { fontSize: 16 },
  currencyOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  currencyOptionActive: { backgroundColor: colors.primaryContainer },
  currencyOptionText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  currencyOptionTextActive: { color: colors.onPrimaryContainer, fontWeight: '600' },
});
