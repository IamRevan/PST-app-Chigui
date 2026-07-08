import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Button, Input, Card, ErrorMessage } from '../../components/ui';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';

const PRODUCTOS = Array.from({ length: 20 }, (_, i) => ({
  id_receta: i + 1,
  nombre_receta: [
    'Pan de Molde', 'Pan Frances', 'Pan Integral', 'Pan de Ajo', 'Pan de Yema',
    'Pan de Campo', 'Pan de Centeno', 'Pan de Maíz', 'Pan de Hamburguesa',
    'Pan de Perro Caliente', 'Pan de Caja', 'Pan de Masa Madre', 'Pan Dulce',
    'Pan de Pasas', 'Pan de Canela', 'Pan de Chocolate', 'Pan de Vainilla',
    'Pan de Queso', 'Pan de Jamón', 'Pan de Mantequilla',
  ][i],
  precio_sugerido: (Math.random() * 10 + 1).toFixed(2),
  rendimiento: `${Math.floor(Math.random() * 20 + 10)} unidades`,
}));

export const NuevoPedidoScreen = ({ navigation, route }) => {
  const [recetas] = useState(PRODUCTOS);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [clienteId, setClienteId] = useState(route?.params?.clienteId || '');
  const [clienteNombre] = useState(route?.params?.clienteNombre || '');
  const [delivery, setDelivery] = useState(false);
  const [direccion, setDireccion] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

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
          : p
      )
    );
  };

  const total = selected.reduce((sum, p) => sum + (parseFloat(p.precio_sugerido || 0) * p.cantidad), 0);
  const filtered = recetas.filter((r) =>
    r.nombre_receta.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = () => {
    if (!clienteId) {
      setError('Selecciona o ingresa un cliente');
      return;
    }
    if (selected.length === 0) {
      setError('Selecciona al menos un producto');
      return;
    }
    setSaving(true);
    setError(null);
    setTimeout(() => {
      navigation.navigate('PedidoExitoso');
    }, 800);
  };

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Nuevo Pedido</Text>

        <ErrorMessage message={error} />

        <Input placeholder="Buscar recetas..." value={search} onChangeText={setSearch} />

        {filtered.map((receta) => {
          const isSelected = selected.find((p) => p.id_receta === receta.id_receta);
          return (
            <TouchableOpacity
              key={receta.id_receta}
              style={[styles.productCard, isSelected && styles.productCardSelected]}
              onPress={() => toggleProduct(receta)}
              activeOpacity={0.7}
            >
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{receta.nombre_receta}</Text>
                <Text style={styles.productMeta}>{receta.rendimiento || ''}</Text>
                <Text style={styles.productPrice}>
                  ${parseFloat(receta.precio_sugerido || 0).toFixed(2)}
                </Text>
              </View>
              {isSelected && (
                <View style={styles.stepper}>
                  <TouchableOpacity style={styles.stepperBtn} onPress={() => updateCantidad(receta.id_receta, -1)}>
                    <Text style={styles.stepperBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepperValue}>{isSelected.cantidad}</Text>
                  <TouchableOpacity style={styles.stepperBtn} onPress={() => updateCantidad(receta.id_receta, 1)}>
                    <Text style={styles.stepperBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {selected.length > 0 && (
          <Card style={styles.resumen}>
            <Text style={styles.resumenTitle}>Resumen del Pedido</Text>
            {selected.map((p) => (
              <View key={p.id_receta} style={styles.resumenRow}>
                <Text style={styles.resumenName}>{p.nombre_receta} x{p.cantidad}</Text>
                <Text style={styles.resumenPrice}>${(parseFloat(p.precio_sugerido || 0) * p.cantidad).toFixed(2)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalText}>Total</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
            <Input label="ID del Cliente" value={clienteId} onChangeText={setClienteId} placeholder="ID numérico del cliente" keyboardType="numeric" />
            <Input label="Fecha de entrega" value={fechaEntrega} onChangeText={setFechaEntrega} placeholder="YYYY-MM-DD" />
            <TouchableOpacity style={styles.deliveryRow} onPress={() => setDelivery(!delivery)}>
              <View style={[styles.checkbox, delivery && styles.checkboxActive]}>
                {delivery && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.deliveryLabel}>Es delivery</Text>
            </TouchableOpacity>
            {delivery && (
              <Input label="Dirección de entrega" value={direccion} onChangeText={setDireccion} placeholder="Av. Principal, Casa #123" />
            )}
            <Button title={saving ? 'Creando...' : 'Confirmar Pedido'} onPress={handleSubmit} disabled={saving} style={styles.confirmBtn} />
          </Card>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 40 },
  title: { ...typography.headlineMd, color: colors.onSurface, marginBottom: spacing.md },
  productCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  productPrice: { ...typography.valueDisplay, color: colors.primary, fontSize: 16 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: { fontSize: 18, fontWeight: '600', color: colors.onSurface },
  stepperValue: { ...typography.titleSm, minWidth: 20, textAlign: 'center' },
  resumen: { marginTop: spacing.lg, gap: spacing.sm },
  resumenTitle: { ...typography.titleSm, color: colors.onSurface },
  resumenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  resumenName: { ...typography.bodyMd, color: colors.onSurface },
  resumenPrice: { ...typography.bodyMd, fontWeight: '600', color: colors.onSurface },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
  },
  totalText: { ...typography.titleSm, color: colors.onSurface },
  totalValue: { ...typography.titleSm, color: colors.primary },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer },
  checkmark: { fontSize: 12, color: colors.onPrimaryContainer, fontWeight: '700' },
  deliveryLabel: { ...typography.bodyMd, color: colors.onSurface },
  confirmBtn: { marginTop: spacing.sm },
});
