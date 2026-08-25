import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import MedicineCard from '../../components/MedicineCard';
import Header from '../../components/Header';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../components/ScreenState';
import { getPharmacyMedicines } from '../../services/api';
import { colors, spacing } from '../../theme';

export default function PharmacyMedicinesScreen({ navigation, route }) {
  const pharmacy = route.params?.pharmacy || {};
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getPharmacyMedicines(pharmacy.id);
      setItems(response.data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível carregar os medicamentos.');
    } finally {
      setLoading(false);
    }
  }, [pharmacy.id]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  return <View style={styles.container}>
    <Header title={pharmacy.name || 'Farmácia'} subtitle="Medicamentos disponíveis nesta farmácia" onBack={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home')} />
    {loading ? <View style={styles.pad}><LoadingSkeleton rows={3} /></View> : error ? <ErrorState message={error} onRetry={load} /> : <FlatList
      data={items}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => <MedicineCard item={item} onPress={() => navigation.navigate('MedicineDetails', { item })} />}
      ListEmptyComponent={<EmptyState title="Nenhum medicamento disponível" message="Esta farmácia ainda não publicou medicamentos disponíveis." />}
    />}
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.xl, paddingTop: spacing.sm, paddingBottom: 40 },
  pad: { padding: spacing.xl },
});
