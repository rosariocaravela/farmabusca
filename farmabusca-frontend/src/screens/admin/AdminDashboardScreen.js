import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/Header';
import DashboardCard from '../../components/DashboardCard';
import { useAuth } from '../../context/AuthContext';
import { getPendingPharmacies, getAdminSummary, approvePharmacy } from '../../services/api';

export default function AdminDashboardScreen() {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [approvingId, setApprovingId] = useState(null);

  const loadPharmacies = async () => {
    setLoading(true);
    try {
      const data = await getPendingPharmacies();
      setPharmacies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log('Erro ao carregar farmácias pendentes', error.response?.data || error.message || error);
      Alert.alert('Erro', 'Não foi possível carregar as farmácias pendentes.');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const data = await getAdminSummary();
      setAnalytics(data);
    } catch (error) {
      console.log('Erro ao carregar estatísticas administrativas', error.response?.data || error.message || error);
      Alert.alert('Erro', 'Não foi possível carregar os dados agregados.');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    loadPharmacies();
    loadAnalytics();
  }, []);

  const handleApprove = async (id) => {
    setApprovingId(id);
    try {
      await approvePharmacy(id);
      setPharmacies((current) => current.filter((item) => item.id !== id));
      Alert.alert('Sucesso', 'Farmácia aprovada com sucesso.');
    } catch (error) {
      console.log('Erro ao aprovar farmácia', error.response?.data || error.message || error);
      Alert.alert('Erro', 'Não foi possível aprovar a farmácia.');
    } finally {
      setApprovingId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await logout('Login');
    } catch (err) {
      console.warn('Logout failed', err);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Header
        title="Administração"
        subtitle="Farmácias pendentes"
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
        right={(
          <TouchableOpacity onPress={handleLogout} style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.title}>Administração de Farmácias</Text>
      <Text style={styles.subtitle}>Avalie e aprove farmácias antes de liberá-las para os pacientes.</Text>

      {analyticsLoading ? (
        <ActivityIndicator size="small" color="#1976D2" style={{ marginVertical: 12 }} />
      ) : analytics ? (
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <DashboardCard title="Pacientes" value={`${analytics.totalPatients ?? 0}`} color="#ECFDF5" />
            <DashboardCard title="Utilizadores suspensos" value={`${analytics.suspendedUsers ?? 0}`} color="#FEE2E2" />
          </View>
          <View style={styles.summaryRow}>
            <DashboardCard title="Aprovadas" value={`${analytics.approvedPharmacies}`} color="#E8F7EE" />
            <DashboardCard title="Pendentes" value={`${analytics.pendingPharmacies}`} color="#FEF3F2" />
          </View>
          <View style={styles.summaryRow}>
            <DashboardCard title="Suspensas" value={`${analytics.suspendedPharmacies}`} color="#FEE2E2" />
            <DashboardCard title="Províncias" value={`${analytics.provincesCount}`} color="#EFF6FF" />
          </View>
          <View style={styles.summaryRow}>
            <DashboardCard title="Medicamentos" value={`${analytics.totalMedicines}`} color="#EFF6FF" />
            <DashboardCard title="Disponíveis" value={`${analytics.availableMedicines}`} color="#F5F3FF" />
          </View>
          <View style={styles.summaryRow}>
            <DashboardCard title="Indisponíveis" value={`${analytics.outOfStockMedicines}`} color="#FCE7F3" />
          </View>
          {Array.isArray(analytics.pharmaciesByProvince) && analytics.pharmaciesByProvince.length > 0 ? (
            <View style={styles.provinceSection}>
              <Text style={styles.provinceTitle}>Farmácias por província</Text>
              {analytics.pharmaciesByProvince.map((item) => (
                <View key={item.province || 'sem-provincia'} style={styles.provinceRow}>
                  <Text style={styles.provinceName}>{item.province || 'Não informado'}</Text>
                  <Text style={styles.provinceCount}>{item.count}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator size="large" color="#1976D2" style={{ marginTop: 32 }} />
      ) : pharmacies.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Não há farmácias pendentes para aprovação no momento.</Text>
        </View>
      ) : (
        pharmacies.map((pharmacy) => (
          <View key={pharmacy.id} style={styles.card}>
            {pharmacy.image ? (
              <Image source={{ uri: pharmacy.image }} style={styles.thumbnail} />
            ) : null}
            <Text style={styles.cardName}>{pharmacy.name || 'Farmácia sem nome'}</Text>
            {pharmacy.description ? <Text style={styles.cardDescription}>{pharmacy.description}</Text> : null}
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Proprietário:</Text>
              <Text style={styles.metaValue}>{pharmacy.User?.name || 'Não informado'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Email:</Text>
              <Text style={styles.metaValue}>{pharmacy.User?.email || 'Não informado'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Telefone:</Text>
              <Text style={styles.metaValue}>{pharmacy.phone || pharmacy.User?.phone || 'Não informado'}</Text>
            </View>
            {pharmacy.whatsapp ? <View style={styles.metaRow}><Text style={styles.metaLabel}>WhatsApp:</Text><Text style={styles.metaValue}>{pharmacy.whatsapp}</Text></View> : null}
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>NUIT:</Text>
              <Text style={styles.metaValue}>{pharmacy.nuit || 'Não informado'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Endereço:</Text>
              <Text style={styles.metaValue}>{pharmacy.address || 'Não informado'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Província:</Text>
              <Text style={styles.metaValue}>{pharmacy.province || 'Não informado'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Distrito:</Text>
              <Text style={styles.metaValue}>{pharmacy.district || pharmacy.city || 'Não informado'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Horário:</Text>
              <Text style={styles.metaValue}>{pharmacy.openingHours || 'Não informado'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Documentos:</Text>
              <Text style={styles.metaValue}>{Array.isArray(pharmacy.documents) ? pharmacy.documents.length : 0} enviados</Text>
            </View>
            <View style={styles.actionRow}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{pharmacy.approved ? 'Aprovada' : 'Aguardando aprovação'}</Text>
              </View>
              <TouchableOpacity
                style={[styles.button, approvingId === pharmacy.id ? styles.buttonDisabled : null]}
                onPress={() => Alert.alert('Aprovar farmácia?', `Confirma a aprovação de ${pharmacy.name || 'esta farmácia'}?`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Aprovar', onPress: () => handleApprove(pharmacy.id) }])}
                disabled={approvingId === pharmacy.id}
              >
                <Text style={styles.buttonText}>{approvingId === pharmacy.id ? 'Aprovando...' : 'Aprovar'}</Text>
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
  content: { padding: 20, paddingBottom: 32 },
  title: { fontSize: 26, fontWeight: '800', color: '#1F2937', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#4B5563', marginBottom: 20 },
  emptyState: { marginTop: 40, alignItems: 'center' },
  emptyText: { color: '#475569', fontSize: 15 },
  summarySection: { marginBottom: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  provinceSection: { marginTop: 14, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  provinceTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 10 },
  provinceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  provinceName: { color: '#334155', fontSize: 13 },
  provinceCount: { color: '#0F172A', fontWeight: '700', fontSize: 13 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  thumbnail: { width: '100%', height: 160, borderRadius: 16, marginBottom: 14 },
  cardName: { fontSize: 18, fontWeight: '800', color: '#1F2937', marginBottom: 6 },
  cardDescription: { color: '#475569', fontSize: 14, marginBottom: 12, lineHeight: 20 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  metaLabel: { color: '#6B7280', fontSize: 13, fontWeight: '700' },
  metaValue: { color: '#334155', fontSize: 13, maxWidth: '65%', textAlign: 'right' },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 },
  statusBadge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#E5F6FF' },
  statusText: { color: '#0C4A6E', fontWeight: '700', fontSize: 12 },
  button: { marginTop: 0, backgroundColor: '#1976D2', paddingVertical: 14, borderRadius: 16, alignItems: 'center', flex: 0.48 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  logoutText: { color: '#1976D2', fontWeight: '700' },
});
