import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
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

const PRODUCTOS = Array.from({ length: 20 }, (_, i) => ({
  id_receta: i + 1,
  nombre_receta: [
    "Pan de Molde",
    "Pan Frances",
    "Pan Integral",
    "Pan de Ajo",
    "Pan de Yema",
    "Pan de Campo",
    "Pan de Centeno",
    "Pan de Maíz",
    "Pan de Hamburguesa",
    "Pan de Perro Caliente",
    "Pan de Caja",
    "Pan de Masa Madre",
    "Pan Dulce",
    "Pan de Pasas",
    "Pan de Canela",
    "Pan de Chocolate",
    "Pan de Vainilla",
    "Pan de Queso",
    "Pan de Jamón",
    "Pan de Mantequilla",
  ][i],
  precio_sugerido: (Math.random() * 10 + 1).toFixed(2),
  rendimiento: `${Math.floor(Math.random() * 20 + 10)} unidades`,
}));

export const NuevoPedidoScreen = ({ navigation, route }) => {
  const [recetas] = useState(PRODUCTOS);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState(null);
  const [showResumen, setShowResumen] = useState(false);

  const clienteId = route?.params?.clienteId || "";

  const toggleProduct = (receta) => {
    setSelected((prev) => {
      const exists = prev.find((p) => p.id_receta === receta.id_receta);
      if (exists) return prev.filter((p) => p.id_receta !== receta.id_receta);
      return [{ ...receta, cantidad: 1, id_receta: receta.id_receta }];
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

  const total = selected.reduce(
    (sum, p) => sum + parseFloat(p.precio_sugerido || 0) * p.cantidad,
    0,
  );
  const filtered = recetas.filter((r) =>
    r.nombre_receta.toLowerCase().includes(search.toLowerCase()),
  );

  const handleContinuar = () => {
    if (selected.length === 0) {
      setError("Selecciona al menos un producto");
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
        <Text style={styles.title}>Nuevo Pedido</Text>

        <ErrorMessage message={error} />

        <Input
          placeholder="Buscar recetas..."
          value={search}
          onChangeText={setSearch}
        />

        {filtered.map((receta) => {
          const isSelected = selected.find(
            (p) => p.id_receta === receta.id_receta,
          );
          return (
            <TouchableOpacity
              key={receta.id_receta}
              style={[
                styles.productCard,
                isSelected && styles.productCardSelected,
              ]}
              onPress={() => toggleProduct(receta)}
              activeOpacity={0.7}
            >
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{receta.nombre_receta}</Text>
                <Text style={styles.productMeta}>
                  {receta.rendimiento || ""}
                </Text>
                <Text style={styles.productPrice}>
                  ${parseFloat(receta.precio_sugerido || 0).toFixed(2)}
                </Text>
              </View>
              {isSelected && (
                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => updateCantidad(receta.id_receta, -1)}
                  >
                    <Text style={styles.stepperBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{isSelected.cantidad}</Text>
                  <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => updateCantidad(receta.id_receta, 1)}
                  >
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {selected.length > 0 && (
          <Button
            title={`Continuar ($${total.toFixed(2)})`}
            onPress={handleContinuar}
            style={styles.continuarBtn}
          />
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
  content: { padding: spacing.gutter, paddingBottom: 40 },
  title: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  productCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  productCardSelected: {
    borderColor: colors.primaryContainer,
    backgroundColor: `${colors.primaryContainer}15`,
  },
  productInfo: { gap: 2, flex: 1 },
  productName: { ...typography.labelBold, color: colors.onSurface },
  productMeta: { ...typography.bodySm, color: colors.onSurfaceVariant },
  productPrice: {
    ...typography.valueDisplay,
    color: colors.primary,
    fontSize: 16,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: { fontSize: 18, fontWeight: "600", color: colors.onSurface },
  stepperValue: { ...typography.titleSm, minWidth: 20, textAlign: "center" },
  continuarBtn: { marginTop: spacing.lg, marginBottom: spacing.xl },
});
