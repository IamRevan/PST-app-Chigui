import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Card, Badge, Button } from '../../components/ui';
import { useNavigation } from '@react-navigation/native';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../../lib/theme';
import { useRecetas } from '../../lib/hooks/useRecetas';
import { useCurrency } from '../../lib/currency';
import { RecetaDetalleModal } from './RecetaDetalleModal';
import { CalculadoraModal } from './CalculadoraModal';

export const RecipesScreen = () => {
  const navigation = useNavigation();
  const { data: rawRecetas, loading, refetch } = useRecetas();
  const { format } = useCurrency();
  const recetas = Array.isArray(rawRecetas) ? rawRecetas : (rawRecetas?.recetas || []);

  const [selectedRecetaId, setSelectedRecetaId] = useState(null);
  const [showDetalle, setShowDetalle] = useState(false);
  const [showCalculadora, setShowCalculadora] = useState(false);

  const handleOpenReceta = (id) => {
    setSelectedRecetaId(id);
    setShowDetalle(true);
  };

  const handleOpenCalculadora = (id = null) => {
    setSelectedRecetaId(id);
    setShowCalculadora(true);
  };

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
            </TouchableOpacity>
            <View>
              <Text style={styles.title}>Recetas</Text>
              <Text style={styles.subtitle}>Catálogo de fórmulas y costos</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.calcBtn}
              onPress={() => handleOpenCalculadora(null)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="calculate" size={18} color={colors.primary} />
              <Text style={styles.calcBtnText}>Calculadora</Text>
            </TouchableOpacity>
            <Button
              title="+ Nueva"
              variant="primary"
              onPress={() => navigation.navigate('NuevaReceta')}
            />
          </View>
        </View>

        {loading && (
          <Text style={styles.loadingText}>Cargando catálogo de recetas...</Text>
        )}

        {!loading && recetas.length === 0 && (
          <View style={styles.emptyCard}>
            <MaterialIcons name="bakery-dining" size={48} color={colors.outline} />
            <Text style={styles.emptyTitle}>Sin recetas registradas</Text>
            <Text style={styles.emptyDesc}>Crea una receta con sus ingredientes para calcular costos.</Text>
            <Button
              title="Registrar Primera Receta"
              variant="primary"
              onPress={() => navigation.navigate('NuevaReceta')}
              style={{ marginTop: spacing.md }}
            />
          </View>
        )}

        {!loading &&
          recetas.map((recipe) => {
            const numIngs =
              recipe.RecetaIngredientes?.length || recipe.Ingredientes?.length || 0;
            return (
              <TouchableOpacity
                key={recipe.id_receta}
                activeOpacity={0.7}
                onPress={() => handleOpenReceta(recipe.id_receta)}
              >
                <Card style={styles.recipeCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.iconBox}>
                      <MaterialIcons name="cake" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.recipeName}>{recipe.nombre_receta}</Text>
                      <Text style={styles.recipeDesc} numberOfLines={1}>
                        {recipe.instrucciones || recipe.descripcion || 'Sin instrucciones adicionales'}
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={22} color={colors.outline} />
                  </View>

                  <View style={styles.recipeMeta}>
                    <Badge
                      label={`${numIngs} ingredientes`}
                      variant={numIngs > 0 ? 'default' : 'critical'}
                    />
                    <Badge
                      label={recipe.rendimiento || '1 porción'}
                      variant="success"
                    />
                    <Badge
                      label={format(recipe.precio_sugerido || 0)}
                      variant="warning"
                    />
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
      </ScrollView>

      {/* Modales de detalle y calculadora */}
      <RecetaDetalleModal
        visible={showDetalle}
        onClose={() => setShowDetalle(false)}
        recetaId={selectedRecetaId}
        onOpenCalculadora={(id) => handleOpenCalculadora(id)}
      />

      <CalculadoraModal
        visible={showCalculadora}
        onClose={() => setShowCalculadora(false)}
        initialRecetaId={selectedRecetaId}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 40, gap: spacing.sm },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    paddingTop: 4,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: { ...typography.headlineMd, color: colors.onSurface, fontSize: 22 },
  subtitle: { ...typography.metadata, color: colors.onSurfaceVariant, marginTop: -2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  calcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.metricBg1,
    borderWidth: 1,
    borderColor: colors.metricBorder1,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: borderRadius.md,
  },
  calcBtnText: { ...typography.labelBold, color: colors.primary, fontSize: 13 },
  recipeCard: { marginBottom: spacing.xs, gap: spacing.sm, padding: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: `${colors.primaryContainer}30`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: { flex: 1 },
  recipeName: { ...typography.productTitle, color: colors.onSurface },
  recipeDesc: { ...typography.metadata, color: colors.onSurfaceVariant, fontSize: 12 },
  recipeMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  loadingText: { textAlign: 'center', padding: 20, color: colors.onSurfaceVariant },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  emptyTitle: { ...typography.titleSm, color: colors.onSurface, marginTop: spacing.sm },
  emptyDesc: { ...typography.bodySm, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 },
});
