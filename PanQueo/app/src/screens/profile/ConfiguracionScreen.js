import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Button, Card } from '../../components/ui';
import { CenterModal } from '../../components/ui/Modal';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';

export const ConfiguracionScreen = ({ navigation }) => {
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = () => {
    setShowSuccess(true);
  };

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Configuración</Text>
        <Text style={styles.subtitle}>Personaliza tu experiencia en PanQueo</Text>

        <Card style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Moneda predeterminada</Text>
            <TouchableOpacity style={styles.select}>
              <Text style={styles.selectText}>Bs (Bolívares)</Text>
              <Text style={styles.selectArrow}>▼</Text>
            </TouchableOpacity>
            <View style={styles.underline} />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Notificaciones push</Text>
              <Text style={styles.toggleDesc}>Recibir alertas de tus pedidos</Text>
            </View>
            <View style={styles.toggleTrack}>
              <View style={styles.toggleThumb} />
            </View>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleLabel}>Modo visual</Text>
              <Text style={styles.toggleDesc}>Modo claro seleccionado</Text>
            </View>
            <View style={styles.modeSwitch}>
              <View style={[styles.modeBtn, styles.modeBtnActive]}>
                <Text style={[styles.modeBtnText, styles.modeBtnTextActive]}>☀️</Text>
                <Text style={[styles.modeBtnLabel, styles.modeBtnLabelActive]}>Claro</Text>
              </View>
              <View style={styles.modeBtn}>
                <Text style={styles.modeBtnText}>🌙</Text>
                <Text style={styles.modeBtnLabel}>Oscuro</Text>
              </View>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Idioma</Text>
            <TouchableOpacity style={styles.select}>
              <Text style={styles.selectText}>Español</Text>
              <Text style={styles.selectArrow}>🌐</Text>
            </TouchableOpacity>
            <View style={styles.underline} />
          </View>

          <View style={styles.rewardBanner}>
            <Text style={styles.rewardIcon}>⭐</Text>
            <View>
              <Text style={styles.rewardTitle}>Nivel Repostería Gold</Text>
              <Text style={styles.rewardDesc}>¡Tus ajustes ayudan a mejorar tus sugerencias!</Text>
            </View>
          </View>

          <Button title="Guardar Configuración" variant="primary" onPress={handleSave} style={styles.saveBtn} />
        </Card>

        <Text style={styles.footnote}>Toda tu información está cifrada y protegida.</Text>
      </ScrollView>

      <CenterModal visible={showSuccess} onClose={() => setShowSuccess(false)} title="✓ Configuración guardada">
        <Text style={styles.successDesc}>Tus cambios se han aplicado correctamente.</Text>
        <Button title="Listo" variant="primary" onPress={() => setShowSuccess(false)} style={{ marginTop: spacing.md }} />
      </CenterModal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 40, gap: spacing.md },
  backBtn: { marginBottom: spacing.xs },
  backIcon: { fontSize: 24, color: colors.onSurface },
  title: { ...typography.headlineMd, color: colors.onSurface },
  subtitle: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: -spacing.sm },
  card: { gap: spacing.xl, padding: spacing.xl },
  field: { gap: spacing.xs },
  label: { ...typography.labelBold, color: colors.onSurfaceVariant },
  select: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.base },
  selectText: { ...typography.bodyMd, color: colors.onSurface },
  selectArrow: { fontSize: 12, color: colors.outline },
  underline: { height: 1, backgroundColor: colors.outlineVariant },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.base },
  toggleInfo: { gap: spacing.xs },
  toggleLabel: { ...typography.bodyMd, fontWeight: '600', color: colors.onSurface },
  toggleDesc: { ...typography.bodySm, color: colors.onSurfaceVariant },
  toggleTrack: { width: 48, height: 24, backgroundColor: colors.surfaceContainerHigh, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 2 },
  toggleThumb: { width: 20, height: 20, backgroundColor: colors.surfaceContainerLowest, borderRadius: 10, alignSelf: 'flex-end', ...shadows.sm },
  modeSwitch: { flexDirection: 'row', backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.lg, padding: spacing.xs },
  modeBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.md },
  modeBtnActive: { backgroundColor: colors.surfaceContainerLowest, ...shadows.sm },
  modeBtnText: { fontSize: 16 },
  modeBtnLabel: { ...typography.labelBold, fontSize: 12, color: colors.onSurfaceVariant },
  modeBtnTextActive: {},
  modeBtnLabelActive: { color: colors.primary },
  rewardBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: '#FFF8E1', padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: '#FFECB3' },
  rewardIcon: { fontSize: 24 },
  rewardTitle: { ...typography.labelBold, color: colors.primary },
  rewardDesc: { ...typography.bodySm, color: colors.onSurfaceVariant },
  saveBtn: { marginTop: spacing.md },
  footnote: { ...typography.bodySm, color: colors.onSurfaceVariant, textAlign: 'center' },
  successDesc: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },
});
