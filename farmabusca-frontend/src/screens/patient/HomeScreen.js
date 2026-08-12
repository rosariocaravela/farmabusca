import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SearchBar from '../../components/SearchBar';
import CategoryCard from '../../components/CategoryCard';
import MedicineCard from '../../components/MedicineCard';
import PharmacyCard from '../../components/PharmacyCard';
import { useAuth } from '../../context/AuthContext';
import { getPharmacies, getMedicines } from '../../services/api';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [popularMedicines, setPopularMedicines] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([getMedicines(), getPharmacies()])
      .then(([medRes, phRes]) => {
        if (!mounted) return;
        const meds = (medRes.data || []).map((m) => ({
          id: m.id,
          name: m.name,
          description: m.description,
          price: m.price,
          image: m.image || m.imageUrl || null,
          stock: m.stockStatus === 'AVAILABLE' ? 'Disponível' : m.stockStatus === 'LOW_STOCK' ? 'Stock baixo' : 'Indisponível',
          pharmacy: m.Pharmacy?.name || m.pharmacy || '',
        }));
        setPopularMedicines(meds.slice(0, 5));
        setPharmacies(phRes.data || []);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || 'Erro ao buscar dados');
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.heroCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Olá, {user?.name || 'utilizador'}</Text>
          <Text style={styles.prompt}>Encontre o que precisa com facilidade.</Text>
          <Text style={styles.helper}>Pesquise medicamentos e veja farmácias próximas em poucos segundos.</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={{ color: '#FFF', fontWeight: '800' }}>FB</Text>
        </View>
      </View>

      <View style={{ marginTop: 6 }}>
        <SearchBar placeholder="Pesquisar medicamento..." />
      </View>

      <View style={styles.categoriesRow}>
        <CategoryCard title="Medicamentos" icon="medkit-outline" color="#2F9E5D" onPress={() => navigation.navigate('Pesquisar')} />
        <CategoryCard title="Farmácias" icon="storefront-outline" color="#4C8DFF" onPress={() => navigation.navigate('Favoritos')} />
        <CategoryCard title="Favoritos" icon="heart-outline" color="#F08A5D" onPress={() => navigation.navigate('Favoritos')} />
        <CategoryCard title="Localização" icon="location-outline" color="#6C63FF" />
      </View>

      <Text style={styles.sectionTitle}>Mais procurados</Text>
      {loading ? (
        <Text>Carregando medicamentos...</Text>
      ) : error ? (
        <Text>{error}</Text>
      ) : popularMedicines.length === 0 ? (
        <Text>Nenhum medicamento encontrado.</Text>
      ) : (
        popularMedicines.map((item) => (
          <MedicineCard key={item.id} item={item} onPress={() => navigation.navigate('MedicineDetails', { item })} />
        ))
      )}

      <Text style={styles.sectionTitle}>Farmácias próximas</Text>
      {loading ? (
        <Text>Carregando farmácias...</Text>
      ) : error ? (
        <Text>{error}</Text>
      ) : pharmacies.length === 0 ? (
        <Text>Nenhuma farmácia encontrada.</Text>
      ) : (
        pharmacies.map((item) => (
          <PharmacyCard key={item.id} item={item} onPress={() => navigation.navigate('PharmacyDetails', { item })} />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5FAF7' },
  heroCard: {
    backgroundColor: '#2F9E5D',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  greeting: { color: '#ECFDF3', fontSize: 13, opacity: 0.9 },
  prompt: { color: '#FFFFFF', fontSize: 21, fontWeight: '800', marginTop: 4 },
  helper: { color: '#EAF8EE', marginTop: 6, fontSize: 13, lineHeight: 20 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF33', justifyContent: 'center', alignItems: 'center' },
  categoriesRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 18 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#233447', marginTop: 16, marginBottom: 10 },
});
