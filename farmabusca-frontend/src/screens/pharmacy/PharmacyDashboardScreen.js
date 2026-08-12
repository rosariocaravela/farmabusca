import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import PharmacyHeader from '../../components/PharmacyHeader';
import DashboardCard from '../../components/DashboardCard';
import SearchBar from '../../components/SearchBar';
import CustomButton from '../../components/CustomButton';
import { getMyPharmacy, getMyPharmacyMedicines } from '../../services/api';

export default function PharmacyDashboardScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMissing, setProfileMissing] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [pharmacy, setPharmacy] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      const loadMedicines = async () => {
        setLoading(true);
        try {
          const res = await getMyPharmacyMedicines();
          if (mounted) setMedicines(Array.isArray(res) ? res : res.data || []);
        } catch (e) {
          console.warn('Erro carregando medicamentos', e.message || e);
        } finally {
          if (mounted) setLoading(false);
        }
      };

      loadMedicines();
      return () => {
        mounted = false;
      };
    }, [])
  );

  useFocusEffect(
    React.useCallback(() => {
      let mounted = true;
      const loadPharmacy = async () => {
        if (!mounted) return;
        setProfileLoading(true);
        setProfileMissing(false);

        try {
          const res = await getMyPharmacy();
          if (mounted) {
            const profile = res || res.data || null;
            setPharmacy(profile);
            setProfileMissing(!profile);
          }
        } catch (e) {
          if (mounted) {
            setPharmacy(null);
            setProfileMissing(true);
          }
          console.warn('Erro carregando perfil da farmácia', e.message || e);
        } finally {
          if (mounted) setProfileLoading(false);
        }
      };

      loadPharmacy();
      return () => {
        mounted = false;
      };
    }, [])
  );

  const filteredMedicines = medicines.filter((item) => {
    const search = query.toLowerCase().trim();
    return (
      !search ||
      item.name?.toLowerCase().includes(search) ||
      item.category?.toLowerCase().includes(search)
    );
  });

  const total = medicines.length;
  const available = medicines.filter((item) => item.stockStatus === 'AVAILABLE').length;
  const outOfStock = medicines.filter((item) => item.stockStatus !== 'AVAILABLE').length;
  const categories = new Set(medicines.map((item) => item.category || 'Sem categoria')).size;
  const views = 540;
  const emptyImageAlerts = medicines.filter((item) => !item.image).length;
  const incompleteInfoAlerts = medicines.filter((item) => !item.name || !item.category || !item.price).length;
  const recentMedicines = filteredMedicines.slice(0, 4);

  const openingHours = pharmacy?.openingHours || '08:00 - 20:00';
  const isOpen = (() => {
    const parts = openingHours.split('-').map((part) => part.trim());
    if (parts.length !== 2) return true;
    const [start, end] = parts;
    const startHour = Number(start.split(':')[0]);
    const endHour = Number(end.split(':')[0]);
    const currentHour = new Date().getHours();
    return currentHour >= startHour && currentHour < endHour;
  })();

  const openMenu = () => setMenuOpen(true);
  const closeMenu = () => setMenuOpen(false);
  const handleMenuAction = (screen) => {
    closeMenu();
    if (screen) navigation.navigate(screen);
  };

  return (
    <View style={styles.screenRoot}>
      <ScrollView style={styles.page} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <PharmacyHeader
          name={pharmacy?.name || 'Minha Farmácia'}
          logo={pharmacy?.image || null}
          onEdit={() => navigation.navigate('Perfil')}
          onViewStore={() => {}}
          onNotifications={() => navigation.navigate('Perfil')}
          onMenu={openMenu}
        />

        <View style={styles.topBanner}>
        <View style={styles.topText}>
          <Text style={styles.topTag}>💊 {pharmacy?.name || 'Minha Farmácia'}</Text>
          <Text style={styles.topTitle}>Painel da farmácia</Text>
          <Text style={styles.topSubtitle}>Gerencie seus medicamentos e informações da farmácia com rapidez.</Text>
        </View>
      </View>

      <SearchBar value={query} onChangeText={setQuery} placeholder="Pesquisar no catálogo" />

      {!profileLoading && profileMissing ? (
        <View style={styles.noProfileCard}>
          <Text style={styles.noProfileTitle}>Perfil da farmácia ainda não registrado</Text>
          <Text style={styles.noProfileText}>
            Complete o perfil da farmácia para que seus medicamentos apareçam no painel e seus clientes encontrem sua loja.
          </Text>
          <CustomButton title="Criar perfil da farmácia" onPress={() => navigation.navigate('Perfil')} />
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator size="large" color="#2F9E5D" style={{ marginTop: 32 }} />
      ) : (
        <>
          <View style={styles.summaryRow}>
            <DashboardCard title="Total de medicamentos" value={`${total} medicamentos`} color="#F5FAFF" />
            <DashboardCard title="Disponíveis" value={`${available} disponíveis`} color="#E8F7EE" />
          </View>
          <View style={styles.summaryRow}>
            <DashboardCard title="Esgotados" value={`${outOfStock} esgotados`} color="#FEF3F2" />
            <DashboardCard title="Categorias" value={`${categories} categorias`} color="#F5FEF9" />
          </View>
          <View style={styles.viewsCard}>
            <View style={styles.viewsRow}>
              <Text style={styles.viewsLabel}>Visualizações</Text>
              <View style={styles.viewsBadge}>
                <Text style={styles.viewsBadgeText}>{views}</Text>
              </View>
            </View>
            <Text style={styles.viewsDescription}>Pessoas que visualizaram seu catálogo ou perfil da farmácia.</Text>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Medicamentos recentes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Medicamentos')}>
              <Text style={styles.sectionAction}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          {recentMedicines.length ? (
            recentMedicines.map((item) => (
              <View key={item.id} style={styles.medicineItem}>
                <View style={styles.medicineImage}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.medicineImageContent} />
                  ) : (
                    <Ionicons name="medkit-outline" size={24} color="#2F9E5D" />
                  )}
                </View>
                <View style={styles.medicineInfo}>
                  <Text style={styles.medicineName}>{item.name || 'Medicamento sem nome'}</Text>
                  <Text style={styles.medicineCategory}>{item.category || 'Categoria não informada'}</Text>
                  <Text style={styles.medicinePrice}>{item.price ? `${item.price} MT` : 'Preço opcional'}</Text>
                </View>
                <View style={[styles.medicineTag, item.stockStatus === 'AVAILABLE' ? styles.medicineTagAvailable : styles.medicineTagOutOfStock]}>
                  <Text style={[styles.medicineTagText, item.stockStatus === 'AVAILABLE' ? styles.medicineTagTextAvailable : styles.medicineTagTextOutOfStock]}>
                    {item.stockStatus === 'AVAILABLE' ? '🟢 Disponível' : '🔴 Esgotado'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Nenhum medicamento recente encontrado.</Text>
          )}

          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>Atualizações necessárias</Text>
            <View style={styles.alertRow}>
              <Text style={styles.alertBullet}>⚠️</Text>
              <Text style={styles.alertText}>{outOfStock} medicamentos esgotados</Text>
            </View>
            <View style={styles.alertRow}>
              <Text style={styles.alertBullet}>⚠️</Text>
              <Text style={styles.alertText}>{emptyImageAlerts} sem imagem</Text>
            </View>
            <View style={styles.alertRow}>
              <Text style={styles.alertBullet}>⚠️</Text>
              <Text style={styles.alertText}>{incompleteInfoAlerts} com informações incompletas</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Text style={styles.infoCardTitle}>{pharmacy?.name || 'Minha Farmácia'}</Text>
              <View style={[styles.statusBadge, isOpen ? styles.statusOpen : styles.statusClosed]}>
                <Text style={styles.statusText}>{isOpen ? '🟢 Aberta' : '🔴 Fechada'}</Text>
              </View>
            </View>
            <Text style={styles.infoLine}>Nome: {pharmacy?.name || 'Minha Farmácia'}</Text>
            <Text style={styles.infoLine}>Localização: {pharmacy?.address || 'Av. 25 de Setembro, Maputo'}</Text>
            <Text style={styles.infoLine}>Horário: {openingHours}</Text>
            <Text style={styles.infoLine}>Contacto: {pharmacy?.phone || '84 000 000'}</Text>
          </View>
        </>
      )}
      </ScrollView>

      {menuOpen ? (
        <View style={styles.menuOverlay}>
          <TouchableOpacity style={styles.menuClose} onPress={closeMenu}>
            <Ionicons name="close" size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.menuBox}>
            <Text style={styles.menuTitle}>Ações rápidas</Text>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuAction('Adicionar')}>
              <Ionicons name="add-circle" size={20} color="#2F9E5D" />
              <Text style={styles.menuItemText}>Adicionar medicamento</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuAction('Medicamentos')}>
              <Ionicons name="medkit" size={20} color="#2F9E5D" />
              <Text style={styles.menuItemText}>Gerenciar medicamentos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuAction('Perfil')}>
              <Ionicons name="person-circle" size={20} color="#2F9E5D" />
              <Text style={styles.menuItemText}>Editar perfil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleMenuAction('Perfil')}>
              <Ionicons name="location-outline" size={20} color="#2F9E5D" />
              <Text style={styles.menuItemText}>Atualizar localização</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screenRoot: { flex: 1, backgroundColor: '#EFF8F8' },
  page: { backgroundColor: 'transparent' },
  container: { padding: 16, paddingBottom: 32 },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'flex-start',
    padding: 20,
  },
  menuClose: {
    alignSelf: 'flex-end',
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  menuBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  menuTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937', marginBottom: 16 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  menuItemText: { marginLeft: 12, color: '#1F2937', fontSize: 16 },
  topBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
    marginBottom: 20,
  },
  topText: { flex: 1, paddingRight: 12 },
  topTag: { color: '#2F9E5D', fontWeight: '700', marginBottom: 8 },
  topTitle: { fontSize: 22, fontWeight: '800', color: '#1F2937' },
  topSubtitle: { color: '#6B7280', marginTop: 8, lineHeight: 20 },
  logoPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: '#F5FAF7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1E9DD',
    overflow: 'hidden',
  },
  bannerImage: {
    width: 70,
    height: 70,
    borderRadius: 22,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  viewsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginTop: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  viewsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  viewsLabel: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  viewsBadge: { backgroundColor: '#E8F7EE', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 },
  viewsBadgeText: { color: '#107D3B', fontSize: 14, fontWeight: '800' },
  viewsDescription: { marginTop: 10, color: '#6B7280', fontSize: 13, lineHeight: 20 },
  sectionHeader: { marginTop: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  sectionAction: { color: '#2563EB', fontWeight: '700' },
  medicineItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  medicineImage: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: '#EAF8EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  medicineImageContent: { width: 56, height: 56, borderRadius: 18 },
  medicineInfo: { flex: 1 },
  medicineName: { fontSize: 16, fontWeight: '800', color: '#1F2937' },
  medicineCategory: { color: '#6B7280', marginTop: 4, fontSize: 13 },
  medicinePrice: { marginTop: 10, color: '#2F9E5D', fontWeight: '700', fontSize: 14 },
  medicineTag: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 },
  medicineTagAvailable: { backgroundColor: '#EAF8EE' },
  medicineTagOutOfStock: { backgroundColor: '#FEF3F2' },
  medicineTagText: { fontWeight: '700', fontSize: 11 },
  medicineTagTextAvailable: { color: '#107D3B' },
  medicineTagTextOutOfStock: { color: '#B91C1C' },
  emptyText: { textAlign: 'center', color: '#6B7280', marginTop: 18 },
  alertCard: {
    backgroundColor: '#FFFBF0',
    borderRadius: 22,
    padding: 18,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#F8E3D6',
  },
  alertTitle: { fontSize: 16, fontWeight: '800', color: '#92400E' },
  alertRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  alertBullet: { marginRight: 10, fontSize: 18 },
  alertText: { color: '#92400E', fontSize: 14, lineHeight: 20 },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginTop: 24,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  infoCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoCardTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  statusBadge: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 },
  statusOpen: { backgroundColor: '#EAF8EE' },
  statusClosed: { backgroundColor: '#FEE2E2' },
  statusText: { fontWeight: '700', fontSize: 13 },
  infoLine: { marginTop: 12, color: '#475569', fontSize: 14, lineHeight: 22 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 24 },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  actionLabel: { marginTop: 12, color: '#1F2937', fontSize: 14, fontWeight: '700' },
});
