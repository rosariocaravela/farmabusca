import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getPharmacies } from '../../services/api';
import { colors, radius, spacing, typography } from '../../theme';

const stockFilters = [['ALL', 'Todos'], ['AVAILABLE', 'Disponíveis']];
const radiusFilters = [['', 'Sem limite'], ['1', '1 km'], ['3', '3 km'], ['5', '5 km'], ['10', '10 km']];
const defaults = { filter: 'ALL', pharmacy: '', location: '', radiusKm: '' };

export default function MedicineFiltersScreen({ navigation, route }) {
  const initial = { ...defaults, ...(route.params?.filters || {}) };
  const [filter, setFilter] = useState(initial.filter);
  const [pharmacy, setPharmacy] = useState(initial.pharmacy);
  const [location, setLocation] = useState(initial.location);
  const [radiusKm, setRadiusKm] = useState(String(initial.radiusKm || ''));
  const [pharmacies, setPharmacies] = useState([]);
  const [pharmaciesLoading, setPharmaciesLoading] = useState(true);
  const filters = { filter, pharmacy, location, radiusKm };
  const chip = (id, label, value, setter) => <TouchableOpacity key={label} style={[styles.chip, value === id && styles.chipActive]} onPress={() => setter(id)}><Text style={[styles.chipText, value === id && styles.chipTextActive]}>{label}</Text></TouchableOpacity>;

  useEffect(() => {
    getPharmacies().then((response) => setPharmacies(response.data || [])).catch(() => setPharmacies([])).finally(() => setPharmaciesLoading(false));
  }, []);

  const zones = useMemo(() => [...new Set(pharmacies.map((item) => item.district || item.city || item.province || item.location).filter(Boolean))].sort(), [pharmacies]);
  const zonePharmacies = useMemo(() => pharmacies.filter((item) => {
    if (!location) return false;
    return [item.district, item.city, item.province, item.location, item.address].filter(Boolean).some((value) => value.toLowerCase().includes(location.toLowerCase()));
  }), [pharmacies, location]);

  const clear = () => {
    setFilter(defaults.filter); setPharmacy(''); setLocation(''); setRadiusKm('');
  };

  return <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}><Text style={styles.backText}>Voltar</Text></TouchableOpacity>
      <Text style={styles.title}>Filtros</Text><Text style={styles.subtitle}>Refine os medicamentos encontrados.</Text>
    </View>
    <Text style={styles.sectionTitle}>Disponibilidade</Text><View style={styles.chips}>{stockFilters.map(([id, label]) => chip(id, label, filter, setFilter))}</View>
    <Text style={styles.sectionTitle}>Zona</Text>
    <Text style={styles.help}>Selecione uma zona para ver as farmácias disponíveis.</Text>
    {pharmaciesLoading ? <Text style={styles.loadingText}>A carregar zonas...</Text> : <View style={styles.chips}>{zones.map((zone) => chip(zone, zone, location, (value) => { setLocation(value); setPharmacy(''); }))}</View>}
    {location ? <><Text style={styles.sectionTitle}>Farmácia da zona</Text><View style={styles.chips}>{zonePharmacies.map((item) => chip(item.name, item.name, pharmacy, setPharmacy))}</View>{!zonePharmacies.length && !pharmaciesLoading ? <Text style={styles.help}>Nenhuma farmácia encontrada nesta zona.</Text> : null}</> : null}
    <Text style={styles.sectionTitle}>Raio de proximidade</Text><Text style={styles.help}>O raio é aplicado quando autorizar a localização no ecrã de pesquisa.</Text><View style={styles.chips}>{radiusFilters.map(([id, label]) => chip(id, label, radiusKm, setRadiusKm))}</View>
    <TouchableOpacity style={styles.applyButton} onPress={() => navigation.navigate('SearchList', { filters })}><Text style={styles.applyText}>Aplicar filtros</Text></TouchableOpacity>
    <TouchableOpacity style={styles.clearButton} onPress={clear}><Text style={styles.clearText}>Limpar filtros</Text></TouchableOpacity>
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background }, content: { padding: spacing.xl, paddingBottom: 40 }, header: { marginBottom: spacing.xl }, backButton: { alignSelf: 'flex-start', marginBottom: spacing.md }, backText: { color: colors.primaryDark, fontWeight: '700' }, title: { ...typography.title, color: colors.text }, subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs }, sectionTitle: { ...typography.heading, color: colors.text, marginBottom: spacing.md, marginTop: spacing.sm }, help: { ...typography.caption, color: colors.textSecondary, marginTop: -8, marginBottom: spacing.md }, loadingText: { color: colors.textSecondary, marginBottom: spacing.lg }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg }, chip: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, chipActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary }, chipText: { color: colors.textSecondary, fontWeight: '700' }, chipTextActive: { color: colors.primaryDark }, applyButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: radius.md, marginTop: spacing.md, paddingVertical: 14 }, applyText: { color: colors.surface, fontWeight: '700' }, clearButton: { alignItems: 'center', paddingVertical: 14 }, clearText: { color: colors.primaryDark, fontWeight: '700' },
});
