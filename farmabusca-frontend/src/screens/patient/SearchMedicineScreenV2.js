import React, { useEffect, useMemo, useState } from 'react';
import { Alert, View, Text, FlatList, Linking, Platform, TouchableOpacity, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import SearchBar from '../../components/SearchBar';
import MedicineCard from '../../components/MedicineCard';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../components/ScreenState';
import { getFavorites, getMedicines, searchMedicines, addFavorite, removeFavorite } from '../../services/api';
import { colors, radius, spacing, typography } from '../../theme';

const defaultFilters = { filter: 'ALL', sort: 'name', pharmacy: '', location: '', radiusKm: '' };

export default function SearchMedicineScreen({ navigation, route }) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState(defaultFilters.filter);
  const [sort, setSort] = useState(defaultFilters.sort);
  const [reload, setReload] = useState(0);
  const [pharmacy, setPharmacy] = useState(defaultFilters.pharmacy);
  const [location, setLocation] = useState(defaultFilters.location);
  const [radiusKm, setRadiusKm] = useState(defaultFilters.radiusKm);
  const [coordinates, setCoordinates] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');

  useEffect(() => {
    const nextFilters = { ...defaultFilters, ...(route.params?.filters || {}) };
    setFilter(nextFilters.filter);
    setSort(nextFilters.sort);
    setPharmacy(nextFilters.pharmacy);
    setLocation(nextFilters.location);
    setRadiusKm(nextFilters.radiusKm);
  }, [route.params?.filters]);

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
        const params = {
          ...(filter !== 'ALL' ? { stockStatus: filter } : {}),
          ...(pharmacy.trim() ? { pharmacy: pharmacy.trim() } : {}),
          ...(location.trim() ? { location: location.trim() } : {}),
          ...(coordinates ? { latitude: coordinates.latitude, longitude: coordinates.longitude } : {}),
          ...(coordinates && radiusKm ? { radiusKm } : {}),
          sort: sort === 'price' ? 'price_asc' : sort,
        };
        const response = query.trim() ? await searchMedicines(query.trim(), params) : await getMedicines(params);
        if (active) setItems(response.data || []);
      } catch (requestError) {
        if (active) setError(requestError.response ? 'Não foi possível pesquisar agora.' : 'Sem ligação à Internet.');
      } finally {
        if (active) setLoading(false);
      }
    }, 350);
    return () => { active = false; clearTimeout(timer); };
  }, [query, filter, sort, pharmacy, location, radiusKm, coordinates, reload]);

  const results = useMemo(() => items, [items]);

  const useMyLocation = async (nearby = false) => {
    setLocationLoading(true);
    setLocationMessage('A obter a sua localização...');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setCoordinates(null);
        setLocationMessage('Permissão recusada. Pode continuar com a pesquisa manual por bairro ou endereço nos filtros.');
        return;
      }
      if (!await Location.hasServicesEnabledAsync()) {
        setCoordinates(null);
        setLocationMessage('O GPS está desactivado. Active-o ou utilize a localização textual nos filtros.');
        return;
      }
      const position = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000)),
      ]);
      setCoordinates({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      setSort('distance');
      if (nearby && !radiusKm) setRadiusKm('5');
      setLocationMessage('Localização utilizada apenas nesta pesquisa. Resultados ordenados por proximidade.');
    } catch (locationError) {
      setCoordinates(null);
      setLocationMessage(locationError.message === 'timeout' ? 'A localização demorou demasiado. Tente novamente ou pesquise manualmente.' : 'Não foi possível obter a localização. Pode pesquisar manualmente.');
    } finally {
      setLocationLoading(false);
    }
  };

  const openMap = (item) => {
    const target = item.Pharmacy;
    if (target?.latitude == null || target?.longitude == null) return Alert.alert('Mapa indisponível', 'Esta farmácia ainda não possui coordenadas registadas.');
    const destination = `${target.latitude},${target.longitude}`;
    return Linking.openURL(Platform.OS === 'web' ? `https://www.google.com/maps/dir/?api=1&destination=${destination}` : `https://www.google.com/maps/dir/?api=1&destination=${destination}`);
  };

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
      <View style={styles.titleRow}><View><Text style={styles.title}>Pesquisar</Text><Text style={styles.subtitle}>Medicamentos encontrados nas farmácias.</Text></View><TouchableOpacity style={styles.filterButton} onPress={() => navigation.navigate('MedicineFilters', { filters: { filter, sort, pharmacy, location, radiusKm } })}><Text style={styles.filterButtonText}>Filtros</Text></TouchableOpacity></View>
      <SearchBar value={query} onChangeText={setQuery} placeholder="Nome do medicamento" />
      <View style={styles.locationActions}><TouchableOpacity style={styles.locationButton} disabled={locationLoading} onPress={() => useMyLocation(false)}><Text style={styles.locationButtonText}>Usar minha localização</Text></TouchableOpacity><TouchableOpacity style={styles.nearbyButton} disabled={locationLoading} onPress={() => useMyLocation(true)}><Text style={styles.nearbyText}>Farmácias próximas</Text></TouchableOpacity></View>
      {locationMessage ? <Text style={styles.locationMessage}>{locationMessage}</Text> : null}
    </View>
    {!loading && !error ? <Text style={styles.count}>{results.length} {results.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}</Text> : null}
    {loading ? <View style={styles.pad}><LoadingSkeleton rows={4} /></View> : error ? <ErrorState message={error} onRetry={() => setReload((value) => value + 1)} /> : <FlatList
      data={results}
      numColumns={2}
      columnWrapperStyle={styles.gridRow}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => <MedicineCard item={item} cardStyle={styles.gridCard} favorite={favoriteIds.includes(item.id)} onFavorite={() => toggleFavorite(item.id)} onMap={() => openMap(item)} onPress={() => navigation.navigate('MedicineDetails', { item })} />}
      ListEmptyComponent={<EmptyState title="Nenhum medicamento encontrado" message="Não existem resultados neste raio ou com estes filtros. Ajuste os filtros e tente novamente." icon="search-outline" actionLabel="Abrir filtros" onAction={() => navigation.navigate('MedicineFilters', { filters: { filter, sort, pharmacy, location, radiusKm } })} />}
    />}
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.xl, paddingBottom: 12 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md, marginBottom: 16 },
  title: { ...typography.title, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
  filterButton: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primary },
  filterButtonText: { color: colors.primaryDark, fontWeight: '700' },
  locationActions: { flexDirection: 'row', gap: 8, marginTop: 10 }, locationButton: { flex: 1, padding: 10, borderRadius: radius.md, backgroundColor: colors.primary }, locationButtonText: { color: colors.surface, fontWeight: '800', textAlign: 'center', fontSize: 12 }, nearbyButton: { flex: 1, padding: 10, borderRadius: radius.md, backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primary }, nearbyText: { color: colors.primaryDark, fontWeight: '800', textAlign: 'center', fontSize: 12 }, locationMessage: { ...typography.caption, color: colors.textSecondary, marginTop: 8 },
  count: { color: colors.textSecondary, fontSize: 13, paddingHorizontal: spacing.xl, marginTop: 14 },
  list: { padding: spacing.xl, paddingTop: 12, flexGrow: 1 },
  gridRow: { justifyContent: 'space-between', gap: 12 },
  gridCard: { width: '48%' },
  pad: { padding: spacing.xl },
});
