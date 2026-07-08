import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Button, Card } from '../../components/ui';
import { CenterModal } from '../../components/ui/Modal';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';

export const SeguridadScreen = ({ navigation }) => {
  const [showSuccess, setShowSuccess] = useState(false);

  const handleUpdate = () => {
    setShowSuccess(true);
  };

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.logoArea}>
            <Text style={styles.logoEmoji}>🧁</Text>
            <Text style={styles.logoText}>PanQueo</Text>
          </View>
        </View>

        <View style={styles.pageHeader}>
          <Text style={styles.title}>Seguridad</Text>
          <Text style={styles.subtitle}>Administra el acceso y protección de tu cuenta</Text>
        </View>

        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🔑</Text>
            <Text style={styles.sectionTitle}>Cambiar contraseña</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Contraseña actual</Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputIcon}>🔑</Text>
              <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#757575" secureTextEntry />
              <TouchableOpacity>
                <Text style={styles.visibilityIcon}>👁️</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.underline} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Nueva contraseña</Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput style={styles.input} placeholder="Mínimo 8 caracteres" placeholderTextColor="#757575" secureTextEntry />
              <View style={styles.rewardChip}>
                <Text style={styles.rewardChipText}>Sprinkle Reward</Text>
              </View>
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
              <Text style={styles.inputIcon}>✅</Text>
              <TextInput style={styles.input} placeholder="Repite tu nueva contraseña" placeholderTextColor="#757575" secureTextEntry />
            </View>
            <View style={styles.underline} />
          </View>

          <Button title="Actualizar Contraseña" variant="primary" onPress={handleUpdate} />
        </Card>

        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionIcon}>📱</Text>
              <Text style={styles.sectionTitle}>Sesiones activas</Text>
            </View>
            <View style={styles.deviceCount}>
              <Text style={styles.deviceCountText}>Dispositivos: 2</Text>
            </View>
          </View>

          <View style={styles.deviceItem}>
            <Text style={styles.deviceIcon}>💻</Text>
            <View style={styles.deviceInfo}>
              <View style={styles.deviceNameRow}>
                <Text style={styles.deviceName}>Chrome (Windows)</Text>
                <View style={styles.currentSession}>
                  <Text style={styles.currentSessionText}>Esta sesión</Text>
                </View>
              </View>
              <Text style={styles.deviceMeta}>Último acceso: hoy 14:00</Text>
              <Text style={styles.deviceIp}>IP: 192.168.1.45</Text>
            </View>
          </View>

          <View style={styles.deviceItem}>
            <Text style={styles.deviceIcon}>📱</Text>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>App PanQueo (iPhone)</Text>
              <Text style={styles.deviceMeta}>Último acceso: ayer 23:15</Text>
              <Text style={styles.deviceIp}>IP: 85.12.190.22</Text>
            </View>
            <TouchableOpacity style={styles.logoutDevice}>
              <Text style={styles.logoutDeviceIcon}>🚪</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.logoutAll}>
            <Text style={styles.logoutAllText}>Cerrar sesión en todos los dispositivos</Text>
          </TouchableOpacity>
        </Card>

        <View style={styles.twoFA}>
          <View style={styles.twoFAIcon}>
            <Text style={styles.twoFAEmoji}>✅</Text>
          </View>
          <View style={styles.twoFAInfo}>
            <Text style={styles.twoFATitle}>Doble Seguridad</Text>
            <Text style={styles.twoFADesc}>Activa la verificación en dos pasos para proteger aún más tus datos.</Text>
            <TouchableOpacity>
              <Text style={styles.twoFALink}>Configurar ahora →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <CenterModal visible={showSuccess} onClose={() => setShowSuccess(false)} title="✓ Contraseña actualizada">
        <Text style={styles.successDesc}>Tu contraseña se ha cambiado exitosamente.</Text>
        <Button title="Listo" variant="primary" onPress={() => setShowSuccess(false)} style={{ marginTop: spacing.md }} />
      </CenterModal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 40, gap: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: {},
  backIcon: { fontSize: 24, color: colors.onSurface },
  logoArea: { flexDirection: 'row', alignItems: 'center', gap: spacing.base },
  logoEmoji: { fontSize: 20 },
  logoText: { ...typography.displayLgMobile, fontSize: 20, color: colors.primary },
  pageHeader: { gap: spacing.xs },
  title: { ...typography.headlineMd, color: colors.onSurface, textAlign: 'center' },
  subtitle: { ...typography.bodySm, color: colors.onSurfaceVariant, textAlign: 'center' },
  section: { gap: spacing.lg, padding: spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, justifyContent: 'space-between' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionIcon: { fontSize: 20 },
  sectionTitle: { ...typography.titleSm },
  field: { gap: spacing.xs },
  label: { ...typography.labelBold, color: colors.outline },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.base },
  inputIcon: { fontSize: 18, color: '#757575' },
  input: { flex: 1, ...typography.bodyMd, color: colors.onSurface, paddingVertical: spacing.base },
  visibilityIcon: { fontSize: 18, color: '#757575' },
  underline: { height: 1, backgroundColor: colors.outlineVariant },
  rewardChip: { backgroundColor: '#FFF8E1', paddingHorizontal: spacing.base, paddingVertical: 2, borderRadius: 999 },
  rewardChipText: { fontSize: 10, fontWeight: '700', color: colors.primaryContainer, textTransform: 'uppercase' },
  strengthBar: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  strengthSeg: { flex: 1, height: 4, borderRadius: 2 },
  strengthText: { ...typography.bodySm, color: colors.primary, marginTop: spacing.xs },
  deviceCount: { backgroundColor: '#FFF8E1', paddingHorizontal: spacing.base, paddingVertical: spacing.xs, borderRadius: borderRadius.lg },
  deviceCountText: { ...typography.labelBold, fontSize: 12, color: colors.primaryContainer },
  deviceItem: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.md, backgroundColor: colors.surfaceContainerLow, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.outlineVariant },
  deviceIcon: { fontSize: 24, marginTop: spacing.xs },
  deviceInfo: { flex: 1 },
  deviceNameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  deviceName: { ...typography.labelBold, color: colors.onSurface },
  currentSession: { backgroundColor: `${colors.tertiaryContainer}4D`, paddingHorizontal: spacing.base, paddingVertical: 1, borderRadius: 999 },
  currentSessionText: { fontSize: 10, fontWeight: '700', color: colors.tertiary, textTransform: 'uppercase' },
  deviceMeta: { ...typography.bodySm, color: colors.onSurfaceVariant },
  deviceIp: { fontSize: 12, color: colors.outline, marginTop: spacing.xs },
  logoutDevice: { padding: spacing.xs },
  logoutDeviceIcon: { fontSize: 18, color: colors.error },
  logoutAll: { paddingVertical: spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.error, borderRadius: borderRadius.lg, marginTop: spacing.md },
  logoutAllText: { ...typography.buttonText, color: colors.error },
  twoFA: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.lg, borderRadius: borderRadius.xl, backgroundColor: colors.secondaryContainer, borderWidth: 1, borderColor: colors.outlineVariant },
  twoFAIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surfaceContainerLowest, alignItems: 'center', justifyContent: 'center' },
  twoFAEmoji: { fontSize: 32 },
  twoFAInfo: { flex: 1 },
  twoFATitle: { ...typography.titleSm, color: colors.onSecondaryContainer },
  twoFADesc: { ...typography.bodySm, color: colors.onSurfaceVariant },
  twoFALink: { ...typography.labelBold, color: colors.primary, marginTop: spacing.xs },
  successDesc: { ...typography.bodyMd, color: colors.onSurfaceVariant, textAlign: 'center' },
});
