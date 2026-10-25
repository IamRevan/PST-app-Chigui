import { StyleSheet, Platform, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../lib/theme";
import { NetworkBanner } from "../ui/NetworkBanner";

/**
 * ScreenWrapper homologado para Android e iOS:
 * - Utiliza react-native-safe-area-context eliminando el warning de SafeAreaView deprecado.
 * - Protege los botones superiores (atrás, acciones) del choque con el notch y barra de notificaciones en Android.
 * - Admite personalización de edges según el contexto de la pantalla.
 */
export const ScreenWrapper = ({ children, style, edges = ["top"] }) => {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={[
        styles.container,
        // En Android, si insets.top es muy pequeño o 0, aseguramos holgura mínima de 12px
        Platform.OS === "android" && insets.top <= 20 && { paddingTop: 8 },
        style,
      ]}
      edges={edges}
    >
      <NetworkBanner />
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
});
