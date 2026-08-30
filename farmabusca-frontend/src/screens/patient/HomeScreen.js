import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Image, useWindowDimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from '../../components/SearchBar';
import MedicineCard from '../../components/MedicineCard';
import PharmacyCard from '../../components/PharmacyCard';
import ResilientImage from '../../components/ResilientImage';
import Header from '../../components/Header';
import SideMenu from '../../components/SideMenu';
import { ErrorState, LoadingSkeleton, EmptyState } from '../../components/ScreenState';
import { useAuth } from '../../context/AuthContext';
import { getPharmacies, getMedicines, addFavorite } from '../../services/api';
import { colors, radius, shadows, spacing, typography } from '../../theme';

const heroImage = require('../../../assets/images/interface/pharmacy-hero.png');
const medicineImage = require('../../../assets/images/medicamentos/medicine-placeholder.png');
const initials = (name) => String(name || 'FB').trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [medicines, setMedicines] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const firstName = String(user?.name || 'utilizador').trim().split(/\s+/)[0];
  const shortcuts = useMemo(() => [
    { label: 'Pesquisar', icon: 'search', screen: 'Pesquisar', image: medicineImage },
    { label: 'Favoritos', icon: 'heart', screen: 'Favoritos', image: medicineImage },
    { label: 'Perfil', icon: 'person', screen: 'Perfil', uri: user?.image || user?.imageUrl },
    { label: 'Assistente IA', icon: 'sparkles', screen: 'Assistente', image: heroImage },
  ], [user?.image, user?.imageUrl]);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true); setError('');
    try {
      const [medRes, phRes] = await Promise.all([getMedicines(), getPharmacies()]);
      setMedicines((medRes.data || []).slice(0, 4));
      setPharmacies(phRes.data || []);
    } catch (e) {
      setError(e.response ? 'Não foi possível carregar as informações.' : 'Sem ligação à Internet. Verifique a rede e tente novamente.');
    } finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const save = async (id) => { try { await addFavorite(id); } catch (e) { if (e.response?.status !== 400) setError('Não foi possível guardar o medicamento.'); } };

  return <View style={styles.container}>
    <Header title="FarmaBusca" onMenu={() => setMenuOpen(true)} />
    <Animated.ScrollView contentContainerStyle={styles.content} onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })} scrollEventThrottle={16} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}>
      <View style={styles.page}>
      <View style={styles.welcome}><View style={styles.welcomeCopy}><Text style={styles.greeting}>Olá, {firstName}!</Text><Text style={styles.prompt}>O que procura hoje?</Text></View><ResilientImage uri={user?.image || user?.imageUrl} style={styles.avatar}><View style={styles.avatarFallback}><Text style={styles.avatarText}>{initials(user?.name)}</Text></View></ResilientImage></View>
      <View style={styles.hero}><Image source={heroImage} style={styles.heroImage} resizeMode="cover" /><View style={styles.heroShade} /><View style={styles.heroCopy}><Text style={styles.heroEyebrow}>FARMABUSCA</Text><Text style={styles.heroTitle}>A sua saúde, mais perto de si</Text><Text style={styles.heroText}>Encontre medicamentos e farmácias perto de si.</Text></View></View>
      <TouchableOpacity style={styles.searchWrap} activeOpacity={0.9} onPress={() => navigation.navigate('Pesquisar')} accessibilityRole="button" accessibilityLabel="Pesquisar medicamento"><View pointerEvents="none"><SearchBar placeholder="Pesquisar medicamento..." /></View></TouchableOpacity>
      <Text style={styles.quickTitle}>Acesso rápido</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shortcuts}>{shortcuts.map((item) => <TouchableOpacity key={item.label} style={[styles.shortcut, width < 370 && styles.shortcutCompact]} onPress={() => navigation.navigate(item.screen)} activeOpacity={0.84}><ResilientImage uri={item.uri} fallback={item.image} style={styles.shortcutImage}><View style={styles.profileFallback}><Ionicons name="person" size={27} color={colors.primaryDark} /></View></ResilientImage><View style={styles.shortcutOverlay} /><View style={styles.shortcutLabel}><Ionicons name={item.icon} size={15} color="#FFFFFF" /><Text numberOfLines={1} style={styles.shortcutText}>{item.label}</Text></View></TouchableOpacity>)}</ScrollView>
      {error && !medicines.length && !pharmacies.length ? <ErrorState message={error} onRetry={load} /> : loading ? <LoadingSkeleton rows={4} /> : <><Section title="Medicamentos disponíveis" action="Ver todos" onPress={() => navigation.navigate('Pesquisar')} />{medicines.length ? <View style={styles.medicineGrid}>{medicines.map((item) => <MedicineCard key={item.id} cardStyle={styles.medicineGridCard} item={item} onFavorite={() => save(item.id)} onPress={() => navigation.navigate('MedicineDetails', { item })} />)}</View> : <EmptyState title="Nenhum medicamento disponível" message="Volte a tentar mais tarde." />}<Section title="Farmácias disponíveis" />{pharmacies.length ? pharmacies.map((item, index) => <Animated.View key={item.id} style={index === 0 ? null : { opacity: scrollY.interpolate({ inputRange: [320 + index * 160, 680 + index * 160], outputRange: [0.2, 1], extrapolate: 'clamp' }), transform: [{ translateY: scrollY.interpolate({ inputRange: [320 + index * 160, 680 + index * 160], outputRange: [35, 0], extrapolate: 'clamp' }) }] }}><PharmacyCard item={item} onPress={() => navigation.navigate('PharmacyMedicines', { pharmacy: item })} onViewMedicines={() => navigation.navigate('PharmacyMedicines', { pharmacy: item })} /></Animated.View>) : <EmptyState title="Nenhuma farmácia disponível" message="As farmácias aprovadas aparecerão aqui." />}</>}
      </View>
    </Animated.ScrollView>
    <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} onNavigate={(screen) => navigation.navigate(screen)} userName={user?.name ? `Olá, ${firstName}` : null} />
  </View>;
}

