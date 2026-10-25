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
import { Button, Input, Card } from "../../components/ui";
import {
  colors,
  typography,
  spacing,
  borderRadius,
} from "../../lib/theme";
import { useInventario } from "../../lib/hooks/useInventario";
import apiClient from "../../lib/api/client";
import { ENDPOINTS } from "../../lib/api/endpoints";

export const NuevaRecetaScreen = ({ navigation }) => {
  const { data: ingredientesDisponibles, loading } = useInventario();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [portions, setPortions] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [showIngredientPicker, setShowIngredientPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const addIngredient = () => {
    if (!selectedIngredient || !quantity) return;
    setIngredients([
      ...ingredients,
      { ...selectedIngredient, quantity: parseFloat(quantity) },
    ]);
    setSelectedIngredient(null);
    setQuantity("");
    setShowIngredientPicker(false);
  };

  const removeIngredient = (id) => {
    setIngredients(ingredients.filter((i) => i.id_ingrediente !== id));
  };

  const handleSave = async () => {
    if (!name.trim() || ingredients.length === 0) {
      Alert.alert(
        "Campos requeridos",
        "Debes agregar un nombre y al menos un ingrediente",
      );
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombre_receta: name.trim(),
        instrucciones: description.trim(),
        rendimiento: portions || "1",
        ingredientes: ingredients.map((i) => ({
          id_ingrediente: i.id_ingrediente,
          cantidad_requerida: i.quantity,
        })),
      };

      await apiClient.post(ENDPOINTS.RECETAS, payload);
      Alert.alert("Receta guardada", `"${name}" se ha creado exitosamente`, [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert("Error", err.message || "Hubo un error al guardar la receta");
    } finally {
      setSaving(false);
    }
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
          <Text style={styles.title}>Nueva Receta</Text>
          <View style={{ width: 44 }} />
        </View>

        <Input
          label="Nombre de la receta"
          value={name}
          onChangeText={setName}
          placeholder="Ej: Pan de Jamón Tradicional"
        />
        <Input
          label="Descripción / Procedimiento"
          value={description}
          onChangeText={setDescription}
          placeholder="Opcional: notas de horneado o preparación"
          multiline
        />

        <Text style={styles.sectionTitle}>Ingredientes Requeridos</Text>
        {ingredients.map((ing) => (
          <Card
            key={ing.id_ingrediente}
            variant="border"
            style={styles.ingredientCard}
          >
            <View style={styles.ingredientRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ingredientName}>{ing.nombre_ing}</Text>
                <Text style={styles.ingredientQty}>
                  {ing.quantity} {ing.unidad_medida}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => removeIngredient(ing.id_ingrediente)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="close" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          </Card>
        ))}

        {showIngredientPicker ? (
          <Card variant="border" style={styles.pickerCard}>
            <Text style={styles.pickerLabel}>Selecciona un ingrediente</Text>
            {loading ? (
              <Text style={{ color: colors.onSurfaceVariant, padding: spacing.sm }}>Cargando ingredientes...</Text>
            ) : (
              <ScrollView style={styles.pickerList} nestedScrollEnabled>
                {ingredientesDisponibles
                  ?.filter(
                    (i) =>
                      !ingredients.find(
                        (x) => x.id_ingrediente === i.id_ingrediente,
                      ),
                  )
                  .map((ing) => (
                    <TouchableOpacity
                      key={ing.id_ingrediente}
                      style={[
                        styles.pickerItem,
                        selectedIngredient?.id_ingrediente ===
                          ing.id_ingrediente && styles.pickerItemSelected,
                      ]}
                      onPress={() => setSelectedIngredient(ing)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedIngredient?.id_ingrediente ===
                            ing.id_ingrediente && styles.pickerItemTextSelected,
                        ]}
                      >
                        {ing.nombre_ing}
                      </Text>
                      <Text style={styles.pickerItemUnit}>
                        {ing.unidad_medida}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </ScrollView>
            )}
            {selectedIngredient && (
              <View style={styles.qtyRow}>
                <Input
                  label={`Cantidad en ${selectedIngredient.unidad_medida}`}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="0.0"
                  keyboardType="decimal-pad"
                  style={{ flex: 1 }}
                />
                <Button
                  title="Añadir"
                  variant="primary"
                  onPress={addIngredient}
                  style={styles.addBtn}
                />
              </View>
            )}
          </Card>
        ) : (
          <Button
            title="+ Agregar Ingrediente"
            variant="outline"
            onPress={() => setShowIngredientPicker(true)}
          />
        )}

        <Text style={styles.sectionTitle}>Rendimiento Base</Text>
        <Input
          label="Porciones estimadas por tanda"
          value={portions}
          onChangeText={setPortions}
          placeholder="Ej: 12"
          keyboardType="numeric"
        />

        <View style={styles.saveRow}>
          <Button
            title="Cancelar"
            variant="outline"
            onPress={() => navigation.goBack()}
            disabled={saving}
            style={{ flex: 1 }}
          />
          <View style={{ width: spacing.sm }} />
          <Button
            title={saving ? "Guardando..." : "Guardar Receta"}
            variant="primary"
            onPress={handleSave}
            disabled={saving}
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 40 },
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
  title: { ...typography.titleSm, color: colors.onSurface },
  sectionTitle: {
    ...typography.labelBold,
    color: colors.onSurfaceVariant,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  ingredientCard: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  ingredientRow: { flexDirection: "row", alignItems: "center" },
  ingredientName: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: "600",
  },
  ingredientQty: {
    ...typography.metadata,
    color: colors.onSurfaceVariant,
    marginTop: 2,
  },
  pickerCard: { padding: spacing.md, maxHeight: 320 },
  pickerLabel: {
    ...typography.labelBold,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.base,
  },
  pickerList: { maxHeight: 160 },
  pickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.outlineVariant,
  },
  pickerItemSelected: {
    backgroundColor: colors.primaryContainer,
    borderRadius: borderRadius.md,
  },
  pickerItemText: { ...typography.bodyMd, color: colors.onSurface },
  pickerItemTextSelected: {
    color: colors.onPrimaryContainer,
    fontWeight: "600",
  },
  pickerItemUnit: { ...typography.metadata, color: colors.onSurfaceVariant },
  qtyRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.base,
    marginTop: spacing.sm,
  },
  addBtn: { height: 52 },
  saveRow: { flexDirection: "row", marginTop: spacing.md },
});
