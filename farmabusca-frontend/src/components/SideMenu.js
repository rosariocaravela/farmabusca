import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, spacing, typography } from '../theme';

const exploreItems = [
  { label: 'Início', icon: 'home-outline', screen: 'Home' },
  { label: 'Farmácias', icon: 'business-outline', screen: 'PharmaciesList' },
  { label: 'Favoritos', icon: 'heart-outline', screen: 'Favoritos' },
];

export default function SideMenu({ visible, onClose, onNavigate, userName }) {
  const navigate = (screen) => {
    onClose();
    onNavigate(screen);
  };

  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.layer}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <ScrollView style={styles.menu} contentContainerStyle={styles.menuContent} showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}><Ionicons name="sparkles" size={23} color={colors.surface} /></View>
          <View><Text style={styles.brand}>FarmaBusca</Text></View>
        </View>
        <View style={styles.location}><Ionicons name="location-outline" size={22} color={colors.primaryDark} /><View><Text style={styles.locationLabel}>A sua localização</Text><Text style={styles.locationValue}>Maputo, Moçambique</Text></View></View>
        <Text style={styles.section}>Explorar</Text>
        {exploreItems.map((item) => <TouchableOpacity key={item.label} style={styles.item} onPress={() => navigate(item.screen)} accessibilityRole="button"><Ionicons name={item.icon} size={23} color={colors.textSecondary} /><Text style={styles.itemText}>{item.label}</Text></TouchableOpacity>)}
        <Text style={styles.section}>Inteligência artificial</Text>
        <TouchableOpacity style={[styles.item, styles.assistantItem]} onPress={() => navigate('Assistente')} accessibilityRole="button"><Ionicons name="sparkles-outline" size={23} color={colors.primaryDark} /><Text style={[styles.itemText, styles.assistantText]}>Assistente IA</Text><Text style={styles.newLabel}>NOVO</Text></TouchableOpacity>
        <TouchableOpacity style={styles.item} onPress={() => navigate('Perfil')} accessibilityRole="button"><Ionicons name="person-outline" size={23} color={colors.textSecondary} /><Text style={styles.itemText}>{userName || 'Meu perfil'}</Text></TouchableOpacity>
      </ScrollView>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  layer: { flex: 1, flexDirection: 'row' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(16,35,26,0.35)' },
  menu: { width: '50%', maxWidth: 390, backgroundColor: colors.surface, ...shadows.floating },
  menuContent: { padding: spacing.xl, paddingTop: 44, paddingBottom: spacing.xxl },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xxl },
  brandMark: { width: 52, height: 52, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  brand: { ...typography.heading, color: colors.text, fontSize: 24 },
  location: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, backgroundColor: colors.background, borderRadius: radius.lg, marginBottom: spacing.xxl },
  locationLabel: { ...typography.caption, color: colors.textSecondary },
  locationValue: { ...typography.body, color: colors.primaryDark, fontWeight: '800', marginTop: 2 },
  section: { color: colors.textSecondary, fontSize: 12, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing.sm, marginTop: spacing.md },
  item: { minHeight: 54, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, borderRadius: radius.md, gap: spacing.md },
  itemText: { flex: 1, color: colors.textSecondary, fontSize: 15, fontWeight: '700' },
  assistantItem: { backgroundColor: '#F3F7F4', borderWidth: 1, borderColor: '#D8E8DD' },
  assistantText: { color: colors.primaryDark },
  newLabel: { color: colors.primaryDark, fontSize: 10, fontWeight: '900' },
});
