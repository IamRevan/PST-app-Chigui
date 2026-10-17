import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { ScreenWrapper } from "../../components/navigation/ScreenWrapper";
import { Button } from "../../components/ui";
import { SheetModal, CenterModal } from "../../components/ui/Modal";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from "../../lib/theme";
import {
  useReportesBalance,
  useReportesProduccion,
  useReportesMermas,
} from "../../lib/hooks/useReportes";
import { useCurrency } from "../../lib/currency";

const RANGOS = [
  "Últimos 7 días",
  "Últimos 30 días",
  "Este mes",
  "Mes pasado",
  "Personalizado",
];
const TABS = ["Balance", "Producción", "Mermas"];

export const ReportesScreen = ({ navigation }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [selectedRange, setSelectedRange] = useState("Últimos 7 días");
  const [activeTab, setActiveTab] = useState("Balance");

  // Por simplicidad de MVP, cargamos todos. Ideal: Solo cargar el activo y con fechas del selectedRange.
  const { data: balance, loading: loadingB } = useReportesBalance();
  const { data: produccion, loading: loadingP } = useReportesProduccion();
  const { data: mermas, loading: loadingM } = useReportesMermas();
  const { format } = useCurrency();

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.logoArea}>
            <Text style={styles.logoEmoji}>🧁</Text>
            <Text style={styles.logoText}>PanQueo</Text>
          </View>
        </View>

        <Text style={styles.title}>Reportes</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
        >
          {TABS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}
              onPress={() => setActiveTab(t)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === t && styles.tabTextActive,
                ]}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={styles.datePicker}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateIcon}>📅</Text>
          <Text style={styles.dateText}>{selectedRange}</Text>
          <Text style={styles.dateChange}>Filtro ▼</Text>
        </TouchableOpacity>

        {activeTab === "Balance" && (
          <View style={{ gap: spacing.md }}>
            <View style={styles.revenueCard}>
              <Text style={styles.revenueLabel}>Ingresos Pagados</Text>
              {loadingB ? (
                <Text>Cargando...</Text>
              ) : (
                <Text style={styles.revenueValue}>
                  {format(balance.total_ingresos || 0)}
                </Text>
              )}
            </View>

            <View style={styles.miniRow}>
              <View
                style={[
                  styles.miniCard,
                  {
                    backgroundColor: `${colors.error}15`,
                    borderColor: `${colors.error}33`,
                  },
                ]}
              >
                <Text style={styles.miniLabel}>Por Cobrar</Text>
                {loadingB ? (
                  <Text>...</Text>
                ) : (
                  <Text style={[styles.miniValue, { color: colors.error }]}>
                    {format(balance.total_pendientes || 0)}
                  </Text>
                )}
              </View>
              <View style={styles.miniCard}>
                <Text style={styles.miniLabel}>Total Pedidos</Text>
                {loadingB ? (
                  <Text>...</Text>
                ) : (
                  <Text style={styles.miniValue}>
                    {balance.desglose?.length || 0}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Desglose Reciente</Text>
              {loadingB ? (
                <Text>Cargando...</Text>
              ) : (
                balance.desglose?.slice(0, 5).map((d, i) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      paddingVertical: spacing.sm,
                      borderBottomWidth: 1,
                      borderColor: colors.surfaceVariant,
                    }}
                  >
                    <Text style={{ ...typography.bodySm }}>
                      {d.fecha_pedido.substring(0, 10)} - #{d.id_pedido}
                    </Text>
                    <Text
                      style={{
                        ...typography.labelBold,
                        color:
                          d.estado_pago === "Pagado"
                            ? colors.tertiary
                            : colors.error,
                      }}
                    >
                      ${d.costo_total}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {activeTab === "Producción" && (
          <View style={{ gap: spacing.md }}>
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Top Productos Producidos</Text>
              {loadingP ? (
                <Text>Cargando...</Text>
              ) : produccion.length === 0 ? (
                <Text
                  style={{
                    padding: spacing.md,
                    color: colors.onSurfaceVariant,
                  }}
                >
                  Sin datos
                </Text>
              ) : (
                produccion.map((p, i) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      paddingVertical: spacing.sm,
                      borderBottomWidth: 1,
                      borderColor: colors.surfaceVariant,
                    }}
                  >
                    <Text style={{ ...typography.bodyMd, flex: 1 }}>
                      {p.nombre_receta || p.Receta?.nombre_receta}
                    </Text>
                    <View style={styles.miniBadge}>
                      <Text style={styles.miniBadgeText}>
                        {p.cantidad || p.total_producido} unds
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {activeTab === "Mermas" && (
          <View style={{ gap: spacing.md }}>
            <View style={styles.revenueCard}>
              <Text style={styles.revenueLabel}>Valor Perdido Estimado</Text>
              {loadingM ? (
                <Text>Cargando...</Text>
              ) : (
                <Text style={[styles.revenueValue, { color: colors.error }]}>
                  $
                  {mermas
                    .reduce(
                      (acc, m) =>
                        acc +
                        parseFloat(m.cantidad_actual) *
                          parseFloat(m.precio_compra_unitario || 0),
                      0,
                    )
                    .toFixed(2)}
                </Text>
              )}
            </View>
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Lotes Vencidos</Text>
              {loadingM ? (
                <Text>Cargando...</Text>
              ) : mermas.length === 0 ? (
                <Text
                  style={{
                    padding: spacing.md,
                    color: colors.onSurfaceVariant,
                  }}
                >
                  No hay mermas registradas.
                </Text>
              ) : (
                mermas.map((m, i) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      paddingVertical: spacing.sm,
                      borderBottomWidth: 1,
                      borderColor: colors.surfaceVariant,
                    }}
                  >
                    <View>
                      <Text style={{ ...typography.labelBold }}>
                        {m.Ingrediente?.nombre_ing}
                      </Text>
                      <Text
                        style={{
                          ...typography.bodySm,
                          color: colors.onSurfaceVariant,
                        }}
                      >
                        Venció: {m.fecha_venc}
                      </Text>
                    </View>
                    <Text
                      style={{ ...typography.titleSm, color: colors.error }}
                    >
                      {m.cantidad_actual} {m.Ingrediente?.unidad_medida}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        <Button
          title="Descargar PDF"
          variant="primary"
          onPress={() => setShowDownload(true)}
          style={styles.downloadBtn}
        />
      </ScrollView>

      <SheetModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        title="Seleccionar período"
      >
        {RANGOS.map((r) => (
          <TouchableOpacity
            key={r}
            style={[
              styles.rangeItem,
              selectedRange === r && styles.rangeItemActive,
            ]}
            onPress={() => {
              setSelectedRange(r);
              setShowDatePicker(false);
            }}
          >
            <Text
              style={[
                styles.rangeText,
                selectedRange === r && styles.rangeTextActive,
              ]}
            >
              {selectedRange === r ? "● " : "○ "}
              {r}
            </Text>
          </TouchableOpacity>
        ))}
      </SheetModal>

      <CenterModal
        visible={showDownload}
        onClose={() => setShowDownload(false)}
        title="Descargar Reporte"
      >
        <Text style={styles.downloadDesc}>
          Se generará un archivo PDF con los reportes del período seleccionado.
        </Text>
        <View style={styles.downloadFormats}>
          {["PDF", "Excel", "CSV"].map((fmt) => (
            <TouchableOpacity key={fmt} style={styles.formatBtn}>
              <Text style={styles.formatBtnText}>{fmt}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Button
          title="Descargar"
          variant="primary"
          onPress={() => {
            setShowDownload(false);
            Alert.alert("Descarga", "Reporte descargado exitosamente");
          }}
          style={{ marginTop: spacing.md }}
        />
      </CenterModal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 40, gap: spacing.md },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backIcon: { fontSize: 24, color: colors.onSurface },
  logoArea: { flexDirection: "row", alignItems: "center", gap: spacing.base },
  logoEmoji: { fontSize: 20 },
  logoText: {
    ...typography.displayLgMobile,
    fontSize: 20,
    color: colors.primary,
  },
  title: { ...typography.headlineMd, color: colors.onSurface },
  tabsContainer: {
    flexDirection: "row",
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  tabBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerLowest,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  tabBtnActive: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primaryContainer,
  },
  tabText: { ...typography.labelBold, color: colors.onSurfaceVariant },
  tabTextActive: { color: colors.onPrimaryContainer },
  datePicker: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.sm,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  dateIcon: { fontSize: 16 },
  dateText: { ...typography.bodySm, color: colors.onSurfaceVariant, flex: 1 },
  dateChange: { ...typography.labelBold, color: colors.primary },
  revenueCard: {
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.md,
    borderWidth: 1,
    borderColor: `${colors.outlineVariant}80`,
    gap: spacing.xs,
  },
  revenueLabel: {
    ...typography.labelBold,
    color: colors.onSurfaceVariant,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  revenueValue: { fontSize: 32, fontWeight: "700", color: colors.onSurface },
  revenueTrend: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  trendIcon: { fontSize: 16 },
  trendText: {
    ...typography.bodySm,
    color: colors.tertiary,
    fontWeight: "600",
  },
  miniRow: { flexDirection: "row", gap: spacing.md },
  miniCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    ...shadows.md,
    borderWidth: 1,
    borderColor: `${colors.outlineVariant}80`,
    gap: spacing.xs,
  },
  miniLabel: {
    ...typography.labelBold,
    color: colors.onSurfaceVariant,
    fontSize: 12,
  },
  miniValue: { fontSize: 20, fontWeight: "700", color: colors.onSurface },
  miniBadge: {
    backgroundColor: `${colors.tertiaryContainer}4D`,
    paddingHorizontal: spacing.base,
    paddingVertical: 1,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  miniBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.onTertiaryContainer,
  },
  chartCard: {
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.md,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  chartTitle: { ...typography.labelBold, color: colors.onSurface },
  chartInfo: { fontSize: 16 },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 160,
    gap: spacing.sm,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.base,
  },
  bar: { width: "60%", backgroundColor: colors.primary, borderRadius: 4 },
  barLabel: { fontSize: 10, fontWeight: "700", color: colors.onSurfaceVariant },
  pieRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  pie: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surfaceContainerLow,
    position: "relative",
  },
  pieSeg: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  legend: { flex: 1, gap: spacing.sm },
  legendRow: { flexDirection: "row", alignItems: "center", gap: spacing.base },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { ...typography.bodySm, color: colors.onSurface, flex: 1 },
  legendPct: { fontWeight: "700", color: colors.onSurfaceVariant },
  downloadBtn: { marginTop: spacing.sm },
  rangeItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  rangeItemActive: { backgroundColor: colors.primaryContainer },
  rangeText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  rangeTextActive: { color: colors.onPrimaryContainer, fontWeight: "600" },
  downloadDesc: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  downloadFormats: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
  },
  formatBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  formatBtnText: { ...typography.labelBold, color: colors.onSurface },
});
