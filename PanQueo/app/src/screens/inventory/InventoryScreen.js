import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
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
import { RegistrarLoteModal } from "./RegistrarLoteModal";
import {
  useInventario,
  useAlertasVencimiento,
} from "../../lib/hooks/useInventario";

export const InventoryScreen = ({ navigation }) => {
  const [search, setSearch] = useState("");
  const [showLoteModal, setShowLoteModal] = useState(false);
  const [selectedIngrediente, setSelectedIngrediente] = useState("");

  const { data: rawIngredientes, loading } = useInventario();
  const ingredientes = Array.isArray(rawIngredientes) ? rawIngredientes : (rawIngredientes?.ingredientes || []);
  const { data: alertas } = useAlertasVencimiento();

  const stockBajoCount = alertas?.length || 0;
  const criticalItem = alertas && alertas.length > 0 ? alertas[0] : null;

  const filtered = ingredientes.filter((i) =>
    (i.nombre_ing || "").toLowerCase().includes(search.toLowerCase()),
  );

  const getStockStatus = (ing) => {
    const stockActual = parseFloat(ing.stock_actual ?? 0);
    const stockMinimo = parseFloat(ing.stock_minimo ?? 0);
    if (stockActual <= stockMinimo) {
      return { label: "Bajo", variant: "critical", color: colors.error };
    }
    return { label: "En Stock", variant: "success", color: colors.tertiary };
  };

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Inventario de Materias Primas</Text>
          <Text style={styles.subtitle}>Stock disponible y control de lotes</Text>
        </View>

        {/* Buscador de insumos */}
        <View style={styles.inputRow}>
          <MaterialIcons name="search" size={20} color={colors.outline} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar ingredientes..."
            placeholderTextColor={colors.outline}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <MaterialIcons name="close" size={18} color={colors.outline} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Alerta de Stock Crítico */}
        {criticalItem && (
          <View style={styles.alertBanner}>
            <View style={styles.alertIcon}>
              <MaterialIcons name="warning-amber" size={22} color={colors.error} />
            </View>
            <View style={styles.alertText}>
              <Text style={styles.alertTitle}>Stock Crítico</Text>
              <Text style={styles.alertDesc}>
                {criticalItem.nombre_ing || "Ingrediente"}: Stock por debajo del mínimo
              </Text>
            </View>
            <TouchableOpacity
              style={styles.alertBtn}
              onPress={() => {
                setSelectedIngrediente(criticalItem?.id_ingrediente);
                setShowLoteModal(true);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.alertBtnText}>Reponer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Resumen de Insumos y Alertas */}
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <MaterialIcons name="kitchen" size={20} color={colors.primary} />
            <Text style={styles.summaryLabel}>Total Insumos</Text>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>
              {ingredientes?.length || 0}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <MaterialIcons name="notification-important" size={20} color={colors.error} />
            <Text style={styles.summaryLabel}>Alertas de Stock</Text>
            <Text style={[styles.summaryValue, { color: colors.error }]}>
              {stockBajoCount}
            </Text>
          </View>
        </View>

        {/* Enlaces a Módulos Complementarios */}
        <View style={styles.linksRow}>
          <TouchableOpacity
            style={styles.moduleLink}
            onPress={() => navigation.navigate("AlertasVencimiento")}
            activeOpacity={0.7}
          >
            <View style={styles.linkLeft}>
              <MaterialIcons name="alarm" size={20} color={colors.primary} />
              <Text style={styles.linkLabel}>Alertas de Vencimiento</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.moduleLink}
            onPress={() => navigation.navigate("ListaCompras")}
            activeOpacity={0.7}
          >
            <View style={styles.linkLeft}>
              <MaterialIcons name="shopping-cart" size={20} color={colors.primary} />
              <Text style={styles.linkLabel}>Lista de Compras (RF-02)</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.outline} />
          </TouchableOpacity>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Catálogo de Insumos</Text>
        </View>

        {loading && (
          <Text style={styles.loadingText}>Cargando inventario...</Text>
        )}

        {!loading &&
          filtered.map((ing) => {
            const status = getStockStatus(ing);
            const stockActual = parseFloat(ing.stock_actual ?? 0);
            const stockMinimo = parseFloat(ing.stock_minimo ?? 0);
            const porcentaje = stockMinimo > 0
              ? Math.min(100, Math.round((stockActual / (stockMinimo * 2)) * 100))
              : 100;

            return (
              <TouchableOpacity
                key={ing.id_ingrediente}
                style={[
                  styles.itemCard,
                  status.label === "Bajo" && styles.itemCardCritical,
                ]}
                activeOpacity={0.75}
                onPress={() =>
                  navigation.navigate("DetalleProducto", {
                    ingredienteId: ing.id_ingrediente,
                  })
                }
              >
                {status.label === "Bajo" && <View style={styles.criticalBar} />}
                <View style={styles.itemTop}>
                  <View style={styles.itemInfo}>
                    <View style={styles.itemIcon}>
                      <MaterialIcons name="inventory-2" size={22} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{ing.nombre_ing}</Text>
                      <Text style={styles.itemUnit}>
                        Unidad: {ing.unidad_medida} · Mínimo: {stockMinimo}
                      </Text>
                    </View>
                  </View>
                  <Badge label={status.label} variant={status.variant} />
                </View>

                <View style={styles.stockRow}>
                  <Text style={styles.stockLabel}>Stock actual disponible</Text>
                  <Text
                    style={[
                      styles.stockValue,
                      { color: status.label === "Bajo" ? colors.error : colors.onSurface },
                    ]}
                  >
                    {stockActual} {ing.unidad_medida}
                  </Text>
                </View>

                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        backgroundColor: status.color,
                        width: `${porcentaje}%`,
                      },
                    ]}
                  />
                </View>

                <View style={styles.itemActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => {
                      setSelectedIngrediente(ing.id_ingrediente);
                      setShowLoteModal(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="add" size={16} color={colors.onSurface} />
                    <Text style={styles.actionBtnText}>Lote</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnPrimary]}
                    onPress={() => {
                      setSelectedIngrediente(ing.id_ingrediente);
                      setShowLoteModal(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="refresh" size={16} color={colors.onPrimaryContainer} />
                    <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>
                      Restock
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setSelectedIngrediente("");
          setShowLoteModal(true);
        }}
        activeOpacity={0.8}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialIcons name="add" size={28} color={colors.white} />
      </TouchableOpacity>

      <RegistrarLoteModal
        visible={showLoteModal}
        onClose={() => setShowLoteModal(false)}
        initialIngredienteId={selectedIngrediente}
        ingredientes={ingredientes}
        onSuccess={() => navigation.navigate("LoteExitoso")}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 100, gap: spacing.sm },
  header: { marginBottom: spacing.xs },
  title: { ...typography.headlineMd, fontSize: 20, color: colors.onSurface },
  subtitle: { ...typography.metadata, color: colors.onSurfaceVariant, marginTop: -2 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.onSurface },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,82,82,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,82,82,0.3)",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  alertIcon: { justifyContent: "center", alignItems: "center" },
  alertText: { flex: 1, gap: 2 },
  alertTitle: { ...typography.labelBold, color: colors.error, fontSize: 13 },
  alertDesc: { ...typography.metadata, color: colors.onSurfaceVariant, fontSize: 11 },
  alertBtn: {
    backgroundColor: colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
  },
  alertBtnText: { ...typography.buttonText, color: colors.white, fontSize: 12 },
  summaryGrid: { flexDirection: "row", gap: spacing.sm },
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
  summaryLabel: { ...typography.labelCaption, color: colors.onSurfaceVariant, fontSize: 11 },
  summaryValue: { ...typography.headlineMd, fontSize: 20 },
  linksRow: { gap: spacing.xs },
  moduleLink: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLow,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  linkLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  linkLabel: { ...typography.labelBold, color: colors.onSurface, fontSize: 13 },
  listHeader: { marginTop: spacing.xs },
  listTitle: { ...typography.labelBold, color: colors.primary, fontSize: 12, textTransform: "uppercase" },
  loadingText: { textAlign: "center", padding: spacing.xl, color: colors.onSurfaceVariant },
  itemCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    gap: 8,
    ...shadows.sm,
    position: "relative",
    overflow: "hidden",
  },
  itemCardCritical: { borderColor: "rgba(255,82,82,0.3)" },
  criticalBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.error,
  },
  itemTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemInfo: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainerLow,
    justifyContent: "center",
    alignItems: "center",
  },
  itemName: { ...typography.bodySm, fontWeight: "700", color: colors.onSurface },
  itemUnit: { ...typography.metadata, color: colors.onSurfaceVariant, fontSize: 11 },
  stockRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  stockLabel: { ...typography.metadata, color: colors.onSurfaceVariant, fontSize: 12 },
  stockValue: { ...typography.labelBold, fontSize: 13 },
  barBg: {
    height: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerHigh,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: borderRadius.full },
  itemActions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.xs, paddingTop: 4 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  actionBtnPrimary: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primaryContainer,
  },
  actionBtnText: { ...typography.labelCaption, color: colors.onSurface, fontWeight: "600" },
  actionBtnTextPrimary: { color: colors.onPrimaryContainer, fontWeight: "700" },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.lg,
  },
});
