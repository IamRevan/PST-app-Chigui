import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Card, Badge, Button } from '../../components/ui';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';

const MOCK_RECIPES = [
  { id: 1, nombre: 'Pastel de Tres Leches', ingredientes: 8, rendimiento: '1 unidad', tiempo: '45 min' },
  { id: 2, nombre: 'Docena de Empanadas', ingredientes: 6, rendimiento: '12 unidades', tiempo: '30 min' },
  { id: 3, nombre: 'Torta de Chocolate', ingredientes: 7, rendimiento: '1 unidad', tiempo: '60 min' },
];

export const RecipesScreen = () => {
  const navigation = useNavigation();
  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Recetas</Text>
          <Button title="+ Nueva" variant="primary" onPress={() => navigation.navigate('NuevaReceta')} />
        </View>

        {MOCK_RECIPES.map((recipe) => (
          <Card key={recipe.id} style={styles.recipeCard}>
            <Text style={styles.recipeName}>{recipe.nombre}</Text>
            <View style={styles.recipeMeta}>
              <Badge label={`${recipe.ingredientes} ingredientes`} variant="default" />
              <Badge label={recipe.rendimiento} variant="success" />
              <Badge label={recipe.tiempo} variant="warning" />
            </View>
          </Card>
        ))}
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  title: { ...typography.headlineMd, color: colors.onSurface },
  recipeCard: { marginBottom: spacing.sm, gap: spacing.sm },
  recipeName: { ...typography.productTitle, color: colors.onSurface },
  recipeMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
