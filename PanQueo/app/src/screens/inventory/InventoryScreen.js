import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
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

  const { data: ingredientes, loading } = useInventario();
  const { data: alertas } = useAlertasVencimiento();

  const stockBajoCount = alertas?.length || 0;
  const criticalItem = alertas && alertas.length > 0 ? alertas[0] : null;

  const filtered = ingredientes.filter((i) =>
    i.nombre_ing.toLowerCase().includes(search.toLowerCase()),
  );

  const getStockStatus = (ing) => {
    return parseFloat(ing.stock_minimo) > 0
      ? { label: "Bajo", variant: "critical", color: colors.error }
      : { label: "En Stock", variant: "success", color: colors.tertiary };
  };

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.inputRow}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar ingredientes..."
            placeholderTextColor={colors.onSurfaceVariant}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {criticalItem && (
          <View style={styles.alertBanner}>
            <View style={styles.alertIcon}>
              <Text style={styles.alertIconText}>⚠️</Text>
            </View>
            <View style={styles.alertText}>
              <Text style={styles.alertTitle}>Stock Crítico</Text>
              <Text style={styles.alertDesc}>
                {criticalItem.nombre_ing || "Ingrediente"}: Stock por debajo del
                mínimo
              </Text>
            </View>
            <TouchableOpacity
              style={styles.alertBtn}
              onPress={() => {
                setSelectedIngrediente(criticalItem?.id_ingrediente);
                setShowLoteModal(true);
              }}
            >
              <Text style={styles.alertBtnText}>Reponer</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Insumos</Text>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>
              {ingredientes?.length || 0}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Alertas</Text>
            <Text style={[styles.summaryValue, { color: colors.error }]}>
              {stockBajoCount}
            </Text>
          </View>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Lista de Insumos</Text>
        </View>

        {loading && (
          <Text style={{ textAlign: "center", padding: 20 }}>
            Cargando inventario...
          </Text>
        )}

        <TouchableOpacity
          style={styles.alertasLink}
          onPress={() => navigation.navigate("AlertasVencimiento")}
        >
          <Text style={styles.alertasIcon}>⏰</Text>
          <Text style={styles.alertasLabel}>Alertas de Vencimiento</Text>
          <Text style={styles.alertasArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.comprasLink}
          onPress={() => navigation.navigate("ListaCompras")}
        >
          <Text style={styles.comprasIcon}>🛒</Text>
          <Text style={styles.comprasLabel}>Lista de Compras</Text>
          <Text style={styles.comprasArrow}>→</Text>
        </TouchableOpacity>

        {!loading &&
          filtered.map((ing) => {
            const status = getStockStatus(ing);
            return (
              <TouchableOpacity
                key={ing.id_ingrediente}
                style={[
                  styles.itemCard,
                  status.label === "Bajo" && styles.itemCardCritical,
                ]}
                activeOpacity={0.7}
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
                      <Text style={styles.itemIconText}>🥫</Text>
                    </View>
                    <View>
                      <Text style={styles.itemName}>{ing.nombre_ing}</Text>
                      <Text style={styles.itemUnit}>
                        Unidad: {ing.unidad_medida}
                      </Text>
                    </View>
                  </View>
                  <Badge label={status.label} variant={status.variant} />
                </View>
                <View style={styles.itemActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => {
                      setSelectedIngrediente(ing.id_ingrediente);
                      setShowLoteModal(true);
                    }}
                  >
                    <Text style={styles.actionBtnText}>+ Lote</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.actionBtnPrimary]}
                    onPress={() => {
                      setSelectedIngrediente(ing.id_ingrediente);
                      setShowLoteModal(true);
                    }}
                  >
                    <Text
                      style={[
                        styles.actionBtnText,
                        styles.actionBtnTextPrimary,
                      ]}
                    >
                      Restock
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}

        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            // Se asume el primer ingrediente por defecto si no hay ninguno seleccionado (para evitar crash en el modal)
            setSelectedIngrediente(ingredientes?.[0]?.id_ingrediente || "");
            setShowLoteModal(true);
          }}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </ScrollView>
      <RegistrarLoteModal
        visible={showLoteModal}
        onClose={() => setShowLoteModal(false)}
        initialIngredienteId={selectedIngrediente}
        onSuccess={() => navigation.navigate("LoteExitoso")}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 100 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
    gap: spacing.sm,
  },
  searchIcon: { fontSize: 20 },
  searchInput: {
    ...typography.bodyMd,
    color: colors.onSurface,
    flex: 1,
    paddingVertical: 0,
  },
  alertBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.errorContainer,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  alertIcon: {
    backgroundColor: colors.error,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  alertIconText: { fontSize: 18 },
  alertText: { flex: 1 },
  alertTitle: { ...typography.labelBold, color: colors.onErrorContainer },
  alertDesc: { ...typography.bodySm, color: colors.onErrorContainer },
  alertBtn: {
    backgroundColor: colors.onErrorContainer,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.base,
    borderRadius: borderRadius.md,
  },
  alertBtnText: { ...typography.labelBold, color: colors.white, fontSize: 13 },
  summaryGrid: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: `${colors.outlineVariant}4D`,
  },
  summaryLabel: { ...typography.bodySm, color: colors.onSurfaceVariant },
  summaryValue: { ...typography.headlineMd },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  listTitle: { ...typography.titleSm, color: colors.onSurface },
  filterIcon: { fontSize: 20, color: colors.onSurfaceVariant },
  alertasLink: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.errorContainer,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  alertasIcon: { fontSize: 20 },
  alertasLabel: {
    ...typography.labelBold,
    color: colors.onErrorContainer,
    flex: 1,
  },
  alertasArrow: { fontSize: 18, color: colors.onErrorContainer },
  comprasLink: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryContainer,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  comprasIcon: { fontSize: 20 },
  comprasLabel: {
    ...typography.labelBold,
    color: colors.onPrimaryContainer,
    flex: 1,
  },
  comprasArrow: { fontSize: 18, color: colors.onPrimaryContainer },
  itemCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: `${colors.outlineVariant}33`,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  itemCardCritical: {
    borderColor: `${colors.error}33`,
    position: "relative",
    overflow: "hidden",
  },
  criticalBar: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 4,
    height: "100%",
    backgroundColor: colors.error,
  },
  itemTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  itemInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.secondaryContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  itemIconText: { fontSize: 24 },
  itemName: { ...typography.labelBold, color: colors.onSurface },
  itemUnit: { ...typography.bodySm, color: colors.onSurfaceVariant },
  stockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stockLabel: { ...typography.bodySm, color: colors.onSurfaceVariant },
  stockValue: {
    ...typography.labelBold,
    color: colors.onSurface,
    fontSize: 13,
  },
  barBg: {
    width: "100%",
    height: 8,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
  },
  itemActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.surfaceContainerHigh,
    paddingVertical: spacing.base,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  actionBtnPrimary: {
    backgroundColor: colors.primary,
  },
  actionBtnText: {
    ...typography.labelBold,
    color: colors.onSurface,
    fontSize: 13,
  },
  actionBtnTextPrimary: { color: colors.white },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
  fabText: {
    fontSize: 28,
    color: colors.onPrimaryContainer,
    fontWeight: "600",
  },
});
