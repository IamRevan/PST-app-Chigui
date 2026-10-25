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
import { useAuth } from "../../auth/AuthContext";
import { usePedidos } from "../../lib/hooks/usePedidos";
import { useAlertasVencimiento } from "../../lib/hooks/useInventario";
import { useCurrency } from "../../lib/currency";
import { CalculadoraModal } from "../recipes/CalculadoraModal";

export const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { data: rawPedidos, loading: loadingPedidos } = usePedidos();
  const { data: rawAlertas } = useAlertasVencimiento();
  const { format, formatDual } = useCurrency();
  const [showCalculadora, setShowCalculadora] = useState(false);

  const pedidos = Array.isArray(rawPedidos) ? rawPedidos : (rawPedidos?.pedidos || []);
  const alertas = Array.isArray(rawAlertas) ? rawAlertas : [];

  const pedidosEnCocina = pedidos.filter(
    (p) => p.estado_entrega === "En Cocina",
  );
  const pedidosHoy = pedidos.filter((p) => {
    const hoy = new Date().toISOString().split("T")[0];
    return p.fecha_entrega === hoy;
  });

  const stockBajo = alertas?.length || 0;
  const porCobrar = pedidos
    .filter((p) => p.estado_pago !== "Pagado")
    .reduce(
      (sum, p) =>
        sum + (parseFloat(p.costo_total || 0) - parseFloat(p.monto_abonado || 0)),
      0,
    );
  const totalAlertas = alertas?.length || 0;

  const METRICS = [
    {
      label: "Pedidos Hoy",
      value: String(pedidosHoy.length),
      bg: colors.metricBg1,
      border: colors.metricBorder1,
      textColor: colors.metricText1,
      iconName: "receipt-long",
      onPress: () => navigation.navigate("Pedidos"),
    },
    {
      label: "Stock Crítico",
      value: String(stockBajo),
      bg: colors.metricBg2,
      border: colors.metricBorder2,
      textColor: colors.metricText2,
      iconName: "warning-amber",
      onPress: () => navigation.navigate("Inventario"),
    },
    {
      label: "Por Cobrar",
      value: format(porCobrar),
      bg: colors.metricBg3,
      border: colors.metricBorder3,
      textColor: colors.metricText3,
      iconName: "payments",
      onPress: () => navigation.navigate("Pedidos"),
    },
    {
      label: "Alertas Venc.",
      value: String(totalAlertas),
      bg: colors.metricBg4,
      border: colors.metricBorder4,
      textColor: colors.metricText4,
      iconName: "notifications-active",
      onPress: () => navigation.navigate("AlertasVencimiento"),
    },
  ];

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* Saludo y Encabezado de la cocina */}
        <View style={styles.greeting}>
          <View>
            <Text style={styles.greetingText}>
              ¡Hola, {user?.nombre || "Chef Capibara"}!
            </Text>
            <Text style={styles.greetingSub}>Resumen y operaciones del día</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => navigation.navigate("Perfil")}
            activeOpacity={0.7}
          >
            <MaterialIcons name="account-circle" size={32} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Matriz de Métricas principales */}
        <View style={styles.metricsGrid}>
          {METRICS.map((m, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.metricCard,
                { backgroundColor: m.bg, borderColor: m.border },
              ]}
              onPress={m.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.metricHeader}>
                <MaterialIcons name={m.iconName} size={22} color={m.textColor} />
              </View>
              <Text style={[styles.metricValue, { color: m.textColor }]}>
                {m.value}
              </Text>
              <Text style={[styles.metricLabel, { color: `${m.textColor}CC` }]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Accesos Rápidos Operativos */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={[styles.quickActionBtn, styles.quickActionPrimary]}
            onPress={() => navigation.navigate("NuevoPedido")}
            activeOpacity={0.7}
          >
            <MaterialIcons name="add-shopping-cart" size={20} color={colors.onPrimaryContainer} />
            <Text style={styles.quickActionPrimaryText}>Nuevo Pedido</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => setShowCalculadora(true)}
            activeOpacity={0.7}
          >
            <MaterialIcons name="calculate" size={20} color={colors.primary} />
            <Text style={styles.quickActionText}>Calculadora</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => navigation.navigate("Reportes")}
            activeOpacity={0.7}
          >
            <MaterialIcons name="insert-chart" size={20} color={colors.primary} />
            <Text style={styles.quickActionText}>Reportes</Text>
          </TouchableOpacity>
        </View>

        {/* Sección de Producción Activa (En Cocina) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <MaterialIcons name="soup-kitchen" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Producción Activa</Text>
            </View>
            <Badge
              label={`${pedidosEnCocina.length} en cocina`}
              variant="warning"
            />
          </View>

          {loadingPedidos && (
            <Text style={styles.emptyText}>Consultando cocina activa...</Text>
          )}

          {!loadingPedidos && pedidosEnCocina.length === 0 && (
            <View style={styles.emptyCard}>
              <MaterialIcons name="check-circle-outline" size={36} color={colors.tertiary} />
              <Text style={styles.emptyCardTitle}>Sin pedidos en cocina</Text>
              <Text style={styles.emptyCardDesc}>
                Pasa un pedido a "En Cocina" desde Pedidos para iniciar la producción y descontar ingredientes por FIFO.
              </Text>
            </View>
          )}

          {!loadingPedidos &&
            pedidosEnCocina.map((order) => (
              <Card key={order.id_pedido} style={styles.orderCard}>
                <View style={styles.orderLeft}>
                  <View style={styles.orderIdRow}>
                    <Text style={styles.orderId}>Pedido #{order.id_pedido}</Text>
                    <View style={styles.orderDot} />
                    <Text style={styles.orderDue}>
                      Entrega: {order.fecha_entrega ? String(order.fecha_entrega).slice(0, 10) : "Hoy"}
                    </Text>
                  </View>
                  <Text style={styles.orderName} numberOfLines={1}>
                    {order.observaciones || `Pedido #${order.id_pedido}`}
                  </Text>
                  <Text style={styles.orderClient}>
                    Cliente: {order.Cliente?.nombre || "General"} {order.Cliente?.apellido || ""}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.orderAction}
                  onPress={() =>
                    navigation.navigate("DetallePedido", {
                      pedidoId: order.id_pedido,
                    })
                  }
                  activeOpacity={0.7}
                >
                  <Text style={styles.orderActionText}>Ver</Text>
                  <MaterialIcons name="chevron-right" size={20} color={colors.primary} />
                </TouchableOpacity>
              </Card>
            ))}
        </View>
      </ScrollView>

      {/* Modal de Calculadora de Precios */}
      <CalculadoraModal
        visible={showCalculadora}
        onClose={() => setShowCalculadora(false)}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 100 },
  greeting: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  greetingText: { ...typography.headlineMd, color: colors.onBackground, fontSize: 22 },
  greetingSub: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },
  avatarButton: { padding: 4 },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metricCard: {
    width: "48%",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: 4,
    ...shadows.sm,
  },
  metricHeader: { flexDirection: "row", alignItems: "center" },
  metricValue: { ...typography.headlineMd, fontSize: 18 },
  metricLabel: { ...typography.labelCaption, fontSize: 11, fontWeight: "600" },
  quickActionsRow: {
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    paddingHorizontal: 8,
  },
  quickActionPrimary: {
    backgroundColor: colors.primaryContainer,
    borderColor: colors.primaryContainer,
  },
  quickActionPrimaryText: {
    ...typography.labelBold,
    color: colors.onPrimaryContainer,
    fontSize: 12,
  },
  quickActionText: {
    ...typography.labelBold,
    color: colors.primary,
    fontSize: 12,
  },
  section: { gap: spacing.sm },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionTitle: { ...typography.titleSm, color: colors.onSurface, fontSize: 16 },
  emptyText: { ...typography.bodySm, color: colors.onSurfaceVariant, textAlign: "center", padding: spacing.lg },
  emptyCard: {
    padding: spacing.lg,
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    gap: 6,
  },
  emptyCardTitle: { ...typography.titleSm, color: colors.onSurface, fontSize: 14 },
  emptyCardDesc: {
    ...typography.metadata,
    color: colors.onSurfaceVariant,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 16,
  },
  orderCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xs,
  },
  orderLeft: { flex: 1, gap: 2 },
  orderIdRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  orderId: { ...typography.labelBold, color: colors.primary, fontSize: 13 },
  orderDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.outline },
  orderDue: { ...typography.metadata, color: colors.onSurfaceVariant, fontSize: 11 },
  orderName: { ...typography.bodySm, fontWeight: "600", color: colors.onSurface },
  orderClient: { ...typography.metadata, color: colors.onSurfaceVariant, fontSize: 11 },
  orderAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingLeft: spacing.sm,
  },
  orderActionText: { ...typography.labelBold, color: colors.primary, fontSize: 13 },
});
