import { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { colors, typography, spacing } from "../../lib/theme";

export const NetworkBanner = () => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected && state.isInternetReachable !== false);
    });

    return () => unsubscribe();
  }, []);

  if (isConnected) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>⚠️ Sin conexión a Internet. Modo Offline.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.error,
    padding: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    ...typography.labelBold,
    color: colors.white,
    fontSize: 12,
  },
});
