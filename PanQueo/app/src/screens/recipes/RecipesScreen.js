import { View, Text, StyleSheet, ScrollView } from "react-native";
import { ScreenWrapper } from "../../components/navigation/ScreenWrapper";
import { Card, Badge, Button } from "../../components/ui";
import { useNavigation } from "@react-navigation/native";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from "../../lib/theme";
import { useRecetas } from "../../lib/hooks/useRecetas";

export const RecipesScreen = () => {
  const navigation = useNavigation();
  const { data: recetas, loading } = useRecetas();

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Recetas</Text>
          <Button
            title="+ Nueva"
            variant="primary"
            onPress={() => navigation.navigate("NuevaReceta")}
          />
        </View>

        {loading && (
          <Text style={{ textAlign: "center", padding: 20 }}>
            Cargando recetas...
          </Text>
        )}

        {!loading &&
          recetas &&
          recetas.map((recipe) => (
            <Card key={recipe.id_receta} style={styles.recipeCard}>
              <Text style={styles.recipeName}>{recipe.nombre_receta}</Text>
              <View style={styles.recipeMeta}>
                <Badge
                  label={`${recipe.RecetaIngredientes?.length || 0} ingredientes`}
                  variant="default"
                />
                <Badge
                  label={recipe.rendimiento || "Variado"}
                  variant="success"
                />
                <Badge
                  label={`$${recipe.precio_sugerido || "0.00"}`}
                  variant="warning"
                />
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: { ...typography.headlineMd, color: colors.onSurface },
  recipeCard: { marginBottom: spacing.sm, gap: spacing.sm },
  recipeName: { ...typography.productTitle, color: colors.onSurface },
  recipeMeta: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
