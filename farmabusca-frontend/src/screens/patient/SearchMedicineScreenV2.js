import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import SearchBar from '../../components/SearchBar';
import MedicineCard from '../../components/MedicineCard';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../components/ScreenState';
import { getFavorites, getMedicines, searchMedicines, addFavorite, removeFavorite } from '../../services/api';
import { colors, radius, spacing, typography } from '../../theme';

const filters = [['ALL', 'Todos'], ['AVAILABLE', 'Disponíveis'], ['LOW_STOCK', 'Poucas unidades']];

export default function SearchMedicineScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [sort, setSort] = useState('name');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    getFavorites().then((response) => {
      if (active) setFavoriteIds((response.data || []).map((item) => item.MedicineId || item.Medicine?.id).filter(Boolean));
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const response = query.trim() ? await searchMedicines(query.trim()) : await getMedicines();
        if (active) setItems(response.data || []);
      } catch (requestError) {
        if (active) setError(requestError.response ? 'Não foi possível pesquisar agora.' : 'Sem ligação à Internet.');
      } finally {
        if (active) setLoading(false);
      }
    }, 350);
    return () => { active = false; clearTimeout(timer); };
  }, [query, reload]);

  const results = useMemo(() => items.filter((item) => filter === 'ALL' || item.stockStatus === filter).sort((a, b) => (
    sort === 'price' ? Number(a.price) - Number(b.price) : String(a.name).localeCompare(String(b.name))
  )), [items, filter, sort]);

  const toggleFavorite = async (id) => {
    const isFavorite = favoriteIds.includes(id);
    setFavoriteIds((current) => isFavorite ? current.filter((favoriteId) => favoriteId !== id) : [...current, id]);
    try {
      if (isFavorite) await removeFavorite(id);
      else await addFavorite(id);
    } catch (requestError) {
      setFavoriteIds((current) => isFavorite ? [...current, id] : current.filter((favoriteId) => favoriteId !== id));
      if (requestError.response?.status !== 400) setError('Não foi possível atualizar os favoritos.');
    }
  };

  return <View style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.title}>Pesquisar</Text>
      <Text style={styles.subtitle}>Compare disponibilidade e preços nas farmácias.</Text>
      <SearchBar value={query} onChangeText={setQuery} placeholder="Nome do medicamento" />
    </View>
    <View style={styles.chips}>
      {filters.map(([id, label]) => <TouchableOpacity key={id} style={[styles.chip, filter === id && styles.chipActive]} onPress={() => setFilter(id)}>
        <Text style={[styles.chipText, filter === id && styles.chipTextActive]}>{label}</Text>
      </TouchableOpacity>)}
      <TouchableOpacity style={styles.chip} onPress={() => setSort(sort === 'name' ? 'price' : 'name')}>
        <Text style={styles.chipText}>Ordenar: {sort === 'name' ? 'nome' : 'preço'}</Text>
      </TouchableOpacity>
    </View>
    {!loading && !error ? <Text style={styles.count}>{results.length} {results.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}</Text> : null}
    {loading ? <View style={styles.pad}><LoadingSkeleton rows={4} /></View> : error ? <ErrorState message={error} onRetry={() => setReload((value) => value + 1)} /> : <FlatList
      data={results}
      numColumns={2}
      columnWrapperStyle={styles.gridRow}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => <MedicineCard item={item} cardStyle={styles.gridCard} favorite={favoriteIds.includes(item.id)} onFavorite={() => toggleFavorite(item.id)} onPress={() => navigation.navigate('MedicineDetails', { item })} />}
      ListEmptyComponent={<EmptyState title="Nenhum medicamento encontrado" message="Experimente outro nome ou limpe os filtros." icon="search-outline" actionLabel="Limpar filtros" onAction={() => { setQuery(''); setFilter('ALL'); }} />}
    />}
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.xl, paddingBottom: 12 },
  title: { ...typography.title, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 4, marginBottom: 16 },
  chips: { flexDirection: 'row', paddingHorizontal: spacing.xl, gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  chipTextActive: { color: colors.primaryDark },
  count: { color: colors.textSecondary, fontSize: 13, paddingHorizontal: spacing.xl, marginTop: 14 },
  list: { padding: spacing.xl, paddingTop: 12, flexGrow: 1 },
  gridRow: { justifyContent: 'space-between', gap: 12 },
  gridCard: { width: '48%' },
  pad: { padding: spacing.xl },
});
