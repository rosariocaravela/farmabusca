import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAdminSummary } from '../../services/api';

export default function AdminMapScreen() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await getAdminSummary();
      setSummary(data);
    } catch (error) {
      console.log('Erro ao carregar dados do mapa', error.response?.data || error.message || error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do mapa.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Mapa Nacional</Text>
      <Text style={styles.subtitle}>Visualize a distribuição das farmácias aprovadas por província.</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#1976D2" style={{ marginTop: 32 }} />
      ) : (
        <>
          <View style={styles.summaryRow}>
            <View style={styles.infoCard}>
              <Text style={styles.infoValue}>{summary?.approvedPharmacies ?? 0}</Text>
              <Text style={styles.infoLabel}>Farmácias aprovadas</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoValue}>{summary?.provincesCount ?? 0}</Text>
              <Text style={styles.infoLabel}>Províncias com farmácias</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.infoCard}>
              <Text style={styles.infoValue}>{summary?.availableMedicines ?? 0}</Text>
              <Text style={styles.infoLabel}>Medicamentos disponíveis</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoValue}>{summary?.outOfStockMedicines ?? 0}</Text>
              <Text style={styles.infoLabel}>Medicamentos esgotados</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.infoCardFull}>
              <Text style={styles.infoValue}>{summary?.lowStockMedicines ?? 0}</Text>
              <Text style={styles.infoLabel}>Medicamentos com stock baixo</Text>
            </View>
          </View>

          <View style={styles.provinceSection}>
            <Text style={styles.provinceTitle}>Distribuição por província</Text>
            {Array.isArray(summary?.pharmaciesByProvince) && summary.pharmaciesByProvince.length > 0 ? (
              summary.pharmaciesByProvince.map((item) => (
                <View key={item.province || 'sem-provincia'} style={styles.provinceRow}>
                  <Text style={styles.provinceName}>{item.province || 'Não informado'}</Text>
                  <Text style={styles.provinceCount}>{item.count}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Nenhuma província registrada ainda.</Text>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: '#1F2937', marginBottom: 6 },
  subtitle: { color: '#475569', fontSize: 14, marginBottom: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap' },
  infoCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#E5E7EB', marginRight: 12, minWidth: '48%', marginBottom: 12 },
  infoCardLast: { marginRight: 0 },
  infoCardFull: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#E5E7EB', width: '100%', marginBottom: 12 },
  infoValue: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  infoLabel: { marginTop: 8, color: '#475569', fontSize: 13 },
  provinceSection: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  provinceTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  provinceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  provinceName: { color: '#334155', fontSize: 13 },
  provinceCount: { color: '#0F172A', fontWeight: '700', fontSize: 13 },
  emptyText: { color: '#475569', fontSize: 14, textAlign: 'center', paddingVertical: 10 },
});