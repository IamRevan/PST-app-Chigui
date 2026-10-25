import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SheetModal } from '../../components/ui/Modal';
import { Button, Badge } from '../../components/ui';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';
import apiClient from '../../lib/api/client';
import { ENDPOINTS } from '../../lib/api/endpoints';
import { useCurrency } from '../../lib/currency';

export const RecetaDetalleModal = ({
  visible,
  onClose,
  recetaId,
  onOpenCalculadora,
}) => {
  const [receta, setReceta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTool, setActiveTool] = useState(null); // 'stock' | 'costo' | null
  const [toolData, setToolData] = useState(null);
  const [toolLoading, setToolLoading] = useState(false);

  const { format, formatUSD, formatBs } = useCurrency();

  useEffect(() => {
    if (visible && recetaId) {
      loadReceta();
      setActiveTool(null);
      setToolData(null);
    }
  }, [visible, recetaId]);

  const loadReceta = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(ENDPOINTS.RECETA_BY_ID(recetaId));
      setReceta(res.data?.data || res.data);
    } catch (err) {
      console.warn('Error loading receta:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificarStock = async () => {
    setActiveTool('stock');
    setToolLoading(true);
    try {
      const res = await apiClient.get(ENDPOINTS.RECETA_VERIFICAR_STOCK(recetaId));
      setToolData(res.data?.data || res.data);
    } catch (err) {
      setToolData({ error: err.message || 'Error al verificar stock' });
    } finally {
      setToolLoading(false);
    }
  };

  const handleSimularCosto = async () => {
    setActiveTool('costo');
    setToolLoading(true);
    try {
      const res = await apiClient.get(ENDPOINTS.RECETA_SIMULAR_COSTO(recetaId));
      setToolData(res.data?.data || res.data);
    } catch (err) {
      setToolData({ error: err.message || 'Error al simular costo' });
    } finally {
      setToolLoading(false);
    }
  };

  const ingredientes =
    receta?.RecetaIngredientes || receta?.Ingredientes || [];

  return (
    <SheetModal
      visible={visible}
      onClose={onClose}
      title={receta?.nombre_receta || 'Detalle de Receta'}
    >
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando receta...</Text>
        </View>
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <View style={styles.metaRow}>
            <Badge
              label={`${ingredientes.length} ingredientes`}
              variant="default"
            />
            <Badge
              label={receta?.rendimiento || '1 porción'}
              variant="success"
            />
            {receta?.precio_sugerido && (
              <Badge
                label={`Sugerido: ${format(receta.precio_sugerido)}`}
                variant="warning"
              />
            )}
          </View>

          {receta?.instrucciones ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Instrucciones / Notas</Text>
              <Text style={styles.descriptionText}>{receta.instrucciones}</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredientes Requeridos</Text>
            {ingredientes.length === 0 ? (
              <Text style={styles.emptyText}>Sin ingredientes asociados.</Text>
            ) : (
              ingredientes.map((item, idx) => {
                const ingNombre =
                  item.Ingrediente?.nombre_ing ||
                  item.nombre_ing ||
                  `Ingrediente #${item.id_ingrediente}`;
                const unidad =
                  item.Ingrediente?.unidad_medida || item.unidad_medida || '';
                return (
                  <View key={idx} style={styles.ingredientRow}>
                    <View style={styles.ingLeft}>
                      <MaterialIcons name="bakery-dining" size={18} color={colors.primary} />
                      <Text style={styles.ingName}>{ingNombre}</Text>
                    </View>
                    <Text style={styles.ingQty}>
                      {parseFloat(item.cantidad_requerida || 0)} {unidad}
                    </Text>
                  </View>
                );
              })
            )}
          </View>

          {/* Botones de acción operativa */}
          <View style={styles.toolsRow}>
            <TouchableOpacity
              style={[styles.toolBtn, activeTool === 'stock' && styles.toolBtnActive]}
              onPress={handleVerificarStock}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name="inventory"
                size={16}
                color={activeTool === 'stock' ? colors.white : colors.primary}
              />
              <Text
                style={[
                  styles.toolBtnText,
                  activeTool === 'stock' && styles.toolBtnTextActive,
                ]}
              >
                Verificar Stock
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolBtn, activeTool === 'costo' && styles.toolBtnActive]}
              onPress={handleSimularCosto}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name="calculate"
                size={16}
                color={activeTool === 'costo' ? colors.white : colors.primary}
              />
              <Text
                style={[
                  styles.toolBtnText,
                  activeTool === 'costo' && styles.toolBtnTextActive,
                ]}
              >
                Simular Costo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Resultado de la herramienta activa */}
          {toolLoading && (
            <View style={styles.toolLoadingBox}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.toolLoadingText}>Consultando inventario y costos...</Text>
            </View>
          )}

          {!toolLoading && activeTool === 'stock' && toolData && (
            <View style={styles.resultBox}>
              <View
                style={[
                  styles.stockHeaderBanner,
                  toolData.suficiente ? styles.stockOk : styles.stockShortage,
                ]}
              >
                <MaterialIcons
                  name={toolData.suficiente ? 'check-circle' : 'error'}
                  size={20}
                  color={toolData.suficiente ? '#2e7d32' : colors.error}
                />
                <Text
                  style={[
                    styles.stockBannerText,
                    toolData.suficiente ? { color: '#2e7d32' } : { color: colors.error },
                  ]}
                >
                  {toolData.suficiente
                    ? 'Stock suficiente en inventario'
                    : 'Stock insuficiente para preparar'}
                </Text>
              </View>

              {(toolData.detalles || []).map((d, i) => (
                <View key={i} style={styles.stockItemRow}>
                  <Text style={styles.stockItemName}>{d.ingrediente}</Text>
                  <Text
                    style={[
                      styles.stockItemValues,
                      d.suficiente ? styles.stockTextOk : styles.stockTextShort,
                    ]}
                  >
                    Req: {parseFloat(d.requerido)} · Disp: {parseFloat(d.disponible)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {!toolLoading && activeTool === 'costo' && toolData && (
            <View style={styles.resultBox}>
              {toolData.error ? (
                <Text style={styles.errorText}>{toolData.error}</Text>
              ) : (
                <View style={styles.costGrid}>
                  <View style={styles.costRow}>
                    <Text style={styles.costLabel}>Costo de producción</Text>
                    <Text style={styles.costVal}>
                      {formatDual(toolData.costoProduccion?.USD || 0)}
                    </Text>
                  </View>
                  <View style={styles.costRow}>
                    <Text style={styles.costLabel}>Precio mínimo sugerido (20% margen)</Text>
                    <Text style={styles.costVal}>
                      {formatDual(toolData.precioMinimoRecomendado?.USD || 0)}
                    </Text>
                  </View>
                  <View style={[styles.costRow, styles.costRowHighlight]}>
                    <Text style={[styles.costLabel, styles.costLabelHighlight]}>
                      Precio recomendado (35% margen)
                    </Text>
                    <Text style={[styles.costVal, styles.costValHighlight]}>
                      {formatDual(toolData.precioSugerido?.USD || 0)}
                    </Text>
                  </View>
                  <Text style={styles.costFooterText}>
                    Basado en las compras de los lotes más recientes y tasa BCV oficial.
                  </Text>
                </View>
              )}
            </View>
          )}

          {onOpenCalculadora && (
            <Button
              title="Abrir en Calculadora de Precios"
              variant="outline"
              onPress={() => {
                onClose();
                onOpenCalculadora(recetaId);
              }}
              style={{ marginTop: spacing.md }}
            />
          )}
        </ScrollView>
      )}
    </SheetModal>
  );
};

const styles = StyleSheet.create({
  container: { maxHeight: 520 },
  content: { paddingBottom: spacing.lg, gap: spacing.md },
  centerBox: { padding: spacing.xl, alignItems: 'center', gap: spacing.sm },
  loadingText: { ...typography.bodySm, color: colors.onSurfaceVariant },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  section: { gap: spacing.xs },
  sectionTitle: {
    ...typography.labelBold,
    fontSize: 12,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  descriptionText: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
    lineHeight: 20,
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.md,
    marginBottom: 4,
  },
  ingLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  ingName: { ...typography.bodySm, fontWeight: '600', color: colors.onSurface },
  ingQty: { ...typography.labelBold, color: colors.primary, fontSize: 13 },
  emptyText: { ...typography.bodySm, color: colors.onSurfaceVariant, fontStyle: 'italic' },
  toolsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  toolBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  toolBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toolBtnText: { ...typography.buttonText, fontSize: 12, color: colors.primary },
  toolBtnTextActive: { color: colors.white },
  toolLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: spacing.md,
  },
  toolLoadingText: { ...typography.metadata, color: colors.onSurfaceVariant },
  resultBox: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    gap: spacing.xs,
  },
  stockHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  stockOk: { backgroundColor: 'rgba(76,175,80,0.12)' },
  stockShortage: { backgroundColor: 'rgba(255,82,82,0.12)' },
  stockBannerText: { ...typography.labelBold, fontSize: 13 },
  stockItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  stockItemName: { ...typography.bodySm, color: colors.onSurface, flex: 1 },
  stockItemValues: { ...typography.labelCaption, fontSize: 12, fontWeight: '600' },
  stockTextOk: { color: '#2e7d32' },
  stockTextShort: { color: colors.error },
  costGrid: { gap: 8 },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  costRowHighlight: {
    backgroundColor: `${colors.primaryContainer}20`,
    paddingHorizontal: 8,
    borderRadius: borderRadius.md,
    borderBottomWidth: 0,
  },
  costLabel: { ...typography.bodySm, color: colors.onSurfaceVariant, fontSize: 12, flex: 1 },
  costLabelHighlight: { fontWeight: '700', color: colors.onSurface },
  costVal: { ...typography.labelBold, color: colors.onSurface, fontSize: 13 },
  costValHighlight: { color: colors.primary, fontWeight: '700' },
  costFooterText: {
    ...typography.metadata,
    color: colors.onSurfaceVariant,
    fontSize: 10,
    marginTop: 4,
  },
  errorText: { ...typography.bodySm, color: colors.error, textAlign: 'center' },
});
