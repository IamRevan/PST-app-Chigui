import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Button } from '../../components/ui';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';

const CLIENTS = [
  { id_cliente: 1, nombre: 'María', apellido: 'González', telefono: '809-555-0101', cedula: '001-0000001-1', puntos_fidelidad: 150 },
  { id_cliente: 2, nombre: 'Carlos', apellido: 'Méndez', telefono: '809-555-0102', cedula: '001-0000002-2', puntos_fidelidad: 85 },
  { id_cliente: 3, nombre: 'Ana', apellido: 'Reyes', telefono: '809-555-0103', cedula: '001-0000003-3', puntos_fidelidad: 230 },
  { id_cliente: 4, nombre: 'Pedro', apellido: 'Castillo', telefono: '809-555-0104', cedula: '001-0000004-4', puntos_fidelidad: 42 },
];

export const ClientsScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');

  const filtered = CLIENTS.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(q) ||
      c.apellido.toLowerCase().includes(q) ||
      c.telefono.includes(q) ||
      c.cedula.includes(q)
    );
  });

  const getInitial = (name) => (name || '?').charAt(0).toUpperCase();

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Clientes</Text>

        <View style={styles.searchRow}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, teléfono o cédula"
            placeholderTextColor="#757575"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <Button
          title="+ Nuevo Cliente"
          variant="primary"
          onPress={() => navigation.navigate('RegistrarCliente')}
          style={styles.addBtn}
        />

        {filtered.map((c) => (
          <TouchableOpacity key={c.id_cliente} style={styles.clientCard} activeOpacity={0.7} onPress={() => navigation.navigate('HistorialCliente', { clienteId: c.id_cliente })}>
            <View style={styles.clientLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitial(c.nombre)}</Text>
              </View>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{c.nombre} {c.apellido}</Text>
                <Text style={styles.clientPhone}>📞 {c.telefono}</Text>
                <Text style={styles.clientMeta}>
                  CI: {c.cedula} · {c.puntos_fidelidad || 0} pts
                </Text>
              </View>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        ))}

        {filtered.length === 0 && (
          <Text style={styles.emptyText}>No hay clientes registrados</Text>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 40 },
  title: { ...typography.displayLgMobile, fontSize: 20, color: colors.onSurface, marginBottom: spacing.md },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: spacing.sm,
    gap: spacing.base,
    marginBottom: spacing.md,
  },
  searchIcon: { fontSize: 20, color: '#757575' },
  searchInput: { ...typography.bodySm, color: colors.onSurface, flex: 1, paddingVertical: 0 },
  addBtn: { marginBottom: spacing.lg },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.md,
    marginBottom: spacing.md,
  },
  clientLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.onPrimaryContainer,
  },
  clientInfo: { gap: 2 },
  clientName: { ...typography.bodyMd, fontWeight: '600', color: colors.onSurface },
  clientPhone: { ...typography.bodySm, color: '#757575' },
  phoneIcon: { fontSize: 14 },
  clientMeta: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
    backgroundColor: colors.pillBg,
    paddingHorizontal: spacing.base,
    paddingVertical: 2,
    borderRadius: 999,
    alignSelf: 'flex-start',
    overflow: 'hidden',
    marginTop: 2,
  },
  arrow: { fontSize: 18, color: colors.primaryContainer },
  emptyText: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center', paddingVertical: spacing.xl },
});
