import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
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
import { useCurrency } from "../../lib/currency";

export const DetalleProductoScreen = ({ navigation, route }) => {
  const ingredienteId = route?.params?.ingredienteId;
  const [showAjusteModal, setShowAjusteModal] = useState(false);
  const [selectedLote, setSelectedLote] = useState(null);

  const { data: ingrediente, loading: loadingIngrediente } = useIngredienteById(ingredienteId);
  const { data: lotes, loading: loadingLotes, refetch: refetchLotes } = useLotesByIngrediente(ingredienteId);
  const { formatDual } = useCurrency();

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
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Detalle del Insumo</Text>
            <Text style={styles.headerSub}>Control de lotes y trazabilidad</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          {loadingIngrediente ? (
            <Text style={{ textAlign: "center", padding: spacing.md }}>Cargando ingrediente...</Text>
          ) : (
            <>
              <View style={styles.iconCircle}>
                <MaterialIcons name="kitchen" size={26} color={colors.primary} />
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
                    <Text style={styles.detailLabel}>Stock Actual</Text>
                    <Text style={[styles.detailValue, { color: colors.primary, fontWeight: '700' }]}>
                      {parseFloat(ingrediente?.stock_actual || 0)} {ingrediente?.unidad_medida}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.detailLabel}>Stock Mínimo</Text>
                    <Text style={styles.detailValue}>{ingrediente?.stock_minimo || 0} {ingrediente?.unidad_medida}</Text>
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
                  title="Historial de Movimientos"
                  variant="outline"
                  onPress={() =>
                    navigation.navigate("HistorialProducto", {
                      ingredienteId: ingrediente?.id_ingrediente,
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
              <MaterialIcons name="inventory-2" size={18} color={colors.primary} />
              <Text style={styles.lotsTitle}>Lotes en Inventario (FIFO/FEFO)</Text>
            </View>
            <Text style={styles.lotsOrder}>Ordenados por vencimiento ascendente</Text>
          </View>
          <View style={styles.lotsCard}>
            <View style={styles.lotsHead}>
              <Text style={[styles.lotTh, { flex: 1.2 }]}>N° Lote</Text>
              <Text style={styles.lotTh}>Disp.</Text>
              <Text style={styles.lotTh}>Vencimiento</Text>
              <Text style={[styles.lotTh, { textAlign: "right" }]}>Estado</Text>
            </View>
            {loadingLotes && (
              <Text style={{ textAlign: "center", padding: 20 }}>
                Cargando lotes...
              </Text>
            )}

            {!loadingLotes && (!lotes || lotes.length === 0) && (
              <Text style={styles.emptyLotesText}>
                Sin lotes activos en existencia para este ingrediente.
              </Text>
            )}

            {!loadingLotes &&
              lotes &&
              lotes.map((lot, i) => {
                const isExpired = new Date(lot.fecha_venc) < new Date();
                const cant = parseFloat(lot.cantidad_actual || 0);
                return (
                  <TouchableOpacity
                    key={lot.id_lote || i}
                    style={[
                      styles.lotRow,
                      i < lotes.length - 1 && styles.lotRowBorder,
                    ]}
                    onPress={() => handleAjuste(lot)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1.2 }}>
                      <Text style={styles.lotId}>#{lot.id_lote}</Text>
                      {lot.precio_compra_unitario ? (
                        <Text style={styles.lotPrice}>
                          {formatDual(lot.precio_compra_unitario)}/u
                        </Text>
                      ) : null}
                    </View>
                    <Text style={styles.lotQty}>
                      {cant} {ingrediente?.unidad_medida}
                    </Text>
                    <Text style={styles.lotDate}>
                      {String(lot.fecha_venc || "").slice(0, 10)}
                    </Text>
                    <View style={{ alignItems: "flex-end" }}>
                      <View
                        style={[
                          styles.statusBadge,
                          isExpired ? styles.statusExpired : styles.statusNormal,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            isExpired ? styles.statusExpiredText : styles.statusNormalText,
                          ]}
                        >
                          {isExpired ? "Vencido" : "Activo"}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
          </View>
        </View>
      </ScrollView>

      <AjusteInventarioModal
        visible={showAjusteModal}
        onClose={() => setShowAjusteModal(false)}
        ingrediente={ingrediente}
        lote={selectedLote}
        onSuccess={() => {
          refetchLotes();
          navigation.navigate("LoteExitoso");
        }}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 40, gap: spacing.md },
  header: {
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
  headerInfo: { flex: 1 },
  headerTitle: { ...typography.headlineMd, fontSize: 18, color: colors.onSurface },
  headerSub: { ...typography.metadata, color: colors.onSurfaceVariant, fontSize: 11 },
  infoCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    ...shadows.sm,
    gap: spacing.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${colors.primaryContainer}30`,
    justifyContent: "center",
    alignItems: "center",
  },
  infoContent: { gap: 6 },
  nameRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  productName: { ...typography.titleSm, color: colors.onSurface, fontSize: 16 },
  skuBadge: {
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  skuText: { ...typography.metadata, color: colors.primary, fontWeight: "700" },
  detailsGrid: { flexDirection: "row", justifyContent: "space-between", paddingTop: 4 },
  detailLabel: { ...typography.metadata, color: colors.onSurfaceVariant, fontSize: 11 },
  detailValue: { ...typography.bodySm, color: colors.onSurface, fontSize: 13 },
  infoActions: { flexDirection: "row", gap: spacing.sm, paddingTop: 4 },
  actionBtn: { flex: 1 },
  lotsSection: { gap: spacing.xs },
  lotsHeader: { gap: 2 },
  lotsTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  lotsTitle: { ...typography.labelBold, color: colors.primary, fontSize: 13, textTransform: "uppercase" },
  lotsOrder: { ...typography.metadata, color: colors.onSurfaceVariant, fontSize: 11 },
  lotsCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    overflow: "hidden",
    ...shadows.sm,
  },
  lotsHead: {
    flexDirection: "row",
    backgroundColor: colors.surfaceContainerLow,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  lotTh: { ...typography.labelCaption, color: colors.onSurfaceVariant, flex: 1, fontSize: 11 },
  lotRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  lotRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.surfaceVariant },
  lotId: { ...typography.labelBold, color: colors.primary, fontSize: 12 },
  lotPrice: { ...typography.metadata, color: colors.outline, fontSize: 10 },
  lotQty: { ...typography.bodySm, flex: 1, color: colors.onSurface, fontSize: 12 },
  lotDate: { ...typography.metadata, flex: 1, color: colors.onSurfaceVariant, fontSize: 11 },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: borderRadius.full },
  statusNormal: { backgroundColor: "rgba(76,175,80,0.12)" },
  statusExpired: { backgroundColor: "rgba(255,82,82,0.12)" },
  statusBadgeText: { ...typography.metadata, fontSize: 10, fontWeight: "700" },
  statusNormalText: { color: colors.tertiary },
  statusExpiredText: { color: colors.error },
  emptyLotesText: {
    padding: spacing.lg,
    textAlign: "center",
    color: colors.onSurfaceVariant,
    fontSize: 12,
  },
});
