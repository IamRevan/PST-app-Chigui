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
import { Button, Input, ErrorMessage } from "../../components/ui";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from "../../lib/theme";
import { ResumenPedidoModal } from "./ResumenPedidoModal";
import { useRecetas } from "../../lib/hooks/useRecetas";
import { useCurrency } from "../../lib/currency";

export const NuevoPedidoScreen = ({ navigation, route }) => {
  const { data: rawRecetas, loading } = useRecetas();
  const { format } = useCurrency();
  const recetas = Array.isArray(rawRecetas) ? rawRecetas : (rawRecetas?.recetas || []);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState(null);
  const [showResumen, setShowResumen] = useState(false);

  const clienteId = route?.params?.clienteId || "";

  const toggleProduct = (receta) => {
    setSelected((prev) => {
      const exists = prev.find((p) => p.id_receta === receta.id_receta);
      if (exists) {
        return prev.filter((p) => p.id_receta !== receta.id_receta);
      }
      const precioBase = parseFloat(receta.precio_sugerido || 0);
      return [
        ...prev,
        {
          ...receta,
          cantidad: 1,
          precio_unitario: precioBase,
          id_receta: receta.id_receta,
        },
      ];
    });
  };

  const updateCantidad = (id, delta) => {
    setSelected((prev) =>
      prev.map((p) =>
        p.id_receta === id
          ? { ...p, cantidad: Math.max(1, p.cantidad + delta) }
          : p,
      ),
    );
  };

  const updatePrecio = (id, precioTexto) => {
    const val = parseFloat(precioTexto);
    setSelected((prev) =>
      prev.map((p) =>
        p.id_receta === id
          ? { ...p, precio_unitario: Number.isFinite(val) ? val : 0 }
          : p,
      ),
    );
  };

  const total = selected.reduce(
    (sum, p) =>
      sum + (parseFloat(p.precio_unitario != null ? p.precio_unitario : p.precio_sugerido) || 0) * p.cantidad,
    0,
  );

  const filtered = recetas.filter((r) =>
    (r.nombre_receta || "").toLowerCase().includes(search.toLowerCase()),
  );

  const handleContinuar = () => {
    if (selected.length === 0) {
      setError("Selecciona al menos una receta para el pedido.");
      return;
    }
    setError(null);
    setShowResumen(true);
  };

  const handleSuccess = () => {
    setShowResumen(false);
    navigation.navigate("PedidoExitoso");
  };

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
            <Text style={styles.title}>Nuevo Pedido</Text>
            <Text style={styles.subtitle}>Selección multi-receta con validación FIFO</Text>
          </View>
        </View>

        <ErrorMessage message={error} />

        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color={colors.outline} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar recetas en catálogo..."
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

        {loading && (
          <Text style={styles.loadingText}>Cargando catálogo de recetas...</Text>
        )}

        {!loading &&
          filtered.map((receta) => {
            const isSelected = selected.find(
              (p) => p.id_receta === receta.id_receta,
            );
            const numIngs =
              receta.RecetaIngredientes?.length || receta.Ingredientes?.length || 0;
            return (
              <View
                key={receta.id_receta}
                style={[
                  styles.productCard,
                  isSelected && styles.productCardSelected,
                ]}
              >
                <TouchableOpacity
                  style={styles.productLeft}
                  onPress={() => toggleProduct(receta)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.productIcon, isSelected && styles.productIconSelected]}>
                    <MaterialIcons
                      name="cake"
                      size={24}
                      color={isSelected ? colors.primary : colors.outline}
                    />
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{receta.nombre_receta}</Text>
                    <View style={styles.metaBadgeRow}>
                      <Text style={styles.metaBadge}>
                        {numIngs === 0 ? "⚠️ sin ingredientes" : `${numIngs} ingred.`}
                      </Text>
                      <Text style={styles.metaBadge}>{receta.rendimiento || "1 porción"}</Text>
                    </View>
                    <Text style={styles.productPrice}>
                      {format(receta.precio_sugerido || 0)}
                    </Text>
                  </View>
                </TouchableOpacity>

                {isSelected ? (
                  <View style={styles.productControls}>
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => updateCantidad(receta.id_receta, -1)}
                      >
                        <MaterialIcons name="remove" size={16} color={colors.onSurface} />
                      </TouchableOpacity>
                      <Text style={styles.stepperValue}>{isSelected.cantidad}</Text>
                      <TouchableOpacity
                        style={[styles.stepperBtn, styles.stepperBtnPlus]}
                        onPress={() => updateCantidad(receta.id_receta, 1)}
                      >
                        <MaterialIcons name="add" size={16} color={colors.onPrimaryContainer} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>P. Unit ($):</Text>
                      <TextInput
                        style={styles.priceInput}
                        keyboardType="numeric"
                        defaultValue={String(isSelected.precio_unitario || receta.precio_sugerido || "")}
                        onChangeText={(txt) => updatePrecio(receta.id_receta, txt)}
                        placeholder="0.00"
                        placeholderTextColor={colors.outline}
                      />
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => toggleProduct(receta)}
                  >
                    <MaterialIcons name="add" size={20} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            );
          })}

        {selected.length > 0 && (
          <View style={styles.footerSticky}>
            <View style={styles.footerTotalBox}>
              <Text style={styles.footerTotalLabel}>Total estimado:</Text>
              <Text style={styles.footerTotalVal}>{format(total)}</Text>
            </View>
            <Button
              title={`Continuar (${selected.length} recetas)`}
              onPress={handleContinuar}
              variant="primary"
              style={styles.continuarBtn}
            />
          </View>
        )}
      </ScrollView>

      <ResumenPedidoModal
        visible={showResumen}
        onClose={() => setShowResumen(false)}
        onSuccess={handleSuccess}
        selected={selected}
        total={total}
        initialClienteId={clienteId}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 100, gap: spacing.sm },
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
  title: { ...typography.headlineMd, color: colors.onSurface, fontSize: 20 },
  subtitle: { ...typography.metadata, color: colors.onSurfaceVariant, fontSize: 12 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.onSurface },
  loadingText: { textAlign: "center", padding: spacing.xl, color: colors.onSurfaceVariant },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    gap: spacing.sm,
  },
  productCardSelected: {
    borderColor: colors.primaryContainer,
    backgroundColor: `${colors.primaryContainer}12`,
  },
  productLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 },
  productIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainerLow,
    justifyContent: "center",
    alignItems: "center",
  },
  productIconSelected: { backgroundColor: `${colors.primaryContainer}40` },
  productInfo: { flex: 1, gap: 2 },
  productName: { ...typography.bodySm, fontWeight: "700", color: colors.onSurface },
  metaBadgeRow: { flexDirection: "row", gap: 4 },
  metaBadge: {
    ...typography.metadata,
    fontSize: 10,
    color: colors.onSurfaceVariant,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
  },
  productPrice: { ...typography.labelBold, color: colors.primary, fontSize: 13, marginTop: 2 },
  productControls: { alignItems: "flex-end", gap: 6 },
  stepper: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepperBtn: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainerHighest,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnPlus: { backgroundColor: colors.primaryContainer },
  stepperValue: { ...typography.labelBold, minWidth: 20, textAlign: "center", fontSize: 14 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  priceLabel: { ...typography.metadata, fontSize: 11, color: colors.onSurfaceVariant },
  priceInput: {
    width: 60,
    height: 28,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 4,
    fontSize: 12,
    textAlign: "right",
    color: colors.onSurface,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  footerSticky: {
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.md,
    borderRadius: borderRadius.xl,
    ...shadows.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryContainer,
  },
  footerTotalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  footerTotalLabel: { ...typography.labelBold, color: colors.onSurfaceVariant, fontSize: 13 },
  footerTotalVal: { ...typography.headlineMd, color: colors.primary, fontSize: 18 },
  continuarBtn: { width: "100%" },
});
