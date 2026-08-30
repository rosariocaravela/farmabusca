import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MedicineCard from '../../components/MedicineCard';
import Header from '../../components/Header';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../components/ScreenState';
import { addPharmacyFavorite, getPharmacyById, getPharmacyFavorites, getPharmacyMedicines, removePharmacyFavorite } from '../../services/api';
import { colors, radius, spacing, typography } from '../../theme';

export default function PharmacyMedicinesScreen({ navigation, route }) {
  const initialPharmacy = route.params?.pharmacy || {};
  const [pharmacy, setPharmacy] = useState(initialPharmacy);
  const [favorite, setFavorite] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [response, details, favorites] = await Promise.all([
        getPharmacyMedicines(initialPharmacy.id),
        getPharmacyById(initialPharmacy.id),
        getPharmacyFavorites().catch(() => ({ data: [] })),
      ]);
      setItems(response.data || []);
      setPharmacy(details || initialPharmacy);
      setFavorite((favorites.data || []).some((item) => (item.Pharmacy?.id || item.pharmacyId) === initialPharmacy.id));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível carregar os medicamentos.');
    } finally {
      setLoading(false);
    }
  }, [initialPharmacy.id]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const toggleFavorite = async () => {
    try {
      if (favorite) await removePharmacyFavorite(pharmacy.id);
      else await addPharmacyFavorite(pharmacy.id);
      setFavorite((value) => !value);
    } catch (requestError) {
      Alert.alert('Erro', requestError.response?.data?.message || 'Não foi possível actualizar os favoritos.');
    }
  };
  const call = () => pharmacy.phone ? Linking.openURL(`tel:${pharmacy.phone.replace(/[^0-9+]/g, '')}`) : Alert.alert('Contacto indisponível');
  const openMap = () => {
    if (pharmacy.latitude != null && pharmacy.longitude != null) {
      return Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${pharmacy.latitude},${pharmacy.longitude}`);
    }
    const address = pharmacy.address || pharmacy.location;
    if (!address) return Alert.alert('Localização indisponível');
    const query = encodeURIComponent(address);
    return Linking.openURL(Platform.OS === 'web' ? `https://www.google.com/maps/search/?api=1&query=${query}` : `geo:0,0?q=${query}`);
  };

  const pharmacyDetails = <View style={styles.details}><View style={styles.detailsHeader}><View style={styles.detailsText}><Text style={styles.name}>{pharmacy.name || 'Farmácia'}</Text><Text style={styles.location}>{[pharmacy.address, pharmacy.district, pharmacy.province].filter(Boolean).join(' • ') || 'Localização não informada'}</Text></View><TouchableOpacity style={styles.favorite} onPress={toggleFavorite} accessibilityLabel="Guardar farmácia nos favoritos"><Ionicons name={favorite ? 'heart' : 'heart-outline'} size={24} color={favorite ? colors.error : colors.primary} /></TouchableOpacity></View>{pharmacy.description ? <Text style={styles.description}>{pharmacy.description}</Text> : null}<Text style={styles.meta}>Contacto: {pharmacy.phone || 'Não informado'}</Text><Text style={styles.meta}>Horário: {pharmacy.openingHours || 'Não informado'}</Text><View style={styles.actions}><TouchableOpacity style={styles.action} onPress={call}><Ionicons name="call-outline" size={18} color={colors.primaryDark} /><Text style={styles.actionText}>Ligar</Text></TouchableOpacity><TouchableOpacity style={styles.action} onPress={openMap}><Ionicons name="location-outline" size={18} color={colors.primaryDark} /><Text style={styles.actionText}>Localização</Text></TouchableOpacity></View><Text style={styles.sectionTitle}>Medicamentos</Text></View>;

  return <View style={styles.container}>
    <Header title={pharmacy.name || 'Farmácia'} subtitle="Medicamentos disponíveis nesta farmácia" onBack={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')} />
    {loading ? <View style={styles.pad}><LoadingSkeleton rows={3} /></View> : error ? <ErrorState message={error} onRetry={load} /> : <FlatList
      data={items}
      numColumns={2}
      columnWrapperStyle={styles.gridRow}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      ListHeaderComponent={pharmacyDetails}
      renderItem={({ item }) => <MedicineCard item={item} cardStyle={styles.gridCard} onPress={() => navigation.navigate('MedicineDetails', { item })} />}
      ListEmptyComponent={<EmptyState title="Nenhum medicamento disponível" message="Esta farmácia ainda não publicou medicamentos disponíveis." />}
    />}
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.xl, paddingTop: spacing.sm, paddingBottom: 40 },
  gridRow: { justifyContent: 'space-between', gap: 12 },
  gridCard: { width: '48%' },
  pad: { padding: spacing.xl },
  details: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, marginBottom: 18, borderWidth: 1, borderColor: colors.border }, detailsHeader: { flexDirection: 'row', alignItems: 'flex-start' }, detailsText: { flex: 1 }, name: { ...typography.heading, color: colors.text, fontSize: 20 }, location: { ...typography.caption, color: colors.textSecondary, marginTop: 5 }, favorite: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight }, description: { ...typography.body, color: colors.textSecondary, marginTop: 12 }, meta: { ...typography.caption, color: colors.text, marginTop: 8 }, actions: { flexDirection: 'row', gap: 10, marginTop: 14 }, action: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 11, borderRadius: radius.md, backgroundColor: colors.primaryLight }, actionText: { color: colors.primaryDark, fontWeight: '800' }, sectionTitle: { ...typography.heading, color: colors.text, marginTop: 20 },
});
