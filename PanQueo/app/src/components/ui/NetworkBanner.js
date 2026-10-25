import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import NetInfo from "@react-native-community/netinfo";
import { colors, typography, spacing } from "../../lib/theme";
import apiClient from "../../lib/api/client";
import { ENDPOINTS } from "../../lib/api/endpoints";

export const NetworkBanner = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [isApiDown, setIsApiDown] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = !state.isConnected || state.isInternetReachable === false;
      setIsOffline(offline);
      if (!offline) {
        checkApiHealth();
      }
    });

    checkApiHealth();
    const interval = setInterval(checkApiHealth, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const checkApiHealth = async () => {
    try {
      await apiClient.get(ENDPOINTS.HEALTH, { timeout: 4000 });
      setIsApiDown(false);
    } catch {
      setIsApiDown(true);
    }
  };

  if (!isOffline && !isApiDown) return null;

  return (
    <TouchableOpacity
      style={[
        styles.banner,
        isOffline ? styles.offlineBg : styles.apiDownBg,
      ]}
      onPress={() => {
        try {
          navigation.navigate("Configuracion");
        } catch {}
      }}
      activeOpacity={0.8}
    >
      <Text style={styles.text}>
        {isOffline
          ? "⚠️ Sin conexión de red. Datos locales en caché."
          : "⚠️ Servidor API desconectado. Toca para revisar URL."}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  offlineBg: {
    backgroundColor: colors.error,
  },
  apiDownBg: {
    backgroundColor: "#d97706", // Amber 600
  },
  text: {
    ...typography.labelCaption,
    color: colors.white,
    fontWeight: "600",
    fontSize: 11,
  },
});
