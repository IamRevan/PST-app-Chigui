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
import { Card, Badge, Button } from "../../components/ui";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from "../../lib/theme";
import { usePedidos } from "../../lib/hooks/usePedidos";
import { useCurrency } from "../../lib/currency";

const FILTERS = ["Todos", "Pendientes", "En Cocina", "Listos", "Entregados"];

const FILTER_MAP = {
  Todos: null,
  Pendientes: "Por Preparar",
  "En Cocina": "En Cocina",
  Listos: "Listo",
  Entregados: "Entregado",
};

const STATUS_MAP = {
  Pendiente: {
    border: "#FF9800",
    bg: colors.pendienteBg,
    text: colors.pendiente,
  },
  Abonado: {
    border: "#2196F3",
    bg: colors.enCocinaBg,
    text: colors.enCocina,
  },
  Pagado: { border: "#4CAF50", bg: "#E8F5E9", text: "#2E7D32" },
  "Por Preparar": {
    border: "#FF9800",
    bg: colors.pendienteBg,
    text: colors.pendiente,
  },
  "En Cocina": {
    border: "#2196F3",
    bg: colors.enCocinaBg,
    text: colors.enCocina,
  },
  Listo: {
    border: colors.tertiary,
    bg: `${colors.tertiaryContainer}33`,
    text: colors.tertiary,
  },
  Entregado: {
    border: "#9E9E9E",
    bg: "#F5F5F5",
    text: "#757575",
  },
};

export const OrdersScreen = ({ navigation }) => {
  const [activeFilter, setActiveFilter] = useState("Todos");
  const { data: rawOrders, loading, refetch } = usePedidos();
  const { format, formatDual } = useCurrency();
  const orders = Array.isArray(rawOrders) ? rawOrders : (rawOrders?.pedidos || []);

  const filtered = orders.filter((p) => {
    if (activeFilter === "Todos") return true;
    return p.estado_entrega === FILTER_MAP[activeFilter];
  });

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Órdenes y Pedidos</Text>
            <Text style={styles.subtitle}>{orders.length} pedidos registrados</Text>
          </View>
          <Button
            title="+ Nuevo Pedido"
            variant="primary"
            onPress={() => navigation.navigate("NuevoPedido")}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersRow}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterPill,
                activeFilter === f && styles.filterPillActive,
              ]}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === f && styles.filterTextActive,
                ]}
              >
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading && (
          <Text style={styles.loadingText}>Cargando pedidos...</Text>
        )}

        {!loading &&
          filtered.map((order) => {
            const sc = STATUS_MAP[order.estado_entrega] || STATUS_MAP["Pendiente"];
            const esPagado = order.estado_pago === "Pagado";
            return (
              <TouchableOpacity
                key={order.id_pedido}
                style={[styles.orderCard, { borderLeftColor: sc.border }]}
                onPress={() =>
                  navigation.navigate("DetallePedido", {
                    pedidoId: order.id_pedido,
                  })
                }
                activeOpacity={0.75}
              >
                <View style={styles.orderTop}>
                  <View style={styles.orderTopLeft}>
                    <Text style={styles.orderId}>#{order.id_pedido}</Text>
                    <Badge
                      label={order.estado_entrega}
                      variant={
                        order.estado_entrega === "Listo"
                          ? "success"
                          : order.estado_entrega === "En Cocina"
                            ? "default"
                            : "warning"
                      }
                      dot
                    />
                    {order.es_delivery && (
                      <MaterialIcons name="delivery-dining" size={18} color={colors.primary} />
                    )}
                  </View>
                  <Text style={styles.orderTotal}>
                    {format(order.costo_total || 0)}
                  </Text>
                </View>

                <View style={styles.orderDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Cliente:</Text>
                    <Text style={styles.detailValue}>
                      {order.Cliente?.nombre || `ID ${order.id_cliente}`} {order.Cliente?.apellido || ""}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Entrega:</Text>
                    <Text style={styles.detailValue}>
                      {order.fecha_entrega ? String(order.fecha_entrega).slice(0, 10) : "—"}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Pago:</Text>
                    <Text
                      style={[
                        styles.detailValue,
                        esPagado ? { color: colors.tertiary, fontWeight: "700" } : { color: colors.onSurface },
                      ]}
                    >
                      {order.estado_pago}
                    </Text>
                  </View>
                </View>

                <View style={styles.viewDetail}>
                  <Text style={styles.viewDetailText}>Ver Detalle Completo</Text>
                  <MaterialIcons name="arrow-forward" size={16} color={colors.primary} />
                </View>
              </TouchableOpacity>
            );
          })}

        {!loading && filtered.length === 0 && (
          <View style={styles.emptyCard}>
            <MaterialIcons name="receipt-long" size={40} color={colors.outline} />
            <Text style={styles.emptyText}>
              No hay pedidos{" "}
              {activeFilter !== "Todos" ? `en "${activeFilter.toLowerCase()}"` : ""}
            </Text>
          </View>
        )}
      </ScrollView>
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
  filtersRow: { marginBottom: spacing.xs },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerLow,
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
  },
  filterPillActive: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primaryContainer,
  },
  filterText: {
    ...typography.labelCaption,
    color: colors.onSurfaceVariant,
    fontWeight: "600",
  },
  filterTextActive: {
    color: colors.onPrimaryContainer,
    fontWeight: "700",
  },
  loadingText: { textAlign: "center", padding: spacing.xl, color: colors.onSurfaceVariant },
  orderCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    ...shadows.sm,
    gap: spacing.xs,
  },
  orderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderTopLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  orderId: { ...typography.titleSm, fontSize: 16, color: colors.onSurface },
  orderTotal: { ...typography.labelBold, color: colors.primary, fontSize: 14 },
  orderDetails: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    padding: 8,
    gap: 3,
    marginVertical: 4,
  },
  detailRow: { flexDirection: "row", justifyContent: "space-between" },
  detailLabel: { ...typography.metadata, color: colors.onSurfaceVariant, fontSize: 12 },
  detailValue: { ...typography.bodySm, color: colors.onSurface, fontSize: 12, fontWeight: "500" },
  viewDetail: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    paddingTop: 4,
  },
  viewDetailText: { ...typography.buttonText, color: colors.primary, fontSize: 12 },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    gap: 8,
  },
  emptyText: { ...typography.bodySm, color: colors.onSurfaceVariant, textAlign: "center" },
});
