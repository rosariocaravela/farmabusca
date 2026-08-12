import React, { useEffect, useState } from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import MedicineCard from '../../components/MedicineCard';
import PharmacyCard from '../../components/PharmacyCard';
import { getMedicines, getPharmacies } from '../../services/api';

export default function FavoritesScreen() {
  const [medicines, setMedicines] = useState([]);
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
        setMedicines(meds.slice(0, 5));
        setPharmacies(phRes.data ? phRes.data.slice(0, 5) : []);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || 'Erro ao carregar favoritos');
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Favoritos</Text>
      <Text style={styles.subtitle}>Itens salvos para acesso rápido.</Text>
      <Text style={styles.sectionTitle}>Medicamentos favoritos</Text>
      {loading ? <Text>Carregando...</Text> : error ? <Text>{error}</Text> : medicines.length === 0 ? <Text>Nenhum medicamento encontrado.</Text> : medicines.map((item) => <MedicineCard key={item.id} item={item} />)}
      <Text style={styles.sectionTitle}>Farmácias favoritas</Text>
      {loading ? <Text>Carregando...</Text> : error ? <Text>{error}</Text> : pharmacies.length === 0 ? <Text>Nenhuma farmácia encontrada.</Text> : pharmacies.map((item) => <PharmacyCard key={item.id} item={item} />)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5FAF7' },
  title: { fontSize: 24, fontWeight: '800', color: '#233447' },
  subtitle: { color: '#6F7882', marginTop: 4, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#233447', marginTop: 8, marginBottom: 8 },
});
