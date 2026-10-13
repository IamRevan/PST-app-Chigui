import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../auth/AuthContext';
import { createBottomTabs } from '../components/navigation/BottomTabs';
import { createAuthStack } from '../components/navigation/AuthStack';
import { Loading } from '../components/ui';

import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { InventoryScreen } from '../screens/inventory/InventoryScreen';
import { OrdersScreen } from '../screens/orders/OrdersScreen';
import { ClientsScreen } from '../screens/clients/ClientsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { RecipesScreen } from '../screens/recipes/RecipesScreen';
import { NuevaRecetaScreen } from '../screens/recipes/NuevaRecetaScreen';
import { HistorialProductoScreen } from '../screens/inventory/HistorialProductoScreen';
import { NotificacionesScreen } from '../screens/notifications/NotificacionesScreen';
// Phase B screens
import { NuevoPedidoScreen } from '../screens/orders/NuevoPedidoScreen';
import { DetallePedidoScreen } from '../screens/orders/DetallePedidoScreen';
import { AlertasVencimientoScreen } from '../screens/inventory/AlertasVencimientoScreen';
import { HistorialClienteScreen } from '../screens/clients/HistorialClienteScreen';
import { DetalleProductoScreen } from '../screens/inventory/DetalleProductoScreen';
import { ConfiguracionScreen } from '../screens/profile/ConfiguracionScreen';
import { SeguridadScreen } from '../screens/profile/SeguridadScreen';
import { AcercaDeScreen } from '../screens/profile/AcercaDeScreen';
import { ReportesScreen } from '../screens/dashboard/ReportesScreen';
import { ListaComprasScreen } from '../screens/inventory/ListaComprasScreen';
import { PedidoExitosoScreen } from '../screens/success/PedidoExitosoScreen';
import { LoteExitosoScreen } from '../screens/success/LoteExitosoScreen';
import { RegistroExitosoScreen } from '../screens/success/RegistroExitosoScreen';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabs([
  { name: 'Dashboard', component: DashboardScreen },
  { name: 'Inventario', component: InventoryScreen },
  { name: 'Pedidos', component: OrdersScreen },
  { name: 'Clientes', component: ClientsScreen },
  { name: 'Perfil', component: ProfileScreen },
]);

const AuthStackComponent = createAuthStack([
  { name: 'Login', component: LoginScreen },
  { name: 'Register', component: RegisterScreen },
  { name: 'ResetPassword', component: ResetPasswordScreen },
]);

const MainStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Tabs" component={Tabs} />
    <Stack.Screen name="Recipes" component={RecipesScreen} />
    <Stack.Screen name="NuevaReceta" component={NuevaRecetaScreen} />
    <Stack.Screen name="HistorialProducto" component={HistorialProductoScreen} />
    <Stack.Screen name="Notificaciones" component={NotificacionesScreen} />
    <Stack.Screen name="NuevoPedido" component={NuevoPedidoScreen} />
    <Stack.Screen name="DetallePedido" component={DetallePedidoScreen} />
    <Stack.Screen name="AlertasVencimiento" component={AlertasVencimientoScreen} />
    <Stack.Screen name="HistorialCliente" component={HistorialClienteScreen} />
    <Stack.Screen name="DetalleProducto" component={DetalleProductoScreen} />
    <Stack.Screen name="Configuracion" component={ConfiguracionScreen} />
    <Stack.Screen name="Seguridad" component={SeguridadScreen} />
    <Stack.Screen name="AcercaDe" component={AcercaDeScreen} />
    <Stack.Screen name="Reportes" component={ReportesScreen} />
    <Stack.Screen name="ListaCompras" component={ListaComprasScreen} />
    <Stack.Screen name="PedidoExitoso" component={PedidoExitosoScreen} />
    <Stack.Screen name="LoteExitoso" component={LoteExitosoScreen} />
    <Stack.Screen name="RegistroExitoso" component={RegistroExitosoScreen} />
  </Stack.Navigator>
);

export const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <Loading />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainStack} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStackComponent} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
