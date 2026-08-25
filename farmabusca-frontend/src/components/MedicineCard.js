import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, typography } from '../theme';
import ResilientImage from './ResilientImage';

const placeholder = require('../../assets/images/medicamentos/medicine-placeholder.png');
const meta = {
  AVAILABLE: { label: 'Disponível', color: colors.primaryDark, bg: colors.successLight, icon: 'checkmark-circle' },
  LOW_STOCK: { label: 'Poucas unidades', color: '#92400E', bg: colors.warningLight, icon: 'alert-circle' },
  OUT_OF_STOCK: { label: 'Indisponível', color: colors.error, bg: colors.errorLight, icon: 'close-circle' },
};

export default function MedicineCard({ item, onPress, onFavorite, favorite = false, cardStyle }) {
  const inferred = String(item.stock || '').toLowerCase().includes('baixo') ? 'LOW_STOCK' : String(item.stock || '').toLowerCase().includes('indis') ? 'OUT_OF_STOCK' : 'AVAILABLE';
  const state = meta[item.stockStatus || item.status || inferred] || meta.AVAILABLE;
  const pharmacy = item.Pharmacy?.name || item.pharmacy || 'Farmácia';
  return <TouchableOpacity style={[styles.card, cardStyle]} onPress={onPress} activeOpacity={0.82} accessibilityRole="button" accessibilityLabel={`${item.name}, ${state.label}`}>
    <View style={styles.imageWrap}><ResilientImage uri={item.image || item.imageUrl} fallback={placeholder} style={styles.image} /><View style={[styles.badge, { backgroundColor: state.bg }]}><Ionicons name={state.icon} size={13} color={state.color} /><Text style={[styles.badgeText, { color: state.color }]}>{state.label}</Text></View>{onFavorite ? <TouchableOpacity style={styles.favorite} onPress={(event) => { event.stopPropagation?.(); onFavorite(); }} hitSlop={10} accessibilityLabel={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}><Ionicons name={favorite ? 'heart' : 'heart-outline'} size={24} color={favorite ? colors.error : colors.textSecondary} /></TouchableOpacity> : null}</View>
    <View style={styles.body}><View style={styles.titleRow}><Text numberOfLines={1} style={styles.title}>{item.name}</Text></View>{item.dosage || item.description ? <Text numberOfLines={1} style={styles.description}>{item.dosage || item.description}</Text> : null}<Text numberOfLines={1} style={styles.pharmacy}>{pharmacy}</Text></View>
    <View style={styles.footer}><Text style={styles.price}>{item.price != null ? `${Number(item.price).toLocaleString('pt-MZ')} MT` : 'Preço sob consulta'}</Text>{onPress ? <View style={styles.details}><Text style={styles.detailsText}>Ver opções</Text><Ionicons name="arrow-forward" size={16} color={colors.primary} /></View> : null}</View>
  </TouchableOpacity>;
}

const styles = StyleSheet.create({ card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: colors.border, ...shadows.card }, imageWrap: { height: 138, position: 'relative', backgroundColor: colors.background }, image: { width: '100%', height: '100%' }, favorite: { position: 'absolute', top: 12, right: 12, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.94)', alignItems: 'center', justifyContent: 'center' }, body: { padding: 14, paddingBottom: 8 }, titleRow: { flexDirection: 'row', alignItems: 'center' }, title: { ...typography.heading, fontSize: 18, color: colors.text, flex: 1 }, description: { ...typography.caption, color: colors.textSecondary, marginTop: 4 }, pharmacy: { ...typography.caption, color: colors.textSecondary, marginTop: 5 }, badge: { position: 'absolute', left: 12, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 6 }, badgeText: { fontSize: 11, fontWeight: '800' }, footer: { borderTopWidth: 1, borderTopColor: colors.border, marginHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, price: { color: colors.primaryDark, fontWeight: '800', fontSize: 19 }, details: { flexDirection: 'row', alignItems: 'center', gap: 5 }, detailsText: { color: colors.primary, fontWeight: '800', fontSize: 13 } });
