import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Button, Input } from '../../components/ui';
import { SheetModal } from '../../components/ui/Modal';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';

const INITIAL_ITEMS = [
  { id: 1, name: 'Harina de Trigo', qty: '25 kg', price: 'Bs 450', status: 'Pendiente', urgent: true },
  { id: 2, name: 'Azúcar Blanca', qty: '10 kg', price: 'Bs 180', status: 'Pendiente', urgent: false },
  { id: 3, name: 'Mantequilla', qty: '5 kg', price: 'Bs 320', status: 'Comprado', urgent: false },
  { id: 4, name: 'Huevos', qty: '30 und', price: 'Bs 90', status: 'Comprado', urgent: false },
  { id: 5, name: 'Levadura', qty: '500 g', price: 'Bs 55', status: 'Pendiente', urgent: true },
  { id: 6, name: 'Esencia de Vainilla', qty: '250 ml', price: 'Bs 120', status: 'Pendiente', urgent: false },
];

export const ListaComprasScreen = ({ navigation }) => {
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const toggleItem = (id) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: item.status === 'Comprado' ? 'Pendiente' : 'Comprado' } : item
      )
    );
  };

  const deleteItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const markAllAsComprado = () => {
    setItems((prev) => prev.map((item) => ({ ...item, status: 'Comprado' })));
  };

  const addItem = () => {
    if (!newName.trim() || !newQty.trim()) {
      Alert.alert('Campos requeridos', 'Nombre y cantidad son obligatorios');
      return;
    }
    const newId = Math.max(...items.map((i) => i.id), 0) + 1;
    setItems([...items, { id: newId, name: newName, qty: newQty, price: newPrice || '—', status: 'Pendiente', urgent: false }]);
    setNewName('');
    setNewQty('');
    setNewPrice('');
    setShowAdd(false);
  };

  const pendientes = items.filter((i) => i.status === 'Pendiente').length;
  const comprados = items.filter((i) => i.status === 'Comprado').length;

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Lista de Compras</Text>
          <TouchableOpacity onPress={() => setShowAdd(true)}>
            <Text style={styles.addIcon}>+</Text>
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
            <Text style={styles.summaryValue}>{comprados}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Est.</Text>
            <Text style={styles.summaryValue}>Bs 1.215</Text>
          </View>
        </View>

        <View style={styles.list}>
          {items.map((item) => (
            <View key={item.id} style={[styles.itemCard, item.status === 'Comprado' && styles.itemCardDone]}>
              <View style={styles.itemLeft}>
                <TouchableOpacity style={[styles.checkbox, item.status === 'Comprado' && styles.checkboxDone]} onPress={() => toggleItem(item.id)}>
                  {item.status === 'Comprado' && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, item.status === 'Comprado' && styles.itemNameDone]}>{item.name}</Text>
                  <Text style={styles.itemMeta}>{item.qty} · {item.price}</Text>
                </View>
              </View>
              <View style={styles.itemRight}>
                {item.urgent && (
                  <View style={styles.urgentBadge}>
                    <Text style={styles.urgentText}>Urgente</Text>
                  </View>
                )}
                <TouchableOpacity onPress={() => deleteItem(item.id)}>
                  <Text style={styles.itemAction}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <Button title="Marcar Todos como Comprados" variant="primary" onPress={markAllAsComprado} />
      </ScrollView>

      <SheetModal visible={showAdd} onClose={() => setShowAdd(false)} title="Nuevo ítem">
        <Input label="Producto" value={newName} onChangeText={setNewName} placeholder="Ej: Harina de Trigo" />
        <Input label="Cantidad" value={newQty} onChangeText={setNewQty} placeholder="Ej: 25 kg" />
        <Input label="Precio estimado" value={newPrice} onChangeText={setNewPrice} placeholder="Ej: Bs 450" />
        <Button title="Agregar a la lista" variant="primary" onPress={addItem} style={{ marginTop: spacing.md }} />
      </SheetModal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 40, gap: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backIcon: { fontSize: 24, color: colors.onSurface },
  title: { ...typography.headlineMd, color: colors.onSurface },
  addIcon: { fontSize: 24, color: colors.primary, fontWeight: '700' },
  summaryCard: { flexDirection: 'row', backgroundColor: colors.surfaceContainerLowest, borderRadius: borderRadius.xl, padding: spacing.md, ...shadows.md, alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center', gap: spacing.xs },
  summaryLabel: { ...typography.bodySm, color: colors.onSurfaceVariant },
  summaryValue: { ...typography.titleSm, color: colors.primary },
  summaryDivider: { width: 1, height: 40, backgroundColor: colors.outlineVariant },
  list: { gap: spacing.sm },
  itemCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surfaceContainerLowest, padding: spacing.md, borderRadius: borderRadius.lg, ...shadows.sm },
  itemCardDone: { opacity: 0.6 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.outline, alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: colors.tertiaryContainer, borderColor: colors.tertiaryContainer },
  checkmark: { fontSize: 14, color: colors.onTertiaryContainer, fontWeight: '700' },
  itemInfo: { gap: 2 },
  itemName: { ...typography.bodyMd, fontWeight: '600', color: colors.onSurface },
  itemNameDone: { textDecorationLine: 'line-through', color: colors.onSurfaceVariant },
  itemMeta: { ...typography.bodySm, color: colors.onSurfaceVariant },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  urgentBadge: { backgroundColor: colors.errorContainer, paddingHorizontal: spacing.base, paddingVertical: 2, borderRadius: 999 },
  urgentText: { fontSize: 10, fontWeight: '700', color: colors.onErrorContainer },
  itemAction: { fontSize: 16 },
});
