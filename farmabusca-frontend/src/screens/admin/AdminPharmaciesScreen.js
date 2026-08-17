import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from '../../components/SearchBar';
import CustomInput from '../../components/CustomInput';
import { getAdminPharmacies, updateAdminPharmacyStatus } from '../../services/api';

export default function AdminPharmaciesScreen() {
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [province, setProvince] = useState('');
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [pharmacies, setPharmacies] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);

  const loadPharmacies = async () => {
    setLoading(true);
    try {
      const data = await getAdminPharmacies({ search, district, province, status });
      setPharmacies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log('Erro ao carregar farmácias', error.response?.data || error.message || error);
      Alert.alert('Erro', 'Não foi possível carregar as farmácias.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPharmacies();
  }, [search, district, province, status]);

  const handleStatus = async (id, action) => {
    setUpdatingId(id);
    try {
      await updateAdminPharmacyStatus(id, action);
      Alert.alert('Sucesso', 'Status da farmácia atualizado.');
      loadPharmacies();
    } catch (error) {
      console.log('Erro ao atualizar status', error.response?.data || error.message || error);
      Alert.alert('Erro', 'Não foi possível atualizar o status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleViewDocuments = (documents) => {
    if (!Array.isArray(documents) || documents.length === 0) {
      return Alert.alert('Documentos', 'Nenhum documento enviado.');
    }

    const message = documents.map((doc) => `• ${doc.originalName || 'Documento'}\n`).join('');
    Alert.alert('Documentos', message, [
      { text: 'Fechar', style: 'cancel' },
      ...(documents.some((doc) => doc.url)
        ? [{ text: 'Abrir primeiro', onPress: () => Linking.openURL(documents[0].url) }]
        : []),
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Gestão de Farmácias</Text>
      <Text style={styles.subtitle}>Busque, aprove ou suspenda farmácias e veja documentos enviados.</Text>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar nome, distrito ou província" />

      <View style={styles.filterRow}>
        <View style={styles.filterColumn}>
          <CustomInput label="Distrito" placeholder="Filtrar por distrito" value={district} onChangeText={setDistrict} />
        </View>
        <View style={[styles.filterColumn, styles.filterColumnRight]}>
          <CustomInput label="Província" placeholder="Filtrar por província" value={province} onChangeText={setProvince} />
        </View>
      </View>

      <View style={styles.statusRow}>
        {['pending', 'approved', 'suspended'].map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.statusButton, status === option ? styles.statusButtonActive : null]}
            onPress={() => setStatus(option)}
          >
            <Text style={[styles.statusText, status === option ? styles.statusTextActive : null]}>{option === 'pending' ? 'Pendente' : option === 'approved' ? 'Aprovadas' : 'Suspensas'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#1976D2" style={{ marginTop: 20 }} />
      ) : pharmacies.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Nenhuma farmácia encontrada.</Text>
        </View>
      ) : (
        pharmacies.map((pharmacy) => (
          <View key={pharmacy.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardName}>{pharmacy.name || 'Farmácia sem nome'}</Text>
                <Text style={styles.cardMeta}>{pharmacy.city || pharmacy.province || 'Localização não informada'}</Text>
              </View>
              <View style={[styles.badge, pharmacy.approved ? styles.badgeApproved : pharmacy.suspended ? styles.badgeSuspended : styles.badgePending]}>
                <Text style={styles.badgeText}>{pharmacy.suspended ? 'Suspensa' : pharmacy.approved ? 'Aprovada' : 'Pendente'}</Text>
              </View>
            </View>

            <Text style={styles.cardField}>Email: {pharmacy.User?.email || 'Não informado'}</Text>
            <Text style={styles.cardField}>Telefone: {pharmacy.phone || pharmacy.User?.phone || 'Não informado'}</Text>
            <Text style={styles.cardField}>Documentos: {Array.isArray(pharmacy.documents) ? pharmacy.documents.length : 0}</Text>

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleViewDocuments(pharmacy.documents)}>
                <Ionicons name="document-text-outline" size={18} color="#2563EB" />
                <Text style={styles.actionLabel}>Ver docs</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                disabled={updatingId === pharmacy.id}
                onPress={() => handleStatus(pharmacy.id, 'approve')}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#065F46" />
                <Text style={[styles.actionLabel, styles.approveLabel]}>Aprovar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.suspendButton]}
                disabled={updatingId === pharmacy.id}
                onPress={() => handleStatus(pharmacy.id, 'suspend')}
              >
                <Ionicons name="ban-outline" size={18} color="#B91C1C" />
                <Text style={[styles.actionLabel, styles.suspendLabel]}>Suspender</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  filterRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  filterColumn: { flex: 1, marginRight: 10 },
  filterColumnRight: { marginRight: 0 },
  filterItem: { flex: 1, marginRight: 10, padding: 12, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  filterLabel: { color: '#6B7280', fontSize: 12, marginBottom: 6 },
  filterValue: { color: '#111827', fontSize: 14, fontWeight: '700' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, marginBottom: 16 },
  statusButton: { flex: 1, marginHorizontal: 4, borderRadius: 16, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFFFFF' },
  statusButtonActive: { borderColor: '#2563EB', backgroundColor: '#DBEAFE' },
  statusText: { fontSize: 13, color: '#475569', fontWeight: '700' },
  statusTextActive: { color: '#1D4ED8' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardName: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  cardMeta: { color: '#6B7280', marginTop: 4 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontWeight: '700', fontSize: 12 },
  badgePending: { backgroundColor: '#FEF3C7' },
  badgeApproved: { backgroundColor: '#DCFCE7' },
  badgeSuspended: { backgroundColor: '#FECACA' },
  cardField: { color: '#475569', marginTop: 8, fontSize: 13 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16 },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: '#F8FAFC', marginRight: 10, marginBottom: 10 },
  actionLabel: { marginLeft: 8, color: '#2563EB', fontWeight: '700' },
  approveButton: { backgroundColor: '#ECFDF5' },
  approveLabel: { color: '#047857' },
  suspendButton: { backgroundColor: '#FEF2F2' },
  suspendLabel: { color: '#991B1B' },
  emptyState: { marginTop: 28, alignItems: 'center' },
  emptyText: { color: '#475569', fontSize: 15 },
});
