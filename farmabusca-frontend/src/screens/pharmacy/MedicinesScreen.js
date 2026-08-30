import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MedicineCard from '../../components/MedicineCard';
import SearchBar from '../../components/SearchBar';
import { getMyPharmacyMedicines } from '../../services/api';

export default function MedicinesScreen({ navigation }) {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    getMyPharmacyMedicines()
      .then((res) => {
        if (!mounted) return;
        console.log('Medicines response:', res);
        const list = Array.isArray(res) ? res : res.data || [];
        console.log('Medicines list:', list);
        const meds = list.map((m) => ({
          id: m.id,
          name: m.name,
          price: m.price,
          stock: m.stockStatus === 'OUT_OF_STOCK' ? 'Indisponível' : 'Disponível',
          pharmacy: m.Pharmacy?.name || m.pharmacy || '',
        }));
        setMedicines(meds);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('Error loading medicines:', err);
        setError(err.response?.data?.message || err.message || 'Erro ao carregar medicamentos');
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const handlePress = (item) => navigation.navigate('EditMedicine', { id: item.id });

  const visibleMedicines = medicines.filter((item) => `${item.name} ${item.stock || ''}`.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Medicamentos cadastrados</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddMedicine')}>
          <Ionicons name="add-circle" size={28} color="#2F9E5D" />
        </TouchableOpacity>
      </View>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Pesquisar inventário" />

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2F9E5D" />
          <Text style={styles.loadingText}>Carregando medicamentos...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={32} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => window.location.reload?.() || navigation.reset({ index: 0, routes: [{ name: 'Medicamentos' }] })}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : visibleMedicines.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="package-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>Nenhum medicamento cadastrado</Text>
          <Text style={styles.emptyText}>Comece adicionando um medicamento ao catálogo.</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddMedicine')}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Adicionar medicamento</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.medicineGrid}>
          {visibleMedicines.map((item) => <View key={item.id} style={styles.medicineWrap}><MedicineCard item={item} cardStyle={styles.medicineCard} detailsLabel="Editar" onPress={() => handlePress(item)} /></View>)}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#333' },
  centerContent: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  loadingText: { fontSize: 14, color: '#64748B', marginTop: 12 },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: 12, padding: 20, alignItems: 'center' },
  errorText: { fontSize: 14, color: '#DC2626', marginTop: 12, textAlign: 'center' },
  retryButton: { marginTop: 16, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#DC2626', borderRadius: 8 },
  retryText: { color: '#FFFFFF', fontWeight: '600' },
  emptyBox: { backgroundColor: '#F1F5F9', borderRadius: 12, padding: 24, alignItems: 'center' },
  medicineGrid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  medicineWrap: { width: '48%', maxWidth: '48%', flexBasis: '48%', flexGrow: 0, flexShrink: 0, marginTop: 14 },
  medicineCard: { width: '100%', marginBottom: 0 },
  emptyText: { fontSize: 14, color: '#64748B', marginTop: 8, textAlign: 'center' },
  addButton: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#2F9E5D', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  addButtonText: { color: '#FFFFFF', fontWeight: '600' },
});
