import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from '../../components/SearchBar';
import MedicineCard from '../../components/MedicineCard';
import { getAdminMedicines } from '../../services/api';

export default function AdminMedicinesScreen() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState([]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set();
    medicines.forEach((item) => {
      const categoryName = item.Category?.name || item.category;
      if (categoryName) uniqueCategories.add(categoryName);
    });
    return Array.from(uniqueCategories).sort();
  }, [medicines]);

  const loadMedicines = async () => {
    setLoading(true);
    try {
      const data = await getAdminMedicines({ search, category });
      setMedicines(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log('Erro ao carregar medicamentos', error.response?.data || error.message || error);
      Alert.alert('Erro', 'Não foi possível carregar os medicamentos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, [search, category]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Medicamentos</Text>
      <Text style={styles.subtitle}>Acompanhe o catálogo nacional e veja quais medicamentos estão em falta.</Text>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Pesquisar medicamento" />

      <View style={styles.categorySection}>
        <Text style={styles.filterLabel}>Filtrar por categoria</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelector} contentContainerStyle={styles.categorySelectorContent}>
          <TouchableOpacity
            style={[styles.categoryPill, category === '' ? styles.categoryPillActive : null]}
            onPress={() => setCategory('')}
          >
            <Text style={[styles.categoryPillText, category === '' ? styles.categoryPillTextActive : null]}>Todas</Text>
          </TouchableOpacity>
          {categories.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.categoryPill, category === item ? styles.categoryPillActive : null]}
              onPress={() => setCategory(item)}
            >
              <Text style={[styles.categoryPillText, category === item ? styles.categoryPillTextActive : null]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1976D2" style={{ marginTop: 20 }} />
      ) : medicines.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Nenhum medicamento encontrado.</Text>
        </View>
      ) : (
        medicines.map((item) => (
          <MedicineCard key={item.id} item={{
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            stock: item.stockStatus === 'AVAILABLE' ? 'Disponível' : item.stockStatus === 'LOW_STOCK' ? 'Stock baixo' : 'Indisponível',
            pharmacy: item.Pharmacy?.name || '',
            image: item.image,
          }} onPress={() => Alert.alert('Medicamento', item.name || 'Detalhes')} />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: '#1F2937', marginBottom: 6 },
  subtitle: { color: '#475569', fontSize: 14, marginBottom: 18 },
  filterRow: { marginBottom: 16 },
  filterLabel: { color: '#6B7280', fontSize: 12, marginBottom: 8 },
  filterInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  filterText: { color: '#111827', fontSize: 14 },
  categorySection: { marginBottom: 16 },
  categorySelector: { paddingVertical: 4 },
  categorySelectorContent: { alignItems: 'center' },
  categoryPill: { marginRight: 10, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  categoryPillActive: { backgroundColor: '#DBEAFE', borderColor: '#93C5FD' },
  categoryPillText: { color: '#475569', fontSize: 13, fontWeight: '700' },
  categoryPillTextActive: { color: '#1D4ED8' },
  emptyState: { marginTop: 28, alignItems: 'center' },
  emptyText: { color: '#475569', fontSize: 15 },
});