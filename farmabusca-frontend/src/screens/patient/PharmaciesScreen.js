import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PharmacyCard from '../../components/PharmacyCard';
import CustomInput from '../../components/CustomInput';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../components/ScreenState';
import { getPharmacies } from '../../services/api';
import { colors, spacing, typography } from '../../theme';

export default function PharmaciesScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [visibleCount, setVisibleCount] = useState(4);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');

  const load = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try {
      const response = await getPharmacies({
        ...(name.trim() ? { name: name.trim() } : {}),
        ...(location.trim() ? { location: location.trim() } : {}),
      });
      setItems(response.data || []);
      setVisibleCount(4);
    } catch (requestError) {
      setError(requestError.response ? 'Não foi possível carregar as farmácias.' : 'Sem ligação à Internet.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [name, location]);

  useEffect(() => { load(); }, [load]);

  return <View style={styles.container}>
    <View style={styles.header}><Text style={styles.title}>Farmácias</Text><Text style={styles.subtitle}>Encontre farmácias aprovadas perto de si.</Text></View>
    <View style={styles.filters}>
      <CustomInput label="Pesquisar farmácia" value={name} onChangeText={setName} placeholder="Nome da farmácia" icon="search-outline" />
      <CustomInput label="Localização" value={location} onChangeText={setLocation} placeholder="Província, distrito ou endereço" icon="location-outline" />
      {name || location ? <TouchableOpacity style={styles.clearButton} onPress={() => { setName(''); setLocation(''); }}><Text style={styles.clearText}>Limpar filtros</Text></TouchableOpacity> : null}
    </View>
    {loading ? <View style={styles.pad}><LoadingSkeleton rows={4} /></View> : error && !items.length ? <ErrorState message={error} onRetry={load} /> : <FlatList
      data={items.slice(0, visibleCount)}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
      renderItem={({ item }) => <PharmacyCard item={item} onPress={() => navigation.navigate('PharmacyMedicines', { pharmacy: item })} onViewMedicines={() => navigation.navigate('PharmacyMedicines', { pharmacy: item })} />}
      onEndReached={() => setVisibleCount((count) => Math.min(count + 4, items.length))}
      onEndReachedThreshold={0.4}
      ListEmptyComponent={<EmptyState title="Nenhuma farmácia encontrada" message="As farmácias aprovadas aparecerão aqui." />}
    />}
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.xl, paddingBottom: spacing.md },
  title: { ...typography.title, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  filters: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  clearButton: { alignSelf: 'flex-start', marginTop: -4, marginBottom: spacing.sm, paddingVertical: spacing.xs },
  clearText: { color: colors.primaryDark, fontWeight: '700' },
  list: { padding: spacing.xl, paddingTop: spacing.sm, paddingBottom: 40, flexGrow: 1 },
  pad: { padding: spacing.xl },
});
