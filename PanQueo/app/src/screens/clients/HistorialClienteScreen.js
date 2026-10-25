import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
import {
  useClienteById,
  useClienteHistorial,
} from "../../lib/hooks/useClientes";
import { useCurrency } from "../../lib/currency";

export const HistorialClienteScreen = ({ navigation, route }) => {
  const clienteId = route?.params?.clienteId;
  const { format, formatDual } = useCurrency();

  const { data: cliente, loading: loadingCliente } = useClienteById(clienteId);
  const { data: pedidos, loading: loadingPedidos } =
    useClienteHistorial(clienteId);

  const getInitial = (name) => (name || "?").charAt(0).toUpperCase();
  const totalGastado = Array.isArray(pedidos)
    ? pedidos.reduce((sum, p) => sum + parseFloat(p.costo_total || 0), 0)
    : 0;

  if (!clienteId) {
    return (
      <ScreenWrapper>
        <Text style={styles.emptyText}>Selecciona un cliente</Text>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backRow}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.onSurface} />
          <Text style={styles.backLabel}>Volver a Clientes</Text>
        </TouchableOpacity>

        <View style={styles.profileCard}>
          {loadingCliente ? (
            <Text style={{ textAlign: "center", width: "100%", padding: spacing.md }}>
              Cargando información del cliente...
            </Text>
          ) : (
            <>
              <View style={styles.profileAvatar}>
                <Text style={styles.avatarText}>
                  {getInitial(cliente?.nombre)}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {cliente?.nombre} {cliente?.apellido || ""}
                </Text>
                <View style={styles.contactRow}>
                  <MaterialIcons name="phone" size={16} color={colors.primary} />
                  <Text style={styles.contactText}>
                    {cliente?.telefono || "Sin teléfono"}
                  </Text>
                </View>
                <View style={styles.contactRow}>
                  <MaterialIcons name="location-on" size={16} color={colors.primary} />
                  <Text style={styles.contactText}>
                    {cliente?.direccion || "Sin dirección registrada"}
                  </Text>
                </View>
                <View style={styles.contactRow}>
                  <MaterialIcons name="badge" size={16} color={colors.primary} />
                  <Text style={styles.contactText}>
                    C.I. {cliente?.cedula || "N/A"}
                  </Text>
                </View>
                <Button
                  title="+ Nuevo Pedido para este Cliente"
                  variant="primary"
                  onPress={() =>
                    navigation.navigate("NuevoPedido", {
                      clienteId: cliente?.id_cliente,
                      clienteNombre: cliente?.nombre,
                    })
                  }
                  style={styles.newOrderBtn}
                />
              </View>
            </>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Pedidos</Text>
            <Text style={styles.statValue}>{pedidos ? pedidos.length : 0}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Invertido</Text>
            <Text style={styles.statValueBold}>{format(totalGastado)}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardAccent]}>
            <Text style={styles.statLabel}>Puntos Fidelidad</Text>
            <Text style={styles.statValueSm}>
              {cliente?.puntos_fidelidad || 0} pts
            </Text>
          </View>
        </View>

        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <MaterialIcons name="history" size={20} color={colors.primary} />
            <Text style={styles.tableTitle}>Historial de Órdenes</Text>
          </View>
          <View style={styles.tableHead}>
            <Text style={[styles.th, styles.thFirst]}># Pedido</Text>
            <Text style={styles.th}>Fecha</Text>
            <Text style={styles.th}>Total</Text>
            <Text style={[styles.th, styles.thRight]}>Estado</Text>
          </View>
          {loadingPedidos && (
            <Text style={{ textAlign: "center", padding: 20 }}>
              Cargando historial...
            </Text>
          )}
          {!loadingPedidos && (!pedidos || pedidos.length === 0) && (
            <Text style={styles.emptyRow}>No hay pedidos registrados para este cliente</Text>
          )}
          {!loadingPedidos &&
            pedidos &&
            pedidos.map((o, i) => (
              <TouchableOpacity
                key={o.id_pedido}
                style={[
                  styles.tableRow,
                  i < pedidos.length - 1 && styles.tableRowBorder,
                ]}
                onPress={() =>
                  navigation.navigate("DetallePedido", {
                    pedidoId: o.id_pedido,
                  })
                }
                activeOpacity={0.7}
              >
                <Text style={[styles.td, styles.tdId]}>#{o.id_pedido}</Text>
                <Text style={styles.td}>
                  {o.fecha_pedido ? String(o.fecha_pedido).slice(0, 10) : "—"}
                </Text>
                <Text style={[styles.td, styles.tdBold]}>
                  {format(o.costo_total || 0)}
                </Text>
                <View style={[styles.td, styles.tdRight]}>
                  <Text
                    style={[
                      styles.statusBadge,
                      o.estado_entrega === "Entregado"
                        ? styles.statusOk
                        : o.estado_entrega === "Listo"
                          ? styles.statusOk
                          : styles.statusPending,
                    ]}
                  >
                    {o.estado_entrega}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 40, gap: spacing.md },
  emptyText: { ...typography.bodySm, textAlign: "center", padding: spacing.xl, color: colors.onSurfaceVariant },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 44,
    paddingTop: 4,
  },
  backLabel: { ...typography.labelBold, color: colors.onSurface, fontSize: 13 },
  profileCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    flexDirection: "row",
    gap: spacing.md,
    ...shadows.sm,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryContainer,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { ...typography.headlineMd, color: colors.onPrimaryContainer, fontSize: 24 },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { ...typography.titleSm, color: colors.onSurface, fontSize: 17 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  contactText: { ...typography.bodySm, color: colors.onSurfaceVariant, fontSize: 12 },
  newOrderBtn: { marginTop: spacing.xs },
  statsRow: { flexDirection: "row", gap: spacing.xs },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerLowest,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    alignItems: "center",
    gap: 2,
    ...shadows.sm,
  },
  statCardAccent: { backgroundColor: `${colors.primaryContainer}18` },
  statLabel: { ...typography.labelCaption, color: colors.onSurfaceVariant, fontSize: 10, textAlign: "center" },
  statValue: { ...typography.titleSm, color: colors.onSurface, fontSize: 16 },
  statValueBold: { ...typography.labelBold, color: colors.primary, fontSize: 13 },
  statValueSm: { ...typography.labelBold, color: colors.primary, fontSize: 13 },
  tableCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    overflow: "hidden",
    ...shadows.sm,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  tableTitle: { ...typography.labelBold, color: colors.primary, fontSize: 13, textTransform: "uppercase" },
  tableHead: {
    flexDirection: "row",
    backgroundColor: colors.surfaceContainerLow,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  th: { ...typography.labelCaption, color: colors.onSurfaceVariant, flex: 1, fontSize: 11 },
  thFirst: { flex: 1 },
  thRight: { textAlign: "right" },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.surfaceVariant },
  td: { ...typography.bodySm, flex: 1, color: colors.onSurface, fontSize: 12 },
  tdId: { ...typography.labelBold, color: colors.primary },
  tdBold: { fontWeight: "600" },
  tdRight: { alignItems: "flex-end" },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: borderRadius.full, fontSize: 10, fontWeight: "700" },
  statusOk: { backgroundColor: "rgba(76,175,80,0.12)", color: colors.tertiary },
  statusPending: { backgroundColor: "rgba(255,152,0,0.12)", color: "#FF9800" },
  emptyRow: { padding: spacing.md, textAlign: "center", color: colors.onSurfaceVariant, fontSize: 12 },
});
