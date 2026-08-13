import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from './CustomButton';
import { colors, spacing, typography } from '../theme';

export function EmptyState({ title = 'Nada por aqui', message, icon = 'file-tray-outline', actionLabel, onAction }) {
  return <View style={styles.state}><View style={styles.icon}><Ionicons name={icon} size={28} color={colors.primary} /></View><Text style={styles.title}>{title}</Text>{message ? <Text style={styles.message}>{message}</Text> : null}{onAction ? <CustomButton title={actionLabel || 'Tentar novamente'} onPress={onAction} variant="secondary" style={styles.button} /> : null}</View>;
}
export function ErrorState({ message = 'Não foi possível carregar os dados.', onRetry }) {
  return <EmptyState title="Algo não correu bem" message={message} icon="cloud-offline-outline" actionLabel="Tentar novamente" onAction={onRetry} />;
}
export function LoadingSkeleton({ rows = 3 }) {
  return <View accessibilityLabel="A carregar" accessibilityRole="progressbar">{Array.from({ length: rows }).map((_, i) => <View key={i} style={styles.skeleton}><View style={styles.skeletonIcon} /><View style={{ flex: 1 }}><View style={styles.skeletonTitle} /><View style={styles.skeletonLine} /></View></View>)}</View>;
}
const styles = StyleSheet.create({
  state: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24 }, icon: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.heading, color: colors.text, marginTop: spacing.lg, textAlign: 'center' }, message: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' }, button: { paddingHorizontal: 22 },
  skeleton: { flexDirection: 'row', padding: 16, marginBottom: 12, backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border }, skeletonIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#E9EEF3', marginRight: 12 }, skeletonTitle: { width: '65%', height: 14, borderRadius: 7, backgroundColor: '#E9EEF3', marginTop: 5 }, skeletonLine: { width: '88%', height: 10, borderRadius: 5, backgroundColor: '#F1F5F9', marginTop: 10 },
});
