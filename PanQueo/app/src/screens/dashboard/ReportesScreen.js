import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenWrapper } from "../../components/navigation/ScreenWrapper";
import { Card, Badge, Button } from "../../components/ui";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from "../../lib/theme";
import {
  useReportesProduccion,
  useReportesMermas,
  useReportesTrazabilidad,
  useReportesBalance,
} from "../../lib/hooks/useReportes";
import { useCurrency } from "../../lib/currency";

const TABS = [
  { key: "produccion", label: "Producción", icon: "precision-manufacturing" },
  { key: "mermas", label: "Mermas", icon: "warning-amber" },
  { key: "trazabilidad", label: "Trazabilidad FEFO", icon: "history" },
  { key: "balance", label: "Balance", icon: "account-balance-wallet" },
];

export const ReportesScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState("produccion");

  const { data: rawProd, loading: loadingProd } = useReportesProduccion();
  const { data: rawMermas, loading: loadingMermas } = useReportesMermas();
  const { data: rawTraz, loading: loadingTraz } = useReportesTrazabilidad();
  const { data: rawBalance, loading: loadingBalance } = useReportesBalance();

  const { format, formatDual } = useCurrency();

  const produccion = rawProd || {};
  const mermas = rawMermas || {};
  const trazabilidad = rawTraz || {};
  const balance = rawBalance || {};

  const recetasProd = Object.entries(produccion.producidosPorReceta || {}).sort(
    (a, b) => b[1] - a[1],
  );
  const maxProd = Math.max(1, ...recetasProd.map((r) => r[1]));

  const lotesVencidos = Array.isArray(mermas.lotes) ? mermas.lotes : [];
  const registrosTraz = Array.isArray(trazabilidad.registros) ? trazabilidad.registros : [];

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
            <Text style={styles.title}>Reportes y Auditoría</Text>
            <Text style={styles.subtitle}>Producción, mermas e historial FEFO/FIFO</Text>
          </View>
        </View>

        {/* Barra horizontal de pestañas */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {TABS.map((t) => {
            const active = activeTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
                onPress={() => setActiveTab(t.key)}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={t.icon}
                  size={16}
                  color={active ? colors.onPrimaryContainer : colors.onSurfaceVariant}
                />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* TAB 1: PRODUCCIÓN */}
        {activeTab === "produccion" && (
          <View style={styles.tabBody}>
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>{produccion.totalProducido ?? 0}</Text>
                <Text style={styles.kpiLabel}>Unidades Producidas</Text>
                <Text style={styles.kpiSub}>Listo · Cocina · Entregado</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Producción por Receta</Text>
            {loadingProd ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : recetasProd.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialIcons name="cake" size={36} color={colors.outline} />
                <Text style={styles.emptyText}>Aún no hay producción registrada.</Text>
              </View>
            ) : (
              recetasProd.map(([nombre, cantidad]) => {
                const porcentaje = Math.round((cantidad / maxProd) * 100);
                return (
                  <View key={nombre} style={styles.barItemCard}>
                    <View style={styles.barItemHeader}>
                      <Text style={styles.barItemName}>{nombre}</Text>
                      <Text style={styles.barItemCount}>{cantidad} uds</Text>
                    </View>
                    <View style={styles.barBg}>
                      <View style={[styles.barFill, { width: `${porcentaje}%` }]} />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* TAB 2: MERMAS */}
        {activeTab === "mermas" && (
          <View style={styles.tabBody}>
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <Text style={[styles.kpiValue, { color: colors.error }]}>
                  {mermas.totalLotesVencidos ?? 0}
                </Text>
                <Text style={styles.kpiLabel}>Lotes Vencidos</Text>
                <Text style={styles.kpiSub}>Con stock actual</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={[styles.kpiValue, { color: colors.error }]}>
                  {parseFloat(mermas.mermaTotal ?? 0)}
                </Text>
                <Text style={styles.kpiLabel}>Cantidad Perdida</Text>
                <Text style={styles.kpiSub}>Unidades en riesgo</Text>
              </View>
            </View>

            <View style={styles.valueAtRiskBox}>
              <Text style={styles.valueAtRiskLabel}>Valor Financiero en Riesgo</Text>
              <Text style={styles.valueAtRiskAmount}>
                {formatDual(mermas.mermaValorEstimado || 0)}
              </Text>
              <Text style={styles.valueAtRiskSub}>Según precio de compra de los lotes</Text>
            </View>

            <Text style={styles.sectionTitle}>Detalle de Lotes Vencidos (FEFO)</Text>
            {loadingMermas ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : lotesVencidos.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialIcons name="verified" size={36} color={colors.tertiary} />
                <Text style={styles.emptyText}>Sin mermas: ningún lote vencido con stock disponible. 🎉</Text>
              </View>
            ) : (
              lotesVencidos.map((l) => (
                <View key={l.id_lote} style={styles.mermaItemCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mermaItemName}>
                      {l.Ingrediente?.nombre_ing || `Ingrediente #${l.id_ingrediente}`}
                    </Text>
                    <Text style={styles.mermaItemMeta}>
                      Lote #{l.id_lote} · Venció: {String(l.fecha_venc || "").slice(0, 10)}
                    </Text>
                  </View>
                  <Text style={styles.mermaItemQty}>
                    {parseFloat(l.cantidad_actual)} {l.Ingrediente?.unidad_medida || ""}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 3: TRAZABILIDAD FEFO */}
        {activeTab === "trazabilidad" && (
          <View style={styles.tabBody}>
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>{trazabilidad.totalRegistros ?? 0}</Text>
                <Text style={styles.kpiLabel}>Descuentos FIFO</Text>
                <Text style={styles.kpiSub}>Pedidos procesados</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>
                  {parseFloat(trazabilidad.totalConsumido ?? 0)}
                </Text>
                <Text style={styles.kpiLabel}>Uds Consumidas</Text>
                <Text style={styles.kpiSub}>Materia prima usada</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text
                  style={[
                    styles.kpiValue,
                    {
                      color:
                        (trazabilidad.violacionesFEFO || 0) > 0
                          ? colors.error
                          : colors.tertiary,
                    },
                  ]}
                >
                  {trazabilidad.violacionesFEFO ?? 0}
                </Text>
                <Text style={styles.kpiLabel}>Violaciones FEFO</Text>
                <Text style={styles.kpiSub}>Lote no más antiguo</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Últimos Descuentos por Pedido (Auditoría)</Text>
            {loadingTraz ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : registrosTraz.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialIcons name="history" size={36} color={colors.outline} />
                <Text style={styles.emptyText}>
                  Sin consumos registrados aún: se generan automáticamente al pasar un pedido a "En Cocina".
                </Text>
              </View>
            ) : (
              registrosTraz.map((r, i) => (
                <View key={r.id_consumo || i} style={styles.trazItemCard}>
                  <View style={styles.trazItemTop}>
                    <Text style={styles.trazItemIng}>{r.ingrediente}</Text>
                    <Text style={styles.trazItemQty}>
                      {r.cantidad_consumida} {r.fefo ? "" : " ⚠️"}
                    </Text>
                  </View>
                  <View style={styles.trazItemBottom}>
                    <Text style={styles.trazItemMeta}>
                      Lote #{r.lote?.id_lote ?? "?"} · venc. {r.lote?.fecha_venc ? String(r.lote.fecha_venc).slice(0, 10) : "?"}
                    </Text>
                    <Text style={styles.trazItemMeta}>
                      {r.pedido ? `Pedido #${r.pedido.id_pedido}` : "Ajuste"} · {String(r.fecha_consumo || "").slice(0, 10)}
                    </Text>
                  </View>
                  {!r.fefo && (
                    <View style={styles.fefoAlertBox}>
                      <Text style={styles.fefoAlertText}>
                        No FEFO: se omitieron lotes más antiguos (
                        {(r.lotes_mas_antiguos_omitidos || []).map((l) => l.id_lote || l).join(", ")}
                        )
                      </Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* TAB 4: BALANCE */}
        {activeTab === "balance" && (
          <View style={styles.tabBody}>
            <View style={styles.revenueCard}>
              <Text style={styles.revenueLabel}>Ingresos Totales Cobrados</Text>
              <Text style={styles.revenueValue}>{formatDual(balance.total_ingresos || 0)}</Text>
            </View>

            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, { borderColor: `${colors.error}40` }]}>
                <Text style={[styles.kpiValue, { color: colors.error }]}>
                  {formatDual(balance.total_pendientes || 0)}
                </Text>
                <Text style={styles.kpiLabel}>Pendiente por Cobrar</Text>
                <Text style={styles.kpiSub}>Pedidos abonados o pendientes</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 40, gap: spacing.md },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingTop: 4,
    marginBottom: spacing.xs,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  title: { ...typography.headlineMd, fontSize: 20, color: colors.onSurface },
  subtitle: { ...typography.metadata, color: colors.onSurfaceVariant, fontSize: 12 },
  tabsContainer: { marginVertical: 4 },
  tabsContent: { gap: 6 },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  tabBtnActive: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primaryContainer,
  },
  tabText: { ...typography.labelCaption, fontSize: 12, color: colors.onSurfaceVariant, fontWeight: "600" },
  tabTextActive: { color: colors.onPrimaryContainer, fontWeight: "700" },
  tabBody: { gap: spacing.md },
  sectionTitle: {
    ...typography.labelBold,
    color: colors.primary,
    fontSize: 12,
    textTransform: "uppercase",
  },
  kpiRow: { flexDirection: "row", gap: spacing.sm },
  kpiGrid: { flexDirection: "row", gap: spacing.xs },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    alignItems: "center",
    gap: 2,
  },
  kpiValue: { ...typography.headlineMd, fontSize: 20, color: colors.primary },
  kpiLabel: { ...typography.labelCaption, fontWeight: "700", color: colors.onSurface, fontSize: 11 },
  kpiSub: { ...typography.metadata, fontSize: 10, color: colors.onSurfaceVariant, textAlign: "center" },
  barItemCard: {
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    gap: 6,
  },
  barItemHeader: { flexDirection: "row", justifyContent: "space-between" },
  barItemName: { ...typography.bodySm, fontWeight: "600", color: colors.onSurface, flex: 1 },
  barItemCount: { ...typography.labelBold, color: colors.primary, fontSize: 13 },
  barBg: {
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.primaryContainer}30`,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.full,
  },
  valueAtRiskBox: {
    backgroundColor: "rgba(255,82,82,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,82,82,0.25)",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    gap: 2,
  },
  valueAtRiskLabel: { ...typography.labelCaption, color: colors.error, textTransform: "uppercase", fontWeight: "700" },
  valueAtRiskAmount: { ...typography.headlineMd, color: colors.error, fontSize: 18 },
  valueAtRiskSub: { ...typography.metadata, color: colors.onSurfaceVariant, fontSize: 11 },
  mermaItemCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "rgba(255,138,128,0.08)",
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(255,138,128,0.2)",
  },
  mermaItemName: { ...typography.bodySm, fontWeight: "600", color: colors.onSurface },
  mermaItemMeta: { ...typography.metadata, color: colors.onSurfaceVariant, fontSize: 11 },
  mermaItemQty: { ...typography.labelBold, color: colors.error, fontSize: 13 },
  trazItemCard: {
    backgroundColor: colors.surfaceContainerLowest,
    padding: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    gap: 4,
  },
  trazItemTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  trazItemIng: { ...typography.bodySm, fontWeight: "700", color: colors.onSurface },
  trazItemQty: { ...typography.labelBold, color: colors.primary, fontSize: 12 },
  trazItemBottom: { flexDirection: "row", justifyContent: "space-between" },
  trazItemMeta: { ...typography.metadata, color: colors.onSurfaceVariant, fontSize: 11 },
  fefoAlertBox: {
    backgroundColor: "rgba(255,82,82,0.1)",
    padding: 6,
    borderRadius: borderRadius.sm,
    marginTop: 2,
  },
  fefoAlertText: { ...typography.metadata, color: colors.error, fontSize: 10, fontWeight: "600" },
  revenueCard: {
    backgroundColor: `${colors.primaryContainer}25`,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primaryContainer,
  },
  revenueLabel: { ...typography.labelCaption, color: colors.primary, fontWeight: "700", textTransform: "uppercase" },
  revenueValue: { ...typography.headlineMd, color: colors.primary, fontSize: 24 },
  emptyCard: {
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
    gap: 8,
  },
  emptyText: { ...typography.bodySm, color: colors.onSurfaceVariant, textAlign: "center" },
});
