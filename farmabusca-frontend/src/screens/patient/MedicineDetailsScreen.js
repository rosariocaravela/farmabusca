import React from 'react';
import { View, Text, ScrollView, StyleSheet, Image } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Header from '../../components/Header';
import PharmacyCard from '../../components/PharmacyCard';
import CustomButton from '../../components/CustomButton';
import { getMedicineById, searchMedicines } from '../../services/api';
import { useEffect, useState } from 'react';

// outras farmácias serão carregadas pela API

export default function MedicineDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { item } = route.params || {};

  const [details, setDetails] = useState(item || null);
  const [otherPharmacies, setOtherPharmacies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const name = item?.name;
    setLoading(true);
    const promises = [];
    if (item?.id) promises.push(getMedicineById(item.id));
    if (name) promises.push(searchMedicines(name));

    Promise.all(promises)
      .then((results) => {
        if (!mounted) return;
        if (item?.id && results[0]) {
          setDetails(results[0].data || item);
        }

        const searchRes = name ? results[item?.id ? 1 : 0] : null;
        const pharmacies = (searchRes?.data || [])
          .map((m) => {
            const pharmacy = m.Pharmacy;
            if (!pharmacy) return null;
            return {
              id: pharmacy.id,
              name: pharmacy.name,
              address: pharmacy.address || pharmacy.city || 'Local não disponível',
              location: pharmacy.address || pharmacy.city || 'Local não disponível',
              phone: pharmacy.phone || '',
              openingHours: pharmacy.openingHours || '08:00 - 20:00',
              image: pharmacy.image || null,
              whatsapp: pharmacy.whatsapp || pharmacy.phone || '',
            };
          })
          .filter(Boolean);

        setOtherPharmacies(pharmacies);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || 'Erro ao carregar detalhes');
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [item]);

  const imageSource = details?.image || details?.imageUrl || item?.image || item?.imageUrl || null;

  const pharmacyItem = details?.Pharmacy
    ? {
        id: details.Pharmacy.id,
        name: details.Pharmacy.name,
        address: details.Pharmacy.address || details.Pharmacy.city || 'Local não disponível',
        location: details.Pharmacy.address || details.Pharmacy.city || 'Local não disponível',
        phone: details.Pharmacy.phone || '',
        openingHours: details.Pharmacy.openingHours || '08:00 - 20:00',
        image: details.Pharmacy.image || null,
        whatsapp: details.Pharmacy.whatsapp || details.Pharmacy.phone || '',
      }
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Header title="Detalhes" subtitle="Informação e disponibilidade" onBack={() => navigation.goBack()} />
      <View style={styles.card}>
        {imageSource ? (
          <View style={styles.imageWrapper}>
            <Image source={{ uri: imageSource }} style={styles.image} />
          </View>
        ) : (
          <View style={styles.imageBox}><Text style={styles.imageText}>💊</Text></View>
        )}
        <Text style={styles.name}>{details?.name || item?.name || 'Medicamento'}</Text>
        <Text style={styles.description}>{details?.description || item?.description || 'Descrição curta do medicamento.'}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{details?.price || item?.price || 0} MT</Text>
          <Text style={styles.stock}>{details?.stock || item?.stock || 'Disponível'}</Text>
        </View>
        <Text style={styles.info}>Disponível em: {details?.pharmacy || item?.pharmacy || pharmacyItem?.name || 'Farmácia'}</Text>
        <View style={styles.buttonRow}>
          <CustomButton
            title="Ver farmácia"
            variant="secondary"
            style={{ flex: 1 }}
            onPress={() => navigation.navigate('PharmacyDetails', { item: pharmacyItem || { name: details?.pharmacy || item?.pharmacy || 'Farmácia' } })}
          />
        </View>
      </View>

      <Text style={styles.sectionTitle}>Farmácias com este medicamento</Text>
      {loading ? (
        <Text style={{ marginHorizontal: 16 }}>Carregando...</Text>
      ) : error ? (
        <Text style={{ marginHorizontal: 16 }}>{error}</Text>
      ) : otherPharmacies.length === 0 ? (
        <Text style={{ marginHorizontal: 16 }}>Nenhuma farmácia encontrada.</Text>
      ) : (
        otherPharmacies.map((m) => (
          <PharmacyCard key={m.id} item={m} onPress={() => navigation.navigate('PharmacyDetails', { item: m })} />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5FAF7' },
  card: { backgroundColor: '#FFFFFF', margin: 16, borderRadius: 22, padding: 20, borderWidth: 1, borderColor: '#EDF5EE', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  imageBox: { width: 72, height: 72, borderRadius: 20, backgroundColor: '#EAF8EE', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  imageText: { fontSize: 34 },
  imageWrapper: { width: 120, height: 120, borderRadius: 20, overflow: 'hidden', marginBottom: 12, alignSelf: 'center' },
  image: { width: '100%', height: '100%' },
  name: { fontSize: 22, fontWeight: '800', color: '#233447' },
  description: { color: '#6F7882', marginTop: 6, lineHeight: 22 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  price: { color: '#2F9E5D', fontSize: 20, fontWeight: '800' },
  stock: { color: '#4C8DFF', fontWeight: '700' },
  info: { color: '#6F7882', marginTop: 8 },
  buttonRow: { flexDirection: 'row', marginTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#233447', marginHorizontal: 16, marginBottom: 10 },
});
