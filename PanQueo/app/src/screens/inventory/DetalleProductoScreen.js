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
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from "../../lib/theme";
import { AjusteInventarioModal } from "./AjusteInventarioModal";
import { useLotesByIngrediente } from "../../lib/hooks/useLotes";
import { useIngredienteById } from "../../lib/hooks/useInventario";

export const DetalleProductoScreen = ({ navigation, route }) => {
  const ingredienteId = route?.params?.ingredienteId || 1;
  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [selectedLote, setSelectedLote] = useState(null);

  const { data: ingrediente, loading: loadingIngrediente } = useIngredienteById(ingredienteId);
  const { data: lotes, loading: loadingLotes } = useLotesByIngrediente(ingredienteId);

  const handleAjuste = (lote = null) => {
    setSelectedLote(lote);
    setShowAjusteModal(true);
  };

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.logoRow}>
            <Text style={styles.logoEmoji}>🧁</Text>
            <Text style={styles.logoText}>PanQueo</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          {loadingIngrediente ? (
             <Text style={{textAlign: "center"}}>Cargando ingrediente...</Text>
          ) : (
            <>
              <View style={styles.iconCircle}>
                <Text style={styles.productIcon}>🥫</Text>
              </View>
              <View style={styles.infoContent}>
                <View style={styles.nameRow}>
                  <Text style={styles.productName}>{ingrediente?.nombre_ing || 'Ingrediente'}</Text>
                  <View style={styles.skuBadge}>
                    <Text style={styles.skuText}>ID-{ingrediente?.id_ingrediente}</Text>
                  </View>
                </View>
                <View style={styles.detailsGrid}>
                  <View>
                    <Text style={styles.detailLabel}>Stock Mínimo</Text>
                    <Text style={styles.detailValue}>{ingrediente?.stock_minimo || 0}</Text>
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>Unidad</Text>
                    <Text style={styles.detailValue}>{ingrediente?.unidad_medida}</Text>
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>Categoría</Text>
                    <Text style={styles.detailValue}>{ingrediente?.categoria || 'General'}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.infoActions}>
                <Button
                  title="Ajustar Stock"
                  variant="primary"
                  onPress={() => handleAjuste()}
                  style={styles.actionBtn}
                />
                <Button
                  title="Historial"
                  variant="outline"
                  onPress={() =>
                    navigation.navigate("HistorialProducto", {
                      productName: ingrediente?.nombre_ing,
                    })
                  }
                  style={styles.actionBtn}
                />
              </View>
            </>
          )}
        </View>

        <View style={styles.lotsSection}>
          <View style={styles.lotsHeader}>
            <View style={styles.lotsTitleRow}>
              <Text style={styles.lotsIcon}>📦</Text>
              <Text style={styles.lotsTitle}>Lotes en Inventario (FIFO)</Text>
            </View>
            <Text style={styles.lotsOrder}>Ordenado por vencimiento</Text>
          </View>
          <View style={styles.lotsCard}>
            <View style={styles.lotsHead}>
              <Text style={[styles.lotTh, { flex: 1.5 }]}>N° Lote</Text>
              <Text style={styles.lotTh}>Cantidad</Text>
              <Text style={styles.lotTh}>Ingreso</Text>
              <Text style={styles.lotTh}>Vencimiento</Text>
              <Text style={[styles.lotTh, { textAlign: "right" }]}>Estado</Text>
            </View>
            {loadingLotes && (
              <Text style={{ textAlign: "center", padding: 20 }}>
                Cargando lotes...
              </Text>
            )}

            {!loadingLotes &&
              lotes &&
              lotes.map((lot, i) => {
                const isExpired = new Date(lot.fecha_venc) < new Date();
                return (
                  <TouchableOpacity
                    key={lot.id_lote || i}
                    style={[
                      styles.lotRow,
                      i < lotes.length - 1 && styles.lotRowBorder,
                    ]}
                    onPress={() => handleAjuste(lot)}
                  >
                    <Text
                      style={[
                        styles.lotTd,
                        { flex: 1.5, ...typography.labelBold },
                      ]}
                    >
                      L-{lot.id_lote}
                    </Text>
                    <Text
                      style={[
                        styles.lotTd,
                        { ...typography.titleSm, color: colors.primary },
                      ]}
                    >
                      {lot.cantidad_actual}
                    </Text>
                    <Text style={styles.lotTd}>{lot.fecha_ingreso}</Text>
                    <Text
                      style={[
                        styles.lotTd,
                        isExpired && { color: colors.error, fontWeight: "600" },
                      ]}
                    >
                      {isExpired ? "⚠️ " : ""}
                      {lot.fecha_venc}
                    </Text>
                    <View style={[styles.lotTd, { alignItems: "flex-end" }]}>
                      <Text
                        style={[
                          styles.lotStatus,
                          isExpired
                            ? styles.statusExpired
                            : styles.statusActive,
                        ]}
                      >
                        {isExpired ? "Vencido" : "Vigente"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Uso Semanal Estimado</Text>
          <Text style={styles.chartSub}>Basado en órdenes del último mes</Text>
          <View style={styles.bars}>
            {["L", "M", "M", "J", "V", "S", "D"].map((day, i) => (
              <View key={i} style={styles.barCol}>
                <View
                  style={[
                    styles.bar,
                    { height: [40, 50, 30, 70, 45, 60, 20][i] },
                  ]}
                />
                <Text style={styles.barLabel}>{day}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <AjusteInventarioModal
        visible={showAjusteModal}
        onClose={() => setShowAjusteModal(false)}
        onSuccess={() =>
          Alert.alert("Ajuste Exitoso", "El stock se actualizó correctamente")
        }
        initialLote={selectedLote}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 40, gap: spacing.lg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: { padding: spacing.xs },
  backText: { fontSize: 24, color: colors.onSurface },
  logoRow: { flexDirection: "row", alignItems: "center", gap: spacing.base },
  logoEmoji: { fontSize: 24 },
  logoText: {
    ...typography.displayLgMobile,
    fontSize: 20,
    color: colors.primary,
  },
  infoCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
    ...shadows.md,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${colors.primaryContainer}1A`,
    alignItems: "center",
    justifyContent: "center",
  },
  productIcon: { fontSize: 40 },
  infoContent: { gap: spacing.md },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  productName: { ...typography.headlineMd, color: colors.primary },
  skuBadge: {
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
  },
  skuText: {
    ...typography.bodySm,
    color: colors.onSecondaryContainer,
    fontWeight: "600",
  },
  detailsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg },
  detailLabel: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    fontWeight: "600",
  },
  detailValue: { ...typography.titleSm, color: colors.onSurface },
  infoActions: { gap: spacing.sm },
  actionBtn: {},
  lotsSection: { gap: spacing.md },
  lotsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lotsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
  },
  lotsIcon: { fontSize: 20 },
  lotsTitle: { ...typography.titleSm, color: colors.onSurface },
  lotsOrder: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    fontStyle: "italic",
  },
  lotsCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    ...shadows.md,
  },
  lotsHead: {
    flexDirection: "row",
    backgroundColor: colors.surfaceContainerLow,
    paddingVertical: spacing.sm,
  },
  lotTh: {
    flex: 1,
    ...typography.labelBold,
    color: colors.onSurfaceVariant,
    paddingHorizontal: spacing.sm,
  },
  lotRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  lotRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: `${colors.outlineVariant}4D`,
  },
  lotTd: {
    flex: 1,
    ...typography.bodySm,
    color: colors.onSurface,
    paddingHorizontal: spacing.sm,
  },
  lotStatus: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
  },
  statusActive: {
    backgroundColor: colors.tertiaryContainer,
    color: colors.onTertiaryContainer,
  },
  statusExpired: {
    backgroundColor: colors.errorContainer,
    color: colors.onErrorContainer,
  },
  chartCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  chartTitle: { ...typography.labelBold, color: colors.onSurfaceVariant },
  chartSub: {
    ...typography.bodySm,
    color: `${colors.onSurfaceVariant}B3`,
    marginBottom: spacing.md,
  },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 80,
    gap: spacing.sm,
  },
  barCol: { flex: 1, alignItems: "center", gap: spacing.xs },
  bar: {
    width: "100%",
    backgroundColor: `${colors.primaryContainer}33`,
    borderRadius: 4,
  },
  barLabel: { fontSize: 10, fontWeight: "700", color: colors.onSurfaceVariant },
});
