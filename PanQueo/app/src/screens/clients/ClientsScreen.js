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
import { Button } from "../../components/ui";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from "../../lib/theme";
import { RegistrarClienteModal } from "./RegistrarClienteModal";
import { useClientes } from "../../lib/hooks/useClientes";

export const ClientsScreen = ({ navigation }) => {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const { data: rawClients, loading, refetch } = useClientes();
  const clients = Array.isArray(rawClients) ? rawClients : (rawClients?.clientes || []);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.nombre || "").toLowerCase().includes(q) ||
      (c.apellido || "").toLowerCase().includes(q) ||
      String(c.telefono || "").includes(q) ||
      String(c.cedula || "").toLowerCase().includes(q)
    );
  });

  const getInitial = (name) => (name || "?").charAt(0).toUpperCase();

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Directorio de Clientes</Text>
            <Text style={styles.subtitle}>{clients.length} clientes registrados</Text>
          </View>
          <Button
            title="+ Nuevo Cliente"
            variant="primary"
            onPress={() => setShowModal(true)}
          />
        </View>

        <View style={styles.searchRow}>
          <MaterialIcons name="search" size={20} color={colors.outline} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, CI o teléfono..."
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

        {loading && <Text style={styles.emptyText}>Cargando clientes...</Text>}

        {!loading &&
          filtered.map((c) => (
            <TouchableOpacity
              key={c.id_cliente}
              style={styles.clientCard}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate("HistorialCliente", {
                  clienteId: c.id_cliente,
                })
              }
            >
              <View style={styles.clientLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitial(c.nombre)}</Text>
                </View>
                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>
                    {c.nombre} {c.apellido || ""}
                  </Text>
                  <View style={styles.phoneRow}>
                    <MaterialIcons name="phone" size={14} color={colors.primary} />
                    <Text style={styles.clientPhone}>{c.telefono || "Sin teléfono"}</Text>
                  </View>
                  <Text style={styles.clientMeta}>
                    CI: {c.cedula || "—"} · Fidelidad: {c.puntos_fidelidad || 0} pts
                  </Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={colors.outline} />
            </TouchableOpacity>
          ))}

        {!loading && filtered.length === 0 && (
          <View style={styles.emptyCard}>
            <MaterialIcons name="people-outline" size={40} color={colors.outline} />
            <Text style={styles.emptyText}>No se encontraron clientes</Text>
          </View>
        )}
      </ScrollView>

      <RegistrarClienteModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          refetch();
        }}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 100, gap: spacing.sm },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  title: { ...typography.headlineMd, fontSize: 20, color: colors.onSurface },
  subtitle: { ...typography.metadata, color: colors.onSurfaceVariant, marginTop: -2 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.onSurface },
  clientCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    ...shadows.sm,
  },
  clientLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { ...typography.titleSm, color: colors.onPrimaryContainer },
  clientInfo: { flex: 1, gap: 2 },
  clientName: { ...typography.bodySm, fontWeight: "700", color: colors.onSurface },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  clientPhone: { ...typography.metadata, color: colors.onSurfaceVariant, fontSize: 12 },
  clientMeta: { ...typography.metadata, color: colors.outline, fontSize: 11 },
  emptyText: { ...typography.bodySm, color: colors.onSurfaceVariant, textAlign: "center" },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
    gap: 8,
    marginTop: spacing.md,
  },
});
