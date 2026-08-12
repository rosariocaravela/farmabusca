import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SearchBar from '../../components/SearchBar';
import MedicineCard from '../../components/MedicineCard';
import { searchMedicines, getMedicines } from '../../services/api';

export default function SearchMedicineScreen() {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const handler = setTimeout(() => {
      setLoading(true);
      setError(null);
      const fetcher = query ? searchMedicines(query) : getMedicines();
      fetcher
        .then((res) => {
          if (!mounted) return;
          const meds = (res.data || []).map((m) => ({
            id: m.id,
            name: m.name,
            description: m.description,
            price: m.price,
            image: m.image || m.imageUrl || null,
            stock: m.stockStatus === 'AVAILABLE' ? 'Disponível' : m.stockStatus === 'LOW_STOCK' ? 'Stock baixo' : 'Indisponível',
            pharmacy: m.Pharmacy?.name || m.pharmacy || '',
          }));
          setResults(meds);
        })
        .catch((err) => {
          if (!mounted) return;
          setError(err.message || 'Erro ao buscar medicamentos');
        })
        .finally(() => mounted && setLoading(false));
    }, 450);

    return () => {
      mounted = false;
      clearTimeout(handler);
    };
  }, [query]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pesquisar medicamento</Text>
        <Text style={styles.subtitle}>Encontre rapidamente o que precisa.</Text>
      </View>
      <SearchBar value={query} onChangeText={setQuery} placeholder="Digite o nome do medicamento" />
      <ScrollView style={{ marginTop: 14 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <Text style={styles.empty}>Carregando...</Text>
        ) : error ? (
          <Text style={styles.empty}>{error}</Text>
        ) : results.length > 0 ? (
          results.map((item) => <MedicineCard key={item.id} item={item} onPress={() => navigation.navigate('MedicineDetails', { item })} />)
        ) : (
          <Text style={styles.empty}>Nenhum medicamento encontrado.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5FAF7', padding: 20 },
  header: { marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#233447' },
  subtitle: { color: '#6F7882', marginTop: 4 },
  empty: { textAlign: 'center', color: '#6F7882', marginTop: 24 },
});
