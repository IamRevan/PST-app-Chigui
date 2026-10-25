import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenWrapper } from "../../components/navigation/ScreenWrapper";
import { Card, Badge } from "../../components/ui";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from "../../lib/theme";
import { useAlertasVencimiento } from "../../lib/hooks/useInventario";

export const AlertasVencimientoScreen = ({ navigation }) => {
  const { data: rawAlertas, loading } = useAlertasVencimiento();
  const alertas = Array.isArray(rawAlertas) ? rawAlertas : [];

  const getCriticidad = (dias) => {
    if (dias <= 3) return { label: "CRÍTICO", variant: "critical", color: colors.error };
    if (dias <= 7) return { label: "PRÓXIMO", variant: "warning", color: "#FF9800" };
    return { label: "VIGILANCIA", variant: "default", color: colors.onSurfaceVariant };
  };

  const criticos = alertas.filter((a) => (a.diasRestantes ?? a.dias ?? 0) <= 3);
  const proximos = alertas.filter(
    (a) => (a.diasRestantes ?? a.dias ?? 0) > 3 && (a.diasRestantes ?? a.dias ?? 0) <= 7,
  );
  const vigilancia = alertas.filter((a) => (a.diasRestantes ?? a.dias ?? 0) > 7);

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Alertas de Vencimiento</Text>
            <Text style={styles.subtitle}>
              Lotes con fecha de caducidad en los próximos 7 días
            </Text>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: colors.error }]}>
              {criticos.length}
            </Text>
            <Text style={styles.summaryLabel}>Críticos (≤ 3d)</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: "#FF9800" }]}>
              {proximos.length}
            </Text>
            <Text style={styles.summaryLabel}>Próximos (4-7d)</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: colors.onSurfaceVariant }]}>
              {vigilancia.length}
            </Text>
            <Text style={styles.summaryLabel}>Vigilancia</Text>
          </View>
        </View>

        {loading && (
          <Text style={styles.loadingText}>Verificando caducidad de lotes...</Text>
        )}

        {!loading && alertas.length === 0 && (
          <View style={styles.emptyCard}>
            <MaterialIcons name="verified" size={40} color={colors.tertiary} />
            <Text style={styles.emptyTitle}>¡Todo en orden!</Text>
            <Text style={styles.emptyDesc}>No hay materias primas próximas a vencer en los próximos 7 días.</Text>
          </View>
        )}

        {!loading &&
          alertas.map((item, idx) => {
            const dias = item.diasRestantes ?? item.dias ?? 0;
            const crit = getCriticidad(dias);
            const nombre = item.ingrediente || item.Ingrediente?.nombre_ing || `Ingrediente #${item.id_ingrediente || "?"}`;
            const cantidad = item.cantidad ?? item.cantidad_actual ?? 0;
            const unidad = item.unidad || item.Ingrediente?.unidad_medida || "";
            const fechaVenc = item.fechaVencimiento || item.fecha_venc || "";

            return (
              <Card
                key={item.id_lote ? `lote-${item.id_lote}` : `alert-${idx}`}
                style={styles.alertCard}
              >
                <View style={styles.alertHeader}>
                  <View style={styles.alertInfo}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                      <MaterialIcons name="alarm" size={20} color={crit.color} />
                      <Text style={styles.alertName}>{nombre}</Text>
                    </View>
                    <Badge label={crit.label} variant={crit.variant} />
                  </View>
                </View>
                <View style={styles.alertDetails}>
                  <View style={styles.alertStat}>
                    <Text style={styles.statLabel}>Lote</Text>
                    <Text style={styles.statValue}>#{item.id_lote}</Text>
                  </View>
                  <View style={styles.alertStat}>
                    <Text style={styles.statLabel}>Stock Disp.</Text>
                    <Text style={styles.statValue}>
                      {cantidad} {unidad}
                    </Text>
                  </View>
                  <View style={styles.alertStat}>
                    <Text style={styles.statLabel}>Vencimiento</Text>
                    <Text style={styles.statValue}>
                      {String(fechaVenc).slice(0, 10)}
                    </Text>
                  </View>
                  <View style={styles.alertStat}>
                    <Text style={styles.statLabel}>Tiempo</Text>
                    <Text style={[styles.statValue, { color: crit.color, fontWeight: "700" }]}>
                      {dias} día{dias === 1 ? "" : "s"}
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 40, gap: spacing.sm },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
    paddingTop: 4,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  title: { ...typography.headlineMd, fontSize: 20, color: colors.onSurface },
  subtitle: { ...typography.metadata, color: colors.onSurfaceVariant, fontSize: 12 },
  summaryGrid: { flexDirection: "row", gap: spacing.sm, marginVertical: 4 },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    alignItems: "center",
    gap: 2,
    ...shadows.sm,
  },
  summaryValue: { ...typography.headlineMd, fontSize: 22 },
  summaryLabel: { ...typography.labelCaption, color: colors.onSurfaceVariant, fontSize: 10, textAlign: "center" },
  loadingText: { textAlign: "center", padding: spacing.xl, color: colors.onSurfaceVariant },
  alertCard: { padding: spacing.md, gap: spacing.sm, borderRadius: borderRadius.lg },
  alertHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  alertInfo: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flex: 1 },
  alertName: { ...typography.titleSm, color: colors.onSurface, fontSize: 15, flex: 1 },
  alertDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceContainerLow,
    padding: 10,
    borderRadius: borderRadius.md,
  },
  alertStat: { alignItems: "center" },
  statLabel: { ...typography.metadata, color: colors.onSurfaceVariant, fontSize: 11 },
  statValue: { ...typography.bodySm, color: colors.onSurface, fontSize: 12, fontWeight: "600" },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
    gap: 8,
    marginTop: spacing.md,
  },
  emptyTitle: { ...typography.titleSm, color: colors.tertiary, fontSize: 16 },
  emptyDesc: { ...typography.bodySm, color: colors.onSurfaceVariant, textAlign: "center", fontSize: 13 },
});
