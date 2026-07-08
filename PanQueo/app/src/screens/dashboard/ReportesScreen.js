import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ScreenWrapper } from '../../components/navigation/ScreenWrapper';
import { Button } from '../../components/ui';
import { SheetModal, CenterModal } from '../../components/ui/Modal';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';

const RANGOS = ['Últimos 7 días', 'Últimos 30 días', 'Este mes', 'Mes pasado', 'Personalizado'];

export const ReportesScreen = ({ navigation }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDownload, setShowDownload] = useState(false);
  const [selectedRange, setSelectedRange] = useState('Últimos 7 días');

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.logoArea}>
            <Text style={styles.logoEmoji}>🧁</Text>
            <Text style={styles.logoText}>PanQueo</Text>
          </View>
        </View>

        <Text style={styles.title}>Reportes</Text>

        <TouchableOpacity style={styles.datePicker} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateIcon}>📅</Text>
          <Text style={styles.dateText}>{selectedRange}</Text>
          <Text style={styles.dateChange}>Cambiar ▼</Text>
        </TouchableOpacity>

        <View style={styles.revenueCard}>
          <Text style={styles.revenueLabel}>Ingresos Totales</Text>
          <Text style={styles.revenueValue}>$12,450.00</Text>
          <View style={styles.revenueTrend}>
            <Text style={styles.trendIcon}>📈</Text>
            <Text style={styles.trendText}>+12.5% vs mes anterior</Text>
          </View>
        </View>

        <View style={styles.miniRow}>
          <View style={styles.miniCard}>
            <Text style={styles.miniLabel}>Ticket Promedio</Text>
            <Text style={styles.miniValue}>$245.50</Text>
          </View>
          <View style={styles.miniCard}>
            <Text style={styles.miniLabel}>Nuevos Clientes</Text>
            <Text style={styles.miniValue}>84</Text>
            <View style={styles.miniBadge}>
              <Text style={styles.miniBadgeText}>+5%</Text>
            </View>
          </View>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Ingresos Semanales</Text>
            <Text style={styles.chartInfo}>ℹ️</Text>
          </View>
          <View style={styles.bars}>
            {[{ day: 'L', h: 60 }, { day: 'M', h: 45 }, { day: 'M', h: 85 }, { day: 'J', h: 70 }, { day: 'V', h: 100 }, { day: 'S', h: 90 }, { day: 'D', h: 40 }].map((b, i) => (
              <View key={i} style={styles.barCol}>
                <View style={[styles.bar, { height: `${b.h}%` }, i >= 4 && { backgroundColor: colors.primaryContainer }]} />
                <Text style={styles.barLabel}>{b.day}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Ventas por Categoría</Text>
          <View style={styles.pieRow}>
            <View style={styles.pie}>
              <View style={[styles.pieSeg, { backgroundColor: colors.primaryContainer, transform: [{ rotate: '0deg' }] }]} />
            </View>
            <View style={styles.legend}>
              {[
                { color: colors.primaryContainer, label: 'Cupcakes', pct: '55%' },
                { color: colors.primary, label: 'Pasteles', pct: '25%' },
                { color: colors.secondaryContainer, label: 'Galletas', pct: '20%' },
              ].map((item, i) => (
                <View key={i} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendLabel}>{item.label}</Text>
                  <Text style={styles.legendPct}>{item.pct}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <Button title="Descargar PDF" variant="primary" onPress={() => setShowDownload(true)} style={styles.downloadBtn} />
      </ScrollView>

      <SheetModal visible={showDatePicker} onClose={() => setShowDatePicker(false)} title="Seleccionar período">
        {RANGOS.map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.rangeItem, selectedRange === r && styles.rangeItemActive]}
            onPress={() => { setSelectedRange(r); setShowDatePicker(false); }}
          >
            <Text style={[styles.rangeText, selectedRange === r && styles.rangeTextActive]}>
              {selectedRange === r ? '● ' : '○ '}{r}
            </Text>
          </TouchableOpacity>
        ))}
      </SheetModal>

      <CenterModal visible={showDownload} onClose={() => setShowDownload(false)} title="Descargar Reporte">
        <Text style={styles.downloadDesc}>Se generará un archivo PDF con los reportes del período seleccionado.</Text>
        <View style={styles.downloadFormats}>
          {['PDF', 'Excel', 'CSV'].map((fmt) => (
            <TouchableOpacity key={fmt} style={styles.formatBtn}>
              <Text style={styles.formatBtnText}>{fmt}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Button title="Descargar" variant="primary" onPress={() => { setShowDownload(false); Alert.alert('Descarga', 'Reporte descargado exitosamente'); }} style={{ marginTop: spacing.md }} />
      </CenterModal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.gutter, paddingBottom: 40, gap: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backIcon: { fontSize: 24, color: colors.onSurface },
  logoArea: { flexDirection: 'row', alignItems: 'center', gap: spacing.base },
  logoEmoji: { fontSize: 20 },
  logoText: { ...typography.displayLgMobile, fontSize: 20, color: colors.primary },
  title: { ...typography.headlineMd, color: colors.onSurface },
  datePicker: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainerLow, padding: spacing.sm, borderRadius: borderRadius.xl, borderWidth: 1, borderColor: colors.outlineVariant, gap: spacing.xs },
  dateIcon: { fontSize: 16 },
  dateText: { ...typography.bodySm, color: colors.onSurfaceVariant, flex: 1 },
  dateChange: { ...typography.labelBold, color: colors.primary },
  revenueCard: { backgroundColor: colors.surfaceContainerLowest, padding: spacing.lg, borderRadius: borderRadius.xl, ...shadows.md, borderWidth: 1, borderColor: `${colors.outlineVariant}80`, gap: spacing.xs },
  revenueLabel: { ...typography.labelBold, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },
  revenueValue: { fontSize: 32, fontWeight: '700', color: colors.onSurface },
  revenueTrend: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  trendIcon: { fontSize: 16 },
  trendText: { ...typography.bodySm, color: colors.tertiary, fontWeight: '600' },
  miniRow: { flexDirection: 'row', gap: spacing.md },
  miniCard: { flex: 1, backgroundColor: colors.surfaceContainerLowest, padding: spacing.md, borderRadius: borderRadius.xl, ...shadows.md, borderWidth: 1, borderColor: `${colors.outlineVariant}80`, gap: spacing.xs },
  miniLabel: { ...typography.labelBold, color: colors.onSurfaceVariant, fontSize: 12 },
  miniValue: { fontSize: 20, fontWeight: '700', color: colors.onSurface },
  miniBadge: { backgroundColor: `${colors.tertiaryContainer}4D`, paddingHorizontal: spacing.base, paddingVertical: 1, borderRadius: 4, alignSelf: 'flex-start' },
  miniBadgeText: { fontSize: 10, fontWeight: '700', color: colors.onTertiaryContainer },
  chartCard: { backgroundColor: colors.surfaceContainerLowest, padding: spacing.lg, borderRadius: borderRadius.xl, ...shadows.md },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  chartTitle: { ...typography.labelBold, color: colors.onSurface },
  chartInfo: { fontSize: 16 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: 160, gap: spacing.sm },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: spacing.base },
  bar: { width: '60%', backgroundColor: colors.primary, borderRadius: 4 },
  barLabel: { fontSize: 10, fontWeight: '700', color: colors.onSurfaceVariant },
  pieRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  pie: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.surfaceContainerLow, position: 'relative' },
  pieSeg: { position: 'absolute', width: '100%', height: '100%', borderRadius: 60 },
  legend: { flex: 1, gap: spacing.sm },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.base },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { ...typography.bodySm, color: colors.onSurface, flex: 1 },
  legendPct: { fontWeight: '700', color: colors.onSurfaceVariant },
  downloadBtn: { marginTop: spacing.sm },
  rangeItem: { paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.xs },
  rangeItemActive: { backgroundColor: colors.primaryContainer },
  rangeText: { ...typography.bodyMd, color: colors.onSurfaceVariant },
  rangeTextActive: { color: colors.onPrimaryContainer, fontWeight: '600' },
  downloadDesc: { ...typography.bodyMd, color: colors.onSurfaceVariant, marginBottom: spacing.md, textAlign: 'center' },
  downloadFormats: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  formatBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.outlineVariant },
  formatBtnText: { ...typography.labelBold, color: colors.onSurface },
});
