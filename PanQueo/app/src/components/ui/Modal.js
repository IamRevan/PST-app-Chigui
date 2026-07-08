import { Modal as RNModal, View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../../lib/theme';

export const SheetModal = ({ visible, onClose, title, children }) => (
  <RNModal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.sheet} onPress={() => {}}>
        <View style={styles.handle} />
        {title && <Text style={styles.title}>{title}</Text>}
        {children}
      </Pressable>
    </Pressable>
  </RNModal>
);

export const CenterModal = ({ visible, onClose, title, children }) => (
  <RNModal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.centerCard} onPress={() => {}}>
        {title && <Text style={styles.centerTitle}>{title}</Text>}
        {children}
      </Pressable>
    </Pressable>
  </RNModal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.gutter,
    paddingBottom: spacing.xl,
    maxHeight: '80%',
    ...shadows.lg,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.outlineVariant,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.titleSm,
    color: colors.onSurface,
    marginBottom: spacing.md,
  },
  centerCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    maxHeight: '70%',
    ...shadows.lg,
  },
  centerTitle: {
    ...typography.titleSm,
    color: colors.onSurface,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});
