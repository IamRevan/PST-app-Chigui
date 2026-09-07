import { View, Text, StyleSheet, ScrollView } from "react-native";
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

export const AlertasVencimientoScreen = () => {
  const { data: alertas, loading } = useAlertasVencimiento();

  const getCriticidad = (dias) => {
    if (dias <= 3) return { label: "CRÍTICO", variant: "critical" };
    if (dias <= 7) return { label: "PRÓXIMO", variant: "warning" };
    return { label: "VIGILANCIA", variant: "default" };
  };

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Alertas de Vencimiento</Text>
        <Text style={styles.subtitle}>
          Productos próximos a vencer (7 días)
        </Text>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: colors.error }]}>
              {alertas?.filter((a) => a.dias <= 3).length || 0}
            </Text>
            <Text style={styles.summaryLabel}>Críticos</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text
              style={[styles.summaryValue, { color: colors.primaryContainer }]}
            >
              {alertas?.filter((a) => a.dias > 3 && a.dias <= 7).length || 0}
            </Text>
            <Text style={styles.summaryLabel}>Próximos</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text
              style={[styles.summaryValue, { color: colors.onSurfaceVariant }]}
            >
              {alertas?.filter((a) => a.dias > 7).length || 0}
            </Text>
            <Text style={styles.summaryLabel}>Vigilancia</Text>
          </View>
        </View>

        {loading && (
          <Text style={{ textAlign: "center", padding: 20 }}>
            Cargando alertas...
          </Text>
        )}

        {!loading &&
          alertas &&
          alertas.map((item) => {
            const crit = getCriticidad(item.dias);
            return (
              <Card
                key={item.id_lote || Math.random()}
                style={styles.alertCard}
              >
                <View style={styles.alertHeader}>
                  <View style={styles.alertInfo}>
                    <Text style={styles.alertName}>
                      {item.Ingrediente?.nombre_ing || "Ingrediente"}
                    </Text>
                    <Badge label={crit.label} variant={crit.variant} />
                  </View>
                </View>
                <View style={styles.alertDetails}>
                  <View style={styles.alertStat}>
                    <Text style={styles.statLabel}>Lote</Text>
                    <Text style={styles.statValue}>{item.id_lote}</Text>
                  </View>
                  <View style={styles.alertStat}>
                    <Text style={styles.statLabel}>Stock</Text>
                    <Text style={styles.statValue}>
                      {item.cantidad_actual} {item.Ingrediente?.unidad_medida}
                    </Text>
                  </View>
                  <View style={styles.alertStat}>
                    <Text style={styles.statLabel}>Vence</Text>
                    <Text style={styles.statValue}>{item.fecha_venc}</Text>
                  </View>
                  <View style={styles.alertStat}>
                    <Text style={styles.statLabel}>Días</Text>
                    <Text
                      style={[
                        styles.statValue,
                        {
                          color:
                            crit.variant === "critical"
                              ? colors.error
                              : colors.primaryContainer,
                        },
                      ]}
                    >
                      {item.dias}d
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
  content: { padding: spacing.gutter, paddingBottom: 40 },
  title: { ...typography.headlineMd, color: colors.onSurface },
  subtitle: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.md,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    alignItems: "center",
  },
  summaryValue: { ...typography.displayLgMobile, fontSize: 24 },
  summaryLabel: { ...typography.metadata, color: colors.onSurfaceVariant },
  alertCard: { marginBottom: spacing.sm },
  alertHeader: { marginBottom: spacing.sm },
  alertInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  alertName: { ...typography.labelBold, color: colors.onSurface },
  alertDetails: { flexDirection: "row", gap: spacing.sm },
  alertStat: { flex: 1 },
  statLabel: { ...typography.metadata, color: colors.onSurfaceVariant },
  statValue: {
    ...typography.bodySm,
    fontWeight: "600",
    color: colors.onSurface,
  },
});
