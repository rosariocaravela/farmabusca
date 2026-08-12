import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import MedicineCard from '../../components/MedicineCard';
import { getMyPharmacyMedicines } from '../../services/api';

export default function MedicinesScreen({ navigation }) {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    getMyPharmacyMedicines()
      .then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res) ? res : res.data || [];
        const meds = list.map((m) => ({
          id: m.id,
          name: m.name,
          description: m.description,
          price: m.price,
          stock: m.stockStatus === 'AVAILABLE' ? 'Disponível' : m.stockStatus === 'LOW_STOCK' ? 'Stock baixo' : 'Indisponível',
          pharmacy: m.Pharmacy?.name || m.pharmacy || '',
        }));
        setMedicines(meds);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || 'Erro ao carregar medicamentos');
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const handlePress = (item) => navigation.navigate('EditMedicine', { id: item.id });

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Medicamentos cadastrados</Text>
      {loading ? <Text>Carregando...</Text> : error ? <Text>{error}</Text> : medicines.map((item) => <MedicineCard key={item.id} item={item} onPress={() => handlePress(item)} />)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  title: { fontSize: 24, fontWeight: '800', color: '#333', marginBottom: 16 },
});
