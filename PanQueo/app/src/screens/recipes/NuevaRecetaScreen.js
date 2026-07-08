import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Button, Input, Card } from '../../components/ui';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';

const INGREDIENTES_DISPONIBLES = [
  { id: '1', name: 'Harina de Trigo', unit: 'kg' },
  { id: '2', name: 'Azúcar Blanca', unit: 'kg' },
  { id: '3', name: 'Mantequilla', unit: 'kg' },
  { id: '4', name: 'Huevos', unit: 'und' },
  { id: '5', name: 'Levadura', unit: 'g' },
  { id: '6', name: 'Esencia de Vainilla', unit: 'ml' },
  { id: '7', name: 'Leche', unit: 'L' },
  { id: '8', name: 'Sal', unit: 'g' },
];

export const NuevaRecetaScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [portions, setPortions] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [showIngredientPicker, setShowIngredientPicker] = useState(false);

  const addIngredient = () => {
    if (!selectedIngredient || !quantity) return;
    setIngredients([...ingredients, { ...selectedIngredient, quantity: parseFloat(quantity) }]);
    setSelectedIngredient(null);
    setQuantity('');
    setShowIngredientPicker(false);
  };

  const removeIngredient = (id) => {
    setIngredients(ingredients.filter((i) => i.id !== id));
  };

  const handleSave = () => {
    if (!name.trim() || ingredients.length === 0) {
      Alert.alert('Campos requeridos', 'Debes agregar un nombre y al menos un ingrediente');
      return;
    }
    navigation.goBack();
    setTimeout(() => Alert.alert('Receta guardada', `"${name}" se ha creado exitosamente`), 300);
  };

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Nueva Receta</Text>
          <View style={{ width: 32 }} />
        </View>

        <Input label="Nombre de la receta" value={name} onChangeText={setName} placeholder="Ej: Pan de Mantequilla" />
        <Input label="Descripción" value={description} onChangeText={setDescription} placeholder="Opcional" multiline />

        <Text style={styles.sectionTitle}>Ingredientes</Text>
        {ingredients.map((ing) => (
          <Card key={ing.id} variant="border" style={styles.ingredientCard}>
            <View style={styles.ingredientRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ingredientName}>{ing.name}</Text>
                <Text style={styles.ingredientQty}>{ing.quantity} {ing.unit}</Text>
              </View>
              <TouchableOpacity onPress={() => removeIngredient(ing.id)}>
                <Text style={styles.removeIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}

        {showIngredientPicker ? (
          <Card variant="border" style={styles.pickerCard}>
            <Text style={styles.pickerLabel}>Selecciona un ingrediente</Text>
            <ScrollView style={styles.pickerList} nestedScrollEnabled>
              {INGREDIENTES_DISPONIBLES.filter((i) => !ingredients.find((x) => x.id === i.id)).map((ing) => (
                <TouchableOpacity
                  key={ing.id}
                  style={[styles.pickerItem, selectedIngredient?.id === ing.id && styles.pickerItemSelected]}
                  onPress={() => setSelectedIngredient(ing)}
                >
                  <Text style={[styles.pickerItemText, selectedIngredient?.id === ing.id && styles.pickerItemTextSelected]}>{ing.name}</Text>
                  <Text style={styles.pickerItemUnit}>{ing.unit}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {selectedIngredient && (
              <View style={styles.qtyRow}>
                <Input
                  label="Cantidad"
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="0"
                  keyboardType="numeric"
                  style={{ flex: 1 }}
                />
                <Button title="Agregar" variant="primary" onPress={addIngredient} style={styles.addBtn} />
              </View>
            )}
          </Card>
        ) : (
          <Button title="+ Agregar Ingrediente" variant="outline" onPress={() => setShowIngredientPicker(true)} />
        )}

        <Text style={styles.sectionTitle}>Rendimiento</Text>
        <Input label="Porciones" value={portions} onChangeText={setPortions} placeholder="Ej: 12" keyboardType="numeric" />

        <View style={styles.saveRow}>
          <Button title="Cancelar" variant="outline" onPress={() => navigation.goBack()} style={{ flex: 1 }} />
          <View style={{ width: spacing.sm }} />
          <Button title="Guardar Receta" variant="primary" onPress={handleSave} style={{ flex: 1 }} />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, gap: spacing.md, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  backIcon: { fontSize: 24, color: colors.onSurface },
  title: { ...typography.titleSm, color: colors.onSurface },
  sectionTitle: { ...typography.labelBold, color: colors.onSurfaceVariant, marginTop: spacing.sm, marginBottom: spacing.xs },
  ingredientCard: { paddingVertical: spacing.sm, paddingHorizontal: spacing.base },
  ingredientRow: { flexDirection: 'row', alignItems: 'center' },
  ingredientName: { ...typography.bodyMd, color: colors.onSurface, fontWeight: '600' },
  ingredientQty: { ...typography.metadata, color: colors.onSurfaceVariant, marginTop: 2 },
  removeIcon: { fontSize: 16, color: colors.error, padding: spacing.base },
  pickerCard: { padding: spacing.md, maxHeight: 300 },
  pickerLabel: { ...typography.labelBold, color: colors.onSurfaceVariant, marginBottom: spacing.base },
  pickerList: { maxHeight: 160 },
  pickerItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.base, paddingHorizontal: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant },
  pickerItemSelected: { backgroundColor: colors.primaryContainer, borderRadius: borderRadius.md },
  pickerItemText: { ...typography.bodyMd, color: colors.onSurface },
  pickerItemTextSelected: { color: colors.onPrimaryContainer, fontWeight: '600' },
  pickerItemUnit: { ...typography.metadata, color: colors.onSurfaceVariant },
  qtyRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.base, marginTop: spacing.sm },
  addBtn: { height: 52 },
  saveRow: { flexDirection: 'row', marginTop: spacing.md },
});
