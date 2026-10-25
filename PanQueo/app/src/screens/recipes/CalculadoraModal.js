import { useState, useEffect, useCallback } from 'react';
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
import { Button } from '../../components/ui';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';
import apiClient from '../../lib/api/client';
import { ENDPOINTS } from '../../lib/api/endpoints';
import { useCurrency } from '../../lib/currency';

export const CalculadoraModal = ({
  visible,
  onClose,
  initialRecetaId = null,
}) => {
  const [recetas, setRecetas] = useState([]);
  const [selectedRecetaId, setSelectedRecetaId] = useState(initialRecetaId);
  const [qty, setQty] = useState(1);
  const [margin, setMargin] = useState(35); // 35% default
  const [costoData, setCostoData] = useState(null);
  const [loadingRecetas, setLoadingRecetas] = useState(false);
  const [loadingCosto, setLoadingCosto] = useState(false);
  const [showSelector, setShowSelector] = useState(false);

  const { format, formatDual, tasa } = useCurrency();

  useEffect(() => {
    if (visible) {
      loadRecetas();
    }
  }, [visible]);

  useEffect(() => {
    if (initialRecetaId) {
      setSelectedRecetaId(initialRecetaId);
    }
  }, [initialRecetaId]);

  useEffect(() => {
    if (selectedRecetaId) {
      loadCosto(selectedRecetaId);
    }
  }, [selectedRecetaId]);

  const loadRecetas = async () => {
    setLoadingRecetas(true);
    try {
      const res = await apiClient.get(ENDPOINTS.RECETAS);
      const data = res.data?.data || res.data;
      const list = Array.isArray(data) ? data : (data?.recetas || []);
      setRecetas(list);
      if (!selectedRecetaId && list.length > 0) {
        setSelectedRecetaId(list[0].id_receta);
      }
    } catch (err) {
      console.warn('Error loading recetas para calculadora:', err);
    } finally {
      setLoadingRecetas(false);
    }
  };

  const loadCosto = async (id) => {
    setLoadingCosto(true);
    try {
      const res = await apiClient.get(ENDPOINTS.RECETA_SIMULAR_COSTO(id));
      setCostoData(res.data?.data || res.data);
    } catch {
      setCostoData(null);
    } finally {
      setLoadingCosto(false);
    }
  };

  const selectedReceta = recetas.find(
    (r) => String(r.id_receta) === String(selectedRecetaId),
  );

  const MARGIN_PRESETS = [15, 20, 25, 30, 35, 40, 50, 60];

  // Cálculos reactivos homologados con app.js web
  const costoU = parseFloat(costoData?.costoProduccion?.USD || 0);
  const factorMargen = 1 + margin / 100;
  const precioU = costoU * factorMargen;
  const precioMinU = parseFloat(costoData?.precioMinimoRecomendado?.USD || precioU);
  const precioSugU = parseFloat(costoData?.precioSugerido?.USD || precioU);
  const ingresoTotal = precioU * qty;
  const gananciaPorcion = precioU - costoU;

  return (
    <SheetModal visible={visible} onClose={onClose} title="Calculadora de Precios">
      {loadingRecetas ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando catálogo...</Text>
        </View>
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {/* Selector de Receta */}
          <Text style={styles.fieldLabel}>Receta a Simular</Text>
          <TouchableOpacity
            style={styles.recetaSelector}
            onPress={() => setShowSelector(!showSelector)}
            activeOpacity={0.7}
          >
            <View style={styles.recetaSelectorLeft}>
              <MaterialIcons name="cake" size={20} color={colors.primary} />
              <Text style={styles.recetaSelectorText}>
                {selectedReceta?.nombre_receta || 'Selecciona una receta'}
              </Text>
            </View>
            <MaterialIcons
              name={showSelector ? 'expand-less' : 'expand-more'}
              size={22}
              color={colors.outline}
            />
          </TouchableOpacity>

          {showSelector && (
            <View style={styles.dropdownList}>
              {recetas.map((r) => (
                <TouchableOpacity
                  key={r.id_receta}
                  style={[
                    styles.dropdownItem,
                    r.id_receta === selectedRecetaId && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setSelectedRecetaId(r.id_receta);
                    setShowSelector(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      r.id_receta === selectedRecetaId && styles.dropdownItemTextActive,
                    ]}
                  >
                    {r.nombre_receta}
                  </Text>
                  {r.id_receta === selectedRecetaId && (
                    <MaterialIcons name="check" size={16} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Stepper de Cantidad */}
          <View style={styles.stepperContainer}>
            <View>
              <Text style={styles.stepperLabel}>Cantidad a Producir</Text>
              <Text style={styles.stepperSub}>Porciones o unidades</Text>
            </View>
            <View style={styles.stepperControls}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setQty(Math.max(1, qty - 1))}
              >
                <Text style={styles.stepperBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{qty}</Text>
              <TouchableOpacity
                style={[styles.stepperBtn, styles.stepperBtnPlus]}
                onPress={() => setQty(qty + 1)}
              >
                <Text style={styles.stepperBtnPlusText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Margen de Ganancia */}
          <View style={styles.marginContainer}>
            <View style={styles.marginHeader}>
              <Text style={styles.marginLabel}>Margen de Ganancia</Text>
              <Text style={styles.marginActiveBadge}>{margin}%</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.marginScroll}>
              {MARGIN_PRESETS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.marginPill, margin === m && styles.marginPillActive]}
                  onPress={() => setMargin(m)}
                >
                  <Text
                    style={[
                      styles.marginPillText,
                      margin === m && styles.marginPillTextActive,
                    ]}
                  >
                    {m}%
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Resultados de cálculo */}
          {loadingCosto ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Calculando precios con lotes recientes...</Text>
            </View>
          ) : !costoData?.costoProduccion ? (
            <View style={styles.emptyBox}>
              <MaterialIcons name="info" size={24} color={colors.outline} />
              <Text style={styles.emptyBoxText}>
                Esta receta aún no tiene lotes con precio de compra registrados.
              </Text>
            </View>
          ) : (
            <View style={styles.cardResult}>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Costo por porción</Text>
                <Text style={styles.resultValue}>{formatDual(costoU)}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>
                  Costo de producir {qty} {qty === 1 ? 'porción' : 'porciones'}
                </Text>
                <Text style={styles.resultValue}>{formatDual(costoU * qty)}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Precio mín. recomendado (20%)</Text>
                <Text style={styles.resultValue}>{formatDual(precioMinU)}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Precio sugerido estándar (35%)</Text>
                <Text style={styles.resultValue}>{formatDual(precioSugU)}</Text>
              </View>
              <View style={[styles.resultRow, styles.resultRowHighlight]}>
                <Text style={[styles.resultLabel, styles.resultLabelHighlight]}>
                  Tu precio unitario ({margin}% margen)
                </Text>
                <Text style={[styles.resultValue, styles.resultValueHighlight]}>
                  {formatDual(precioU)}
                </Text>
              </View>
              <View style={[styles.resultRow, styles.resultRowHighlight]}>
                <Text style={[styles.resultLabel, styles.resultLabelHighlight]}>
                  Ingreso total ({qty} unidades)
                </Text>
                <Text style={[styles.resultValue, styles.resultValueHighlight]}>
                  {formatDual(ingresoTotal)}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Ganancia neta estimada por porción</Text>
                <Text style={[styles.resultValue, { color: '#2e7d32' }]}>
                  {formatDual(gananciaPorcion)}
                </Text>
              </View>

              <Text style={styles.footerCaption}>
                Basado en precios de compra de lotes recientes. Tasa BCV: {tasa || '—'} Bs/USD.
              </Text>
            </View>
          )}

          <Button
            title="Cerrar Calculadora"
            variant="primary"
            onPress={onClose}
            style={{ marginTop: spacing.md }}
          />
        </ScrollView>
      )}
    </SheetModal>
  );
};

const styles = StyleSheet.create({
  container: { maxHeight: 540 },
  content: { paddingBottom: spacing.xl, gap: spacing.sm },
  centerBox: { padding: spacing.xl, alignItems: 'center', gap: 8 },
  loadingText: { ...typography.bodySm, color: colors.onSurfaceVariant },
  fieldLabel: { ...typography.labelBold, fontSize: 12, color: colors.onSurfaceVariant, textTransform: 'uppercase' },
  recetaSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  recetaSelectorLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  recetaSelectorText: { ...typography.bodyMd, fontWeight: '600', color: colors.onSurface },
  dropdownList: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    maxHeight: 180,
    marginTop: 2,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  dropdownItemActive: { backgroundColor: `${colors.primaryContainer}20` },
  dropdownItemText: { ...typography.bodySm, color: colors.onSurface },
  dropdownItemTextActive: { fontWeight: '700', color: colors.primary },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginVertical: 4,
  },
  stepperLabel: { ...typography.labelBold, color: colors.onSurface, fontSize: 13 },
  stepperSub: { ...typography.metadata, color: colors.onSurfaceVariant, fontSize: 11 },
  stepperControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceContainerHighest,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnText: { fontSize: 18, fontWeight: '700', color: colors.onSurface },
  stepperBtnPlus: { backgroundColor: colors.primaryContainer },
  stepperBtnPlusText: { fontSize: 18, fontWeight: '700', color: colors.onPrimaryContainer },
  stepperValue: { ...typography.headlineMd, minWidth: 28, textAlign: 'center', fontSize: 18 },
  marginContainer: { gap: 6, marginVertical: 4 },
  marginHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  marginLabel: { ...typography.labelBold, color: colors.onSurfaceVariant, fontSize: 12, textTransform: 'uppercase' },
  marginActiveBadge: {
    ...typography.labelBold,
    color: colors.primary,
    backgroundColor: `${colors.primaryContainer}40`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    fontSize: 12,
  },
  marginScroll: { flexDirection: 'row', gap: 6, paddingVertical: 4 },
  marginPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    marginRight: 6,
  },
  marginPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  marginPillText: { ...typography.labelCaption, color: colors.onSurface, fontWeight: '600' },
  marginPillTextActive: { color: colors.white },
  emptyBox: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.lg,
  },
  emptyBoxText: { ...typography.bodySm, color: colors.onSurfaceVariant, textAlign: 'center' },
  cardResult: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceVariant,
    gap: 6,
    marginTop: 4,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceVariant,
  },
  resultRowHighlight: {
    backgroundColor: `${colors.primaryContainer}20`,
    paddingHorizontal: 8,
    borderRadius: borderRadius.md,
    borderBottomWidth: 0,
  },
  resultLabel: { ...typography.bodySm, color: colors.onSurfaceVariant, fontSize: 12, flex: 1 },
  resultLabelHighlight: { fontWeight: '700', color: colors.onSurface },
  resultValue: { ...typography.labelBold, color: colors.onSurface, fontSize: 13 },
  resultValueHighlight: { color: colors.primary, fontWeight: '700' },
  footerCaption: {
    ...typography.metadata,
    color: colors.onSurfaceVariant,
    fontSize: 10,
    marginTop: 6,
    textAlign: 'center',
  },
});
