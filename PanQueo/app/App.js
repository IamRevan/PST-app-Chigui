import { registerRootComponent } from 'expo';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { AuthProvider } from './src/auth/AuthContext';
import { CurrencyProvider } from './src/lib/currency';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  // Carga de fuentes de marca (Inter + Poppins) antes de renderizar.
  // Expo mantiene el splash nativo visible mientras fontsLoaded es false.
  const [fontsLoaded] = useFonts({
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return <StatusBar style="dark" />;
  }

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <AuthProvider>
        <CurrencyProvider>
          <AppNavigator />
        </CurrencyProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

registerRootComponent(App);