function Section({ title, action, onPress }) { return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{action ? <TouchableOpacity onPress={onPress}><Text style={styles.sectionAction}>{action}</Text></TouchableOpacity> : null}</View>; }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background }, content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: 40 }, page: { width: '100%', maxWidth: 760, alignSelf: 'center' },
  welcome: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 }, welcomeCopy: { flex: 1, paddingRight: 16 }, greeting: { ...typography.body, color: colors.primaryDark, fontWeight: '700' }, prompt: { ...typography.title, color: colors.text, marginTop: 1 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primaryLight, borderWidth: 2, borderColor: '#FFFFFF' }, avatarFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 28 }, avatarText: { color: colors.primaryDark, fontWeight: '800', fontSize: 15 },
  hero: { height: 188, marginBottom: -28, justifyContent: 'center', overflow: 'hidden', borderRadius: radius.xl, backgroundColor: '#789183' }, heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' }, heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,45,24,0.32)' }, heroCopy: { width: '78%', marginLeft: 18, padding: 4 }, heroEyebrow: { color: '#B9E7C8', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }, heroTitle: { color: '#FFFFFF', fontSize: 21, lineHeight: 26, fontWeight: '800', marginTop: 4 }, heroText: { color: 'rgba(255,255,255,0.88)', fontSize: 13, lineHeight: 18, marginTop: 5 },
  searchWrap: { marginHorizontal: 14, ...shadows.floating }, quickTitle: { ...typography.heading, fontSize: 16, color: colors.text, marginTop: 22, marginBottom: 10 }, shortcuts: { gap: 10, paddingRight: spacing.lg }, shortcut: { width: 145, height: 112, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.primaryLight, ...shadows.card }, shortcutCompact: { width: 132, height: 100 }, shortcutImage: { width: '100%', height: '100%' }, profileFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight }, shortcutOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,45,24,0.23)' }, shortcutLabel: { position: 'absolute', left: 8, right: 8, bottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 5, borderRadius: radius.pill, backgroundColor: 'rgba(8,67,34,0.88)' }, shortcutText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', flexShrink: 1 },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 10 }, sectionTitle: { ...typography.heading, color: colors.text }, sectionAction: { color: colors.primary, fontWeight: '800', fontSize: 13 }, medicineGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }, medicineGridCard: { width: '48%' },
});
