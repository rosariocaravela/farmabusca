import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Linking, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import PharmacyCard from '../../components/PharmacyCard';
import CustomButton from '../../components/CustomButton';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../components/ScreenState';
import { addFavorite, getMedicineById, searchMedicines } from '../../services/api';
import { colors, radius, shadows, spacing, typography } from '../../theme';

const statusMap = {
  AVAILABLE: ['Disponível', colors.primaryDark, colors.successLight],
  LOW_STOCK: ['Disponível', colors.primaryDark, colors.successLight],
  OUT_OF_STOCK: ['Indisponível', colors.error, colors.errorLight],
};

export default function MedicineDetailsScreen({ route, navigation }) {
  const item = route.params?.item;
  const [details, setDetails] = useState(item || null);
  const [others, setOthers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const detailResponse = item?.id ? await getMedicineById(item.id) : null;
      const data = detailResponse?.data || item;
      if (!data) throw new Error('missing');
      setDetails(data);
      if (data.name) {
        const response = await searchMedicines(data.name);
        const pharmacies = new Map();
        (response.data || []).forEach((medicine) => {
          if (medicine.Pharmacy?.id) pharmacies.set(medicine.Pharmacy.id, medicine.Pharmacy);
        });
        setOthers([...pharmacies.values()]);
      }
    } catch (requestError) {
      setError(requestError.response ? 'Não foi possível carregar este medicamento.' : 'Sem ligação à Internet.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [item]);

  useEffect(() => { load(); }, [load]);

  const pharmacy = details?.Pharmacy;
  const status = statusMap[details?.stockStatus] || statusMap.AVAILABLE;

  const save = async () => {
    if (saved || !details?.id) return;
    try {
      await addFavorite(details.id);
      setSaved(true);
    } catch (requestError) {
      if (requestError.response?.status === 400) setSaved(true);
      else Alert.alert('Erro', 'Não foi possível guardar o medicamento.');
    }
  };

  const contact = () => {
    if (!pharmacy?.phone) return Alert.alert('Contacto indisponível', 'Esta farmácia não informou um contacto.');
    Linking.openURL(`tel:${pharmacy.phone.replace(/[^0-9+]/g, '')}`);
  };

  const whatsapp = () => {
    const number = pharmacy?.whatsapp || pharmacy?.phone;
    if (!number) return Alert.alert('Contacto indisponível', 'Esta farmácia não informou um número de WhatsApp.');
    Linking.openURL(`https://wa.me/${number.replace(/[^0-9]/g, '')}`);
  };

  const openMap = () => {
    if (pharmacy?.latitude != null && pharmacy?.longitude != null) {
      return Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${pharmacy.latitude},${pharmacy.longitude}`);
    }
    const address = pharmacy?.address || pharmacy?.location;
    if (!address) return Alert.alert('Localização indisponível', 'Esta farmácia não informou a localização.');
    const query = encodeURIComponent(address);
    const url = Platform.OS === 'web' ? `https://www.google.com/maps/search/?api=1&query=${query}` : `geo:0,0?q=${query}`;
    Linking.openURL(url);
  };

  return <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}>
    <Header title="Detalhes" subtitle="Informação e disponibilidade" onBack={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('PatientTabs')} />
    {loading ? <View style={styles.pad}><LoadingSkeleton rows={3} /></View> : error && !details ? <ErrorState message={error} onRetry={load} /> : <>
      <View style={styles.card}>
        {details?.image ? <Image source={{ uri: details.image }} style={styles.image} /> : <View style={styles.imageEmpty}><Ionicons name="medical-outline" size={46} color={colors.primary} /></View>}
        <View style={styles.nameRow}><View style={styles.nameWrap}><Text style={styles.name}>{details?.name || 'Medicamento'}</Text>{details?.Category?.name ? <Text style={styles.category}>{details.Category.name}</Text> : null}</View><TouchableOpacity style={styles.favorite} onPress={save} accessibilityLabel="Guardar nos favoritos"><Ionicons name={saved ? 'heart' : 'heart-outline'} size={24} color={saved ? colors.error : colors.primary} /></TouchableOpacity></View>
        <View style={styles.priceRow}><Text style={styles.price}>{details?.price != null ? `${Number(details.price).toLocaleString('pt-MZ')} MT` : 'Preço sob consulta'}</Text><View style={[styles.badge, { backgroundColor: status[2] }]}><Text style={[styles.badgeText, { color: status[1] }]}>{status[0]}</Text></View></View>
        {details?.updatedAt ? <Text style={styles.updated}>Atualizado em {new Date(details.updatedAt).toLocaleDateString('pt-MZ')}</Text> : null}
      </View>
      {pharmacy ? <View style={styles.sectionCard}><Text style={styles.sectionTitle}>Farmácia associada</Text><PharmacyCard item={pharmacy} /><CustomButton title="Ligar para a farmácia" onPress={contact} /><CustomButton title="WhatsApp" variant="secondary" onPress={whatsapp} /><CustomButton title="Abrir localização" variant="secondary" onPress={openMap} /></View> : <EmptyState title="Farmácia não informada" message="Não existem dados da farmácia para este medicamento." />}
      <Text style={styles.listTitle}>Outras farmácias com este medicamento</Text>
      {others.length ? others.map((other) => <PharmacyCard key={other.id} item={other} onPress={() => navigation.navigate('PharmacyMedicines', { pharmacy: other })} />) : <EmptyState title="Sem outras opções" message="Não encontrámos este medicamento noutras farmácias." />}
    </>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 40 },
  pad: { padding: spacing.xl },
  card: { margin: spacing.xl, backgroundColor: colors.surface, borderRadius: radius.xl, padding: 18, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  image: { width: '100%', height: 190, borderRadius: radius.lg, resizeMode: 'contain', backgroundColor: colors.background },
  imageEmpty: { height: 160, borderRadius: radius.lg, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  nameWrap: { flex: 1 },
  name: { ...typography.title, color: colors.text },
  category: { ...typography.caption, color: colors.textSecondary, marginTop: 3 },
  favorite: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  price: { fontSize: 21, fontWeight: '800', color: colors.primaryDark },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { fontSize: 12, fontWeight: '800' },
  updated: { ...typography.caption, color: colors.textSecondary, marginTop: 12 },
  sectionCard: { margin: spacing.xl, marginBottom: 0 },
  sectionTitle: { ...typography.heading, color: colors.text, marginBottom: 10 },
  listTitle: { ...typography.heading, color: colors.text, marginHorizontal: spacing.xl, marginTop: 24, marginBottom: 10 },
});
