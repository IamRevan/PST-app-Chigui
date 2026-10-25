import { useState, useEffect } from "react";
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
import { Button, Input } from "../../components/ui";
import { SheetModal } from "../../components/ui/Modal";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from "../../lib/theme";
import { useListasCompras } from "../../lib/hooks/useCompras";
import { useInventario } from "../../lib/hooks/useInventario";
import { useCurrency } from "../../lib/currency";
import apiClient from "../../lib/api/client";
import { ENDPOINTS } from "../../lib/api/endpoints";

export const ListaComprasScreen = ({ navigation }) => {
  const { data: listas, loading, refetch } = useListasCompras("Borrador");
  const { format } = useCurrency();
  const listaActiva = listas && listas.length > 0 ? listas[0] : null;
  // Detalle temporal en UI para interacción rápida antes de enviar al backend
  const [localItems, setLocalItems] = useState([]);

  const { data: ingredientes } = useInventario();

  const [showAdd, setShowAdd] = useState(false);
  const [selectedIng, setSelectedIng] = useState(null);
  const [newQty, setNewQty] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [saving, setSaving] = useState(false);

  // Sincronizar localItems con la DB cuando cargue
  useEffect(() => {
    if (
      !loading &&
      listaActiva &&
      localItems.length === 0 &&
      listaActiva.DetalleListaCompras
    ) {
      setLocalItems(
        listaActiva.DetalleListaCompras.map((d) => ({
          ...d,
          status:
            parseFloat(d.cantidad_comprada) > 0 ? "Comprado" : "Pendiente",
        })),
      );
    }
  }, [loading, listaActiva, localItems.length]);

  const toggleItem = (id) => {
    // Regla: items comprados no se retroceden; quien marca, registra cantidad_comprada completa
    setLocalItems((prev) =>
      prev.map((item) => {
        if (item.id_detalle_lista === id) {
          const esComprado = item.status === "Comprado";
          if (esComprado) {
            return { ...item, status: "Pendiente", cantidad_comprada: 0 };
          }
          return {
            ...item,
            status: "Comprado",
            cantidad_comprada: item.cantidad_sugerida,
          };
        }
        return item;
      }),
    );
  };

  const addItem = () => {
    if (!selectedIng || !newQty.trim()) {
      Alert.alert(
        "Campos requeridos",
        "Ingrediente y cantidad son obligatorios",
      );
      return;
    }
    const newItem = {
      id_detalle_lista: Date.now(), // ID temporal
      id_ingrediente: selectedIng.id_ingrediente,
      cantidad_sugerida: newQty,
      precio_estimado_unitario: newPrice || 0,
      status: "Pendiente",
      Ingrediente: selectedIng,
    };
    setLocalItems([...localItems, newItem]);
    setSelectedIng(null);
    setNewQty("");
    setNewPrice("");
    setShowAdd(false);
  };

  const [completing, setCompleting] = useState(false);

  /**
   * Guarda el borrador (o el checkpoint de compra) en la DB.
   * - Lista nueva: POST ListaCompra + detalles (transacción backend).
   * - Lista existente: PATCH /listas/:id con detalles reemplazables
   *   (usa cantidad_comprada para el puente RF-02 de la compra -> lotes).
   * Devuelve la lista activa actualizada (o la creada).
   */
  const guardarEnBackend = async () => {
    if (localItems.length === 0) {
      throw new Error("Agrega al menos un ítem a la lista");
    }
    const detalles = localItems.map((i) => ({
      id_ingrediente: i.id_ingrediente,
      cantidad_sugerida: i.cantidad_sugerida,
      cantidad_comprada: i.status === "Comprado"
        ? (parseFloat(i.cantidad_comprada) || parseFloat(i.cantidad_sugerida))
        : 0,
      precio_estimado_unitario: i.precio_estimado_unitario,
    }));

    if (listaActiva) {
      const res = await apiClient.patch(
        ENDPOINTS.LISTA_COMPRA_BY_ID(listaActiva.id_lista),
        { estado_lista: "Borrador", detalles },
      );
      // Refrescar localItems con lo persistido (ids reales de la BD)
      const data = res.data?.data;
      if (data?.DetalleListaCompras) {
        setLocalItems(
          data.DetalleListaCompras.map((d) => ({
            ...d,
            status: parseFloat(d.cantidad_comprada) > 0 ? "Comprado" : "Pendiente",
          })),
        );
      }
      return data;
    }

    const res = await apiClient.post(ENDPOINTS.LISTAS_COMPRAS, {
      estado_lista: "Borrador",
      detalles,
    });
    refetch();
    const data = res.data?.data;
    if (data?.DetalleListaCompras) {
      setLocalItems(
        data.DetalleListaCompras.map((d) => ({
          ...d,
          status: parseFloat(d.cantidad_comprada) > 0 ? "Comprado" : "Pendiente",
        })),
      );
    }
    return data;
  };

  const handleGuardar = async () => {
    setSaving(true);
    try {
      await guardarEnBackend();
      Alert.alert("Éxito", "Lista de compras guardada como borrador");
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo guardar la lista");
    } finally {
      setSaving(false);
    }
  };

  const handleCompletar = async () => {
    if (!listaActiva) {
      Alert.alert(
        "Error",
        "Debes guardar la lista primero antes de completarla.",
      );
      return;
    }

    const compradosCount = localItems.filter(
      (i) => i.status === "Comprado",
    ).length;
    if (compradosCount === 0) {
      Alert.alert("Aviso", "No has marcado ningún ítem como comprado.");
      return;
    }

    setCompleting(true);
    try {
      // 1. Persistir checkpoint de compra (cantidades compradas) vía PATCH
      await guardarEnBackend();
      // 2. Completar: backend genera LOTES_INGREDIENTES (RF-02) en transacción
      await apiClient.patch(
        ENDPOINTS.LISTA_COMPRA_BY_ID(listaActiva.id_lista) + "/completar",
      );
      Alert.alert(
        "Éxito",
        "Lista convertida en adquisición. Se han creado los lotes de inventario.",
        [{ text: "OK", onPress: () => navigation.navigate("Inventario") }],
      );
    } catch (err) {
      Alert.alert("Error", err.message || "No se pudo procesar la adquisición");
    } finally {
      setCompleting(false);
    }
  };

  const pendientes = localItems.filter((i) => i.status === "Pendiente").length;
  const comprados = localItems.filter((i) => i.status === "Comprado").length;
  const totalEst = localItems.reduce(
    (sum, i) =>
      sum +
      parseFloat(i.cantidad_sugerida) *
        parseFloat(i.precio_estimado_unitario || 0),
    0,
  );

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
          <Text style={styles.title}>Lista de Compras</Text>
          <TouchableOpacity
            onPress={() => setShowAdd(true)}
            style={styles.addBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialIcons name="add-circle" size={26} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Pendientes</Text>
            <Text style={styles.summaryValue}>{pendientes}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Comprados</Text>
            <Text style={[styles.summaryValue, { color: colors.tertiary }]}>{comprados}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Est.</Text>
            <Text style={[styles.summaryValue, { color: colors.secondary }]}>{format(totalEst)}</Text>
          </View>
        </View>

        {loading && (
          <Text style={{ textAlign: "center", padding: 20, color: colors.onSurfaceVariant }}>
            Cargando lista activa...
          </Text>
        )}

        <View style={styles.list}>
          {localItems.map((item) => (
            <View
              key={item.id_detalle_lista}
              style={[
                styles.itemCard,
                item.status === "Comprado" && styles.itemCardDone,
              ]}
            >
              <View style={styles.itemLeft}>
                <TouchableOpacity
                  style={[
                    styles.checkbox,
                    item.status === "Comprado" && styles.checkboxDone,
                  ]}
                  onPress={() => toggleItem(item.id_detalle_lista)}
                  activeOpacity={0.7}
                >
                  {item.status === "Comprado" && (
                    <MaterialIcons name="check" size={16} color={colors.onTertiaryContainer} />
                  )}
                </TouchableOpacity>
                <View style={styles.itemInfo}>
                  <Text
                    style={[
                      styles.itemName,
                      item.status === "Comprado" && styles.itemNameDone,
                    ]}
                  >
                    {item.Ingrediente?.nombre_ing}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {item.cantidad_sugerida} {item.Ingrediente?.unidad_medida} · {format(item.precio_estimado_unitario)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <Button
          title={saving ? "Guardando..." : "Guardar Borrador"}
          variant="outline"
          onPress={handleGuardar}
          style={{ marginBottom: spacing.sm }}
          disabled={saving || completing}
        />
        <Button
          title={
            completing
              ? "Procesando..."
              : "Finalizar Compra y Convertir a Lotes"
          }
          variant="primary"
          onPress={handleCompletar}
          disabled={saving || completing}
        />
      </ScrollView>

      <SheetModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        title="Nuevo ítem de compra"
      >
        <Text
          style={{
            ...typography.labelBold,
            color: colors.onSurfaceVariant,
            marginBottom: spacing.xs,
          }}
        >
          Ingrediente
        </Text>
        <ScrollView style={{ maxHeight: 150, marginBottom: spacing.md }}>
          {ingredientes?.map((i) => (
            <TouchableOpacity
              key={i.id_ingrediente}
              style={{
                padding: spacing.sm,
                backgroundColor:
                  selectedIng?.id_ingrediente === i.id_ingrediente
                    ? colors.primaryContainer
                    : colors.surface,
                borderRadius: borderRadius.sm,
                marginBottom: 4,
                borderBottomWidth: 1,
                borderColor: colors.surfaceVariant,
              }}
              onPress={() => setSelectedIng(i)}
            >
              <Text style={{ ...typography.bodyMd, color: colors.onSurface }}>{i.nombre_ing}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Input
          label="Cantidad"
          value={newQty}
          onChangeText={setNewQty}
          placeholder="Ej: 25"
          keyboardType="decimal-pad"
        />
        <Input
          label="Precio estimado unitario (USD)"
          value={newPrice}
          onChangeText={setNewPrice}
          placeholder="Ej: 4.50"
          keyboardType="decimal-pad"
        />
        <Button
          title="Agregar a la lista"
          variant="primary"
          onPress={addItem}
          style={{ marginTop: spacing.md }}
        />
      </SheetModal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 40, gap: spacing.md },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
    marginBottom: spacing.xs,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  addBtn: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  title: { ...typography.headlineMd, color: colors.onSurface },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.md,
    alignItems: "center",
  },
  summaryItem: { flex: 1, alignItems: "center", gap: spacing.xs },
  summaryLabel: { ...typography.bodySm, color: colors.onSurfaceVariant },
  summaryValue: { ...typography.titleSm, color: colors.primary },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.outlineVariant,
  },
  list: { gap: spacing.sm },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  itemCardDone: { opacity: 0.6 },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flex: 1,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.outline,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: {
    backgroundColor: colors.tertiaryContainer,
    borderColor: colors.tertiary,
  },
  itemInfo: { gap: 2 },
  itemName: {
    ...typography.bodyMd,
    fontWeight: "600",
    color: colors.onSurface,
  },
  itemNameDone: {
    textDecorationLine: "line-through",
    color: colors.onSurfaceVariant,
  },
  itemMeta: { ...typography.bodySm, color: colors.onSurfaceVariant },
});
