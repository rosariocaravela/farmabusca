import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MedicineCard from '../../components/MedicineCard';
import PharmacyCard from '../../components/PharmacyCard';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../components/ScreenState';
import { getFavorites, getPharmacyFavorites, removeFavorite, removePharmacyFavorite } from '../../services/api';
import { colors, radius, spacing, typography } from '../../theme';

const filters = [['ALL', 'Todos'], ['AVAILABLE', 'Disponíveis']];

const getStockStatus = (item) => {
	if (item.stockStatus) return item.stockStatus;
	const stock = String(item.stock || '').toLowerCase();
	if (stock.includes('baixo')) return 'LOW_STOCK';
	if (stock.includes('indis')) return 'OUT_OF_STOCK';
	return 'AVAILABLE';
};

export default function FavoritesScreen({ navigation }) {
	const [items, setItems] = useState([]);
	const [pharmacies, setPharmacies] = useState([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState('');
	const [filter, setFilter] = useState('ALL');
	const [sort, setSort] = useState('name');
	const { width } = useWindowDimensions();
	const columns = width >= 900 ? 3 : 2;
	const gap = spacing.md;
	const cardWidth = (width - (spacing.xl * 2) - (gap * (columns - 1))) / columns;

	const load = useCallback(async (refresh = false) => {
		refresh ? setRefreshing(true) : setLoading(true);
		setError('');
		try {
			const [response, pharmacyResponse] = await Promise.all([getFavorites(), getPharmacyFavorites()]);
			setItems((response.data || []).map((favorite) => ({ ...favorite.Medicine, favoriteId: favorite.id })).filter((item) => item.id));
			setPharmacies((pharmacyResponse.data || []).map((favorite) => favorite.Pharmacy).filter(Boolean));
		} catch (requestError) {
			setError(requestError.response ? 'Não foi possível carregar os favoritos.' : 'Sem ligação à Internet.');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, []);

	useFocusEffect(useCallback(() => {
		load();
	}, [load]));

	const results = useMemo(() => items
		.filter((item) => filter === 'ALL' || getStockStatus(item) === filter)
		.sort((first, second) => sort === 'price'
			? Number(first.price || 0) - Number(second.price || 0)
			: String(first.name || '').localeCompare(String(second.name || ''))), [items, filter, sort]);

	const remove = async (id) => {
		try {
			await removeFavorite(id);
			setItems((current) => current.filter((item) => item.id !== id));
		} catch (requestError) {
			setError('Não foi possível remover o favorito.');
		}
	};
	const removePharmacy = async (id) => {
		try {
			await removePharmacyFavorite(id);
			setPharmacies((current) => current.filter((item) => item.id !== id));
		} catch (_error) {
			setError('Não foi possível remover a farmácia favorita.');
		}
	};

	const clearFilters = () => {
		setFilter('ALL');
		setSort('name');
	};

	return <View style={styles.container}>
		<View style={styles.header}>
			<Text style={styles.title}>Favoritos</Text>
			<Text style={styles.subtitle}>Medicamentos guardados para consultar rapidamente.</Text>
		</View>
		<View style={styles.filters}>
			{filters.map(([id, label]) => <TouchableOpacity key={id} style={[styles.chip, filter === id && styles.chipActive]} onPress={() => setFilter(id)} accessibilityRole="button" accessibilityState={{ selected: filter === id }}>
				<Text style={[styles.chipText, filter === id && styles.chipTextActive]}>{label}</Text>
			</TouchableOpacity>)}
			<TouchableOpacity style={styles.chip} onPress={() => setSort((current) => current === 'name' ? 'price' : 'name')} accessibilityRole="button">
				<Text style={styles.chipText}>Ordenar: {sort === 'name' ? 'nome' : 'preço'}</Text>
			</TouchableOpacity>
		</View>
		{!loading && !error ? <Text style={styles.count}>{results.length} {results.length === 1 ? 'medicamento guardado' : 'medicamentos guardados'}</Text> : null}
		{loading ? <View style={styles.pad}><LoadingSkeleton rows={4} /></View> : error && !items.length ? <ErrorState message={error} onRetry={load} /> : <FlatList
			data={results}
			key={String(columns)}
			keyExtractor={(item) => String(item.id)}
			numColumns={columns}
			columnWrapperStyle={styles.column}
			contentContainerStyle={styles.list}
			ListHeaderComponent={pharmacies.length ? <View style={styles.pharmacySection}><Text style={styles.sectionTitle}>Farmácias guardadas</Text>{pharmacies.map((pharmacy) => <View key={pharmacy.id} style={styles.pharmacyFavorite}><PharmacyCard item={pharmacy} onPress={() => navigation.navigate('PharmacyMedicines', { pharmacy })} onViewMedicines={() => navigation.navigate('PharmacyMedicines', { pharmacy })} /><TouchableOpacity style={styles.removePharmacy} onPress={() => removePharmacy(pharmacy.id)}><Text style={styles.removePharmacyText}>Remover dos favoritos</Text></TouchableOpacity></View>)}<Text style={styles.sectionTitle}>Medicamentos guardados</Text></View> : null}
			refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
			renderItem={({ item }) => <MedicineCard item={item} cardStyle={{ width: cardWidth }} favorite onFavorite={() => remove(item.id)} onPress={() => navigation.navigate('MedicineDetails', { item })} />}
			ListEmptyComponent={<EmptyState title={items.length ? 'Nenhum favorito neste filtro' : 'Ainda não guardou medicamentos'} message={items.length ? 'Experimente outro filtro para ver os seus medicamentos.' : 'Toque no coração de um medicamento para encontrá-lo aqui.'} icon="heart-outline" actionLabel={items.length ? 'Limpar filtros' : 'Pesquisar medicamentos'} onAction={items.length ? clearFilters : () => navigation.navigate('Pesquisar')} />}
		/>}
	</View>;
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.background },
	header: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
	title: { ...typography.title, color: colors.text },
	subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
	filters: { flexDirection: 'row', paddingHorizontal: spacing.xl, paddingTop: spacing.lg, gap: 8, flexWrap: 'wrap' },
	chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
	chipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
	chipText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
	chipTextActive: { color: colors.primaryDark },
	count: { color: colors.textSecondary, fontSize: 13, paddingHorizontal: spacing.xl, marginTop: 14 },
	list: { padding: spacing.xl, paddingTop: 12, paddingBottom: 40, flexGrow: 1 },
	column: { justifyContent: 'space-between', gap: spacing.md },
	pad: { padding: spacing.xl },
	pharmacySection: { width: '100%', marginBottom: spacing.md }, pharmacyFavorite: { marginBottom: spacing.md }, removePharmacy: { alignSelf: 'flex-end', marginTop: -6, paddingHorizontal: 10, paddingVertical: 8 }, removePharmacyText: { color: colors.error, fontWeight: '700', fontSize: 12 }, sectionTitle: { ...typography.heading, color: colors.text, marginBottom: spacing.sm, marginTop: spacing.sm },
});
