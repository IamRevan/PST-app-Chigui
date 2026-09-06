import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
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

export const HistorialClienteScreen = ({ navigation, route }) => {
  const clienteId = route?.params?.clienteId;

  const { data: cliente, loading: loadingCliente } = useClienteById(clienteId);
  const { data: pedidos, loading: loadingPedidos } =
    useClienteHistorial(clienteId);

  const getInitial = (name) => (name || "?").charAt(0).toUpperCase();
  const totalGastado = pedidos
    ? pedidos.reduce((sum, p) => sum + parseFloat(p.costo_total || 0), 0)
    : 0;

  if (!clienteId)
    return (
      <ScreenWrapper>
        <Text style={styles.emptyText}>Selecciona un cliente</Text>
      </ScreenWrapper>
    );

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backRow}
        >
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backLabel}>Volver</Text>
        </TouchableOpacity>

        <View style={styles.profileCard}>
          {loadingCliente ? (
            <Text style={{ textAlign: "center", width: "100%" }}>
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
                  {cliente?.nombre} {cliente?.apellido}
                </Text>
                <View style={styles.contactRow}>
                  <Text style={styles.contactIcon}>📞</Text>
                  <Text style={styles.contactText}>
                    {cliente?.telefono || "Sin teléfono"}
                  </Text>
                </View>
                <View style={styles.contactRow}>
                  <Text style={styles.contactIcon}>📍</Text>
                  <Text style={styles.contactText}>
                    {cliente?.direccion || "Sin dirección"}
                  </Text>
                </View>
                <View style={styles.contactRow}>
                  <Text style={styles.contactIcon}>🪪</Text>
                  <Text style={styles.contactText}>
                    C.I. {cliente?.cedula || "N/A"}
                  </Text>
                </View>
                <Button
                  title="+ Nuevo Pedido"
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
            <Text style={styles.statValue}>{pedidos.length}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Gastado</Text>
            <Text style={styles.statValue}>${totalGastado.toFixed(0)}</Text>
          </View>
          <View style={[styles.statCard, styles.statCardAccent]}>
            <Text style={styles.statLabel}>Puntos</Text>
            <Text style={styles.statValueSm}>
              {cliente?.puntos_fidelidad || 0}
            </Text>
          </View>
          <View style={[styles.statCard, styles.statCardAccent]}>
            <Text style={styles.statLabel}>Última Visita</Text>
            <Text style={styles.statValueSm}>
              {pedidos[0]?.fecha_pedido || "N/A"}
            </Text>
          </View>
        </View>

        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableTitle}>Historial de Pedidos</Text>
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
            <Text style={styles.emptyRow}>No hay pedidos registrados</Text>
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
              >
                <Text style={[styles.td, styles.tdId]}>#{o.id_pedido}</Text>
                <Text style={styles.td}>{o.fecha_pedido}</Text>
                <Text style={[styles.td, styles.tdBold]}>
                  ${parseFloat(o.costo_total || 0).toFixed(2)}
                </Text>
                <View style={[styles.td, styles.tdRight]}>
                  <Text
                    style={[
                      styles.statusBadge,
                      o.estado_entrega === "Entregado"
                        ? styles.statusOk
                        : o.estado_entrega === "Cancelado"
                          ? styles.statusCancel
                          : styles.statusOk,
                    ]}
                  >
                    {o.estado_entrega}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          <TouchableOpacity
            style={styles.viewAll}
            onPress={() => navigation.navigate("Pedidos")}
          >
            <Text style={styles.viewAllText}>Ver todos los pedidos →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 40, gap: spacing.md },
  backRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  backIcon: { fontSize: 20, color: colors.onSurface },
  backLabel: { ...typography.bodyMd, color: colors.onSurface },
  profileCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    flexDirection: "row",
    gap: spacing.lg,
    ...shadows.md,
    borderWidth: 1,
    borderColor: `${colors.outlineVariant}33`,
  },
  profileAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.secondaryContainer,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: colors.surfaceContainerLowest,
    ...shadows.sm,
  },
  avatarText: { ...typography.displayLg, color: colors.onSecondaryContainer },
  profileInfo: { flex: 1, gap: spacing.xs },
  profileName: { ...typography.headlineMd, color: colors.onSurface },
  contactRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  contactIcon: { fontSize: 16 },
  contactText: { ...typography.bodySm, color: colors.onSurfaceVariant },
  newOrderBtn: { marginTop: spacing.sm },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  statCardAccent: {
    backgroundColor: `${colors.secondaryContainer}4D`,
    borderWidth: 1,
    borderColor: `${colors.secondaryContainer}`,
  },
  statLabel: {
    ...typography.labelBold,
    color: colors.onSurfaceVariant,
    textTransform: "uppercase",
    fontSize: 12,
  },
  statValue: { ...typography.headlineMd, color: colors.primary },
  statValueSm: { ...typography.titleSm, color: colors.onSurface },
  tableCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    ...shadows.md,
    borderWidth: 1,
    borderColor: `${colors.outlineVariant}33`,
  },
  tableHeader: {
    padding: spacing.md,
    backgroundColor: `${colors.surfaceContainerHigh}4D`,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.outlineVariant}1A`,
  },
  tableTitle: { ...typography.titleSm, color: colors.onSurface },
  tableHead: {
    flexDirection: "row",
    backgroundColor: colors.surfaceContainerLow,
    paddingVertical: spacing.sm,
  },
  th: {
    flex: 1,
    ...typography.labelBold,
    color: colors.onSurfaceVariant,
    paddingHorizontal: spacing.md,
  },
  thFirst: { flex: 1.2 },
  thRight: { textAlign: "right" },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  tableRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: `${colors.outlineVariant}1A`,
  },
  td: {
    flex: 1,
    ...typography.bodySm,
    color: colors.onSurface,
    paddingHorizontal: spacing.md,
  },
  tdId: { flex: 1.2, ...typography.labelBold, color: colors.primary },
  tdBold: { fontWeight: "600" },
  tdRight: { alignItems: "flex-end" },
  statusBadge: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
  },
  statusOk: {
    backgroundColor: colors.tertiaryContainer,
    color: colors.onTertiaryContainer,
  },
  statusCancel: {
    backgroundColor: colors.errorContainer,
    color: colors.onErrorContainer,
  },
  viewAll: { padding: spacing.md, alignItems: "center" },
  viewAllText: { ...typography.labelBold, color: colors.primary },
  emptyRow: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    padding: spacing.lg,
  },
  emptyText: {
    ...typography.bodyMd,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    paddingVertical: spacing.xl,
  },
});
