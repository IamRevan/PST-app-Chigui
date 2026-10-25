import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Button, Card } from '../../components/ui';
import { CenterModal } from '../../components/ui/Modal';
import { colors, typography, spacing, borderRadius } from '../../lib/theme';

export const SeguridadScreen = ({ navigation }) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleUpdate = () => {
    setShowSuccess(true);
  };

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Seguridad y Acceso</Text>
          <View style={{ width: 44 }} />
        </View>

        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="lock-reset" size={22} color={colors.primary} />
            <Text style={styles.sectionTitle}>Cambiar contraseña</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Contraseña actual</Text>
            <View style={styles.inputRow}>
              <MaterialIcons name="lock-outline" size={20} color={colors.outline} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.outline}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <MaterialIcons name={showPass ? 'visibility-off' : 'visibility'} size={20} color={colors.outline} />
              </TouchableOpacity>
            </View>
            <View style={styles.underline} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nueva contraseña</Text>
            <View style={styles.inputRow}>
              <MaterialIcons name="vpn-key" size={20} color={colors.outline} />
              <TextInput
                style={styles.input}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor={colors.outline}
                secureTextEntry={!showPass}
              />
            </View>
            <View style={styles.underline} />
            <View style={styles.strengthBar}>
              <View style={[styles.strengthSeg, { backgroundColor: colors.primaryContainer }]} />
              <View style={[styles.strengthSeg, { backgroundColor: colors.primaryContainer }]} />
              <View style={[styles.strengthSeg, { backgroundColor: colors.surfaceContainerHigh }]} />
              <View style={[styles.strengthSeg, { backgroundColor: colors.surfaceContainerHigh }]} />
            </View>
            <Text style={styles.strengthText}>Seguridad: Media</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirmar contraseña</Text>
            <View style={styles.inputRow}>
              <MaterialIcons name="check-circle-outline" size={20} color={colors.outline} />
              <TextInput
                style={styles.input}
                placeholder="Repite tu nueva contraseña"
                placeholderTextColor={colors.outline}
                secureTextEntry={!showPass}
              />
            </View>
            <View style={styles.underline} />
          </View>

          <Button title="Actualizar Contraseña" variant="primary" onPress={handleUpdate} />
        </Card>

        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="devices" size={22} color={colors.primary} />
            <Text style={styles.sectionTitle}>Sesiones activas</Text>
          </View>

          <View style={styles.deviceItem}>
            <MaterialIcons name="computer" size={24} color={colors.primary} />
            <View style={styles.deviceInfo}>
              <View style={styles.deviceNameRow}>
                <Text style={styles.deviceName}>Navegador Web</Text>
                <View style={styles.currentSession}>
                  <Text style={styles.currentSessionText}>Activa</Text>
                </View>
              </View>
              <Text style={styles.deviceMeta}>Panel de Administración</Text>
            </View>
          </View>

          <View style={styles.deviceItem}>
            <MaterialIcons name="smartphone" size={24} color={colors.primary} />
            <View style={styles.deviceInfo}>
              <View style={styles.deviceNameRow}>
                <Text style={styles.deviceName}>App Móvil PanQueo</Text>
                <View style={styles.currentSession}>
                  <Text style={styles.currentSessionText}>Este dispositivo</Text>
                </View>
              </View>
              <Text style={styles.deviceMeta}>Expo SDK 58</Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      <CenterModal visible={showSuccess} onClose={() => setShowSuccess(false)} title="Contraseña actualizada">
        <Text style={styles.successDesc}>Tu contraseña se ha cambiado exitosamente.</Text>
        <Button title="Listo" variant="primary" onPress={() => setShowSuccess(false)} style={{ marginTop: spacing.md }} />
      </CenterModal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 40, gap: spacing.md },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: { ...typography.titleSm, color: colors.onSurface },
  section: { gap: spacing.md, padding: spacing.lg },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle: { ...typography.titleSm, color: colors.onSurface },
  field: { gap: spacing.xs },
  label: { ...typography.labelBold, color: colors.onSurfaceVariant },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.base },
  input: { flex: 1, ...typography.bodyMd, color: colors.onSurface, paddingVertical: spacing.sm },
  underline: { height: 1, backgroundColor: colors.outlineVariant },
  strengthBar: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  strengthSeg: { flex: 1, height: 4, borderRadius: 2 },
  strengthText: { ...typography.bodySm, color: colors.primary, marginTop: spacing.xs },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  deviceInfo: { flex: 1 },
  deviceNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  deviceName: { ...typography.labelBold, color: colors.onSurface },
  currentSession: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: 999,
  },
  currentSessionText: { fontSize: 10, fontWeight: '700', color: colors.onPrimaryContainer, textTransform: 'uppercase' },
  deviceMeta: { ...typography.bodySm, color: colors.onSurfaceVariant, marginTop: 2 },
  successDesc: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },
});
