import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image, Linking, Modal, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useNavigation } from '@react-navigation/native';
import Header from '../../components/Header';
import DashboardCard from '../../components/DashboardCard';
import { useAuth } from '../../context/AuthContext';
import { getPendingPharmacies, getAdminSummary, approvePharmacy, updateAdminPharmacyStatus } from '../../services/api';

export default function AdminDashboardScreen() {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [pharmacies, setPharmacies] = useState([]);
  const [approvingId, setApprovingId] = useState(null);
  const [documentsToView, setDocumentsToView] = useState(null);
  const [downloadingDocument, setDownloadingDocument] = useState(null);
  const [pharmacyToApprove, setPharmacyToApprove] = useState(null);
  const [pharmacyToReject, setPharmacyToReject] = useState(null);

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
    setPharmacyToApprove(null);
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

  const handleReject = async (id) => {
    setPharmacyToReject(null);
    setApprovingId(id);
    try {
      await updateAdminPharmacyStatus(id, 'reject');
      setPharmacies((current) => current.filter((item) => item.id !== id));
      Alert.alert('Sucesso', 'Farmácia rejeitada com sucesso.');
    } catch (error) {
      Alert.alert('Erro', error.response?.data?.message || 'Não foi possível rejeitar a farmácia.');
    } finally {
      setApprovingId(null);
    }
  };

  const handleViewDocuments = (documents) => {
    if (!Array.isArray(documents) || documents.length === 0) {
      return Alert.alert('Documentos', 'Nenhum documento enviado.');
    }
    setDocumentsToView(documents);
  };

  const handleDownloadDocument = async (document, index) => {
    if (!document.url) return;
    setDownloadingDocument(index);
    try {
      if (Platform.OS === 'web') {
        const browserDocument = globalThis.document;
        const link = browserDocument.createElement('a');
        link.href = document.url;
        link.download = document.originalName || `documento-${index + 1}`;
        link.target = '_blank';
        link.rel = 'noreferrer';
        browserDocument.body.appendChild(link);
        link.click();
        browserDocument.body.removeChild(link);
        return;
      }
      const fileName = (document.originalName || `documento-${index + 1}`).replace(/[^a-zA-Z0-9._-]/g, '_');
      const target = `${FileSystem.cacheDirectory}${fileName}`;
      const result = await FileSystem.downloadAsync(document.url, target);
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri, { dialogTitle: 'Guardar documento' });
      else Alert.alert('Download concluído', 'O documento foi guardado temporariamente no dispositivo.');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível baixar este documento. Tente novamente.');
    } finally {
      setDownloadingDocument(null);
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
          <Text style={styles.summaryTitle}>Utilizadores</Text>
          <View style={styles.summaryRow}>
            <DashboardCard title="Pacientes registados" value={`${analytics.totalPatients ?? 0}`} color="#F0FDF4" accentColor="#16A34A" icon="people-outline" />
            <DashboardCard title="Acessos bloqueados" value={`${analytics.suspendedUsers ?? 0}`} color="#FFF7ED" accentColor="#EA580C" icon="lock-closed-outline" />
          </View>
          <Text style={styles.summaryTitle}>Estado das farmácias</Text>
          <View style={styles.summaryRow}>
            <DashboardCard title="Farmácias aprovadas" value={`${analytics.approvedPharmacies ?? 0}`} color="#ECFDF5" accentColor="#059669" icon="checkmark-circle-outline" />
            <DashboardCard title="Aguardam aprovação" value={`${analytics.pendingPharmacies ?? 0}`} color="#FFFBEB" accentColor="#D97706" icon="time-outline" />
          </View>
          <View style={styles.summaryRow}>
            <DashboardCard title="Farmácias suspensas" value={`${analytics.suspendedPharmacies ?? 0}`} color="#FEF2F2" accentColor="#DC2626" icon="ban-outline" />
            <DashboardCard title="Províncias abrangidas" value={`${analytics.provincesCount ?? 0}`} color="#EFF6FF" accentColor="#2563EB" icon="location-outline" />
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
            {Array.isArray(pharmacy.documents) && pharmacy.documents.length > 0 ? (
              <TouchableOpacity style={styles.documentsLink} onPress={() => handleViewDocuments(pharmacy.documents)}>
                <Text style={styles.documentsLinkText}>Ver documentos ({pharmacy.documents.length})</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.noDocumentsText}>Nenhum documento enviado</Text>
            )}
            <View style={styles.actionRow}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{pharmacy.approved ? 'Aprovada' : 'Aguardando aprovação'}</Text>
              </View>
              <TouchableOpacity
                style={[styles.button, approvingId === pharmacy.id ? styles.buttonDisabled : null]}
                onPress={() => setPharmacyToApprove(pharmacy)}
                disabled={approvingId === pharmacy.id}
              >
                <Text style={styles.buttonText}>{approvingId === pharmacy.id ? 'Aprovando...' : 'Aprovar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
      <Modal visible={Boolean(documentsToView)} transparent animationType="fade" onRequestClose={() => setDocumentsToView(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.documentsModal}>
            <View style={styles.documentsHeader}><Text style={styles.documentsTitle}>Documentos enviados</Text><TouchableOpacity onPress={() => setDocumentsToView(null)}><Text style={styles.closeText}>Fechar</Text></TouchableOpacity></View>
            {documentsToView?.map((document, index) => <View key={`${document.url || document.originalName}-${index}`} style={styles.documentRow}><Text style={styles.documentName} numberOfLines={1}>{document.originalName || `Documento ${index + 1}`}</Text><View style={styles.documentActions}><TouchableOpacity disabled={!document.url} onPress={() => document.url && Linking.openURL(document.url)}><Text style={[styles.openText, !document.url && styles.disabledText]}>{document.url ? 'Abrir' : 'Indisponível'}</Text></TouchableOpacity>{document.url ? <TouchableOpacity disabled={downloadingDocument === index} onPress={() => handleDownloadDocument(document, index)}><Text style={styles.downloadText}>{downloadingDocument === index ? 'A baixar...' : 'Baixar'}</Text></TouchableOpacity> : null}</View></View>)}
          </View>
        </View>
      </Modal>
      <Modal visible={Boolean(pharmacyToApprove)} transparent animationType="fade" onRequestClose={() => setPharmacyToApprove(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmModal}>
            <Text style={styles.documentsTitle}>Aprovar farmácia?</Text>
            <Text style={styles.confirmMessage}>Confirma a aprovação de {pharmacyToApprove?.name || 'esta farmácia'}?</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setPharmacyToApprove(null)}><Text style={styles.cancelText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={() => pharmacyToApprove && handleApprove(pharmacyToApprove.id)}><Text style={styles.confirmText}>Aprovar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={Boolean(pharmacyToReject)} transparent animationType="fade" onRequestClose={() => setPharmacyToReject(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmModal}>
            <Text style={styles.documentsTitle}>Rejeitar farmácia?</Text>
            <Text style={styles.confirmMessage}>Confirma a rejeição de {pharmacyToReject?.name || 'esta farmácia'}?</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setPharmacyToReject(null)}><Text style={styles.cancelText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.confirmButton, styles.rejectConfirmButton]} onPress={() => pharmacyToReject && handleReject(pharmacyToReject.id)}><Text style={styles.confirmText}>Rejeitar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  summaryTitle: { color: '#0F172A', fontSize: 17, fontWeight: '800', marginTop: 6, marginBottom: 10 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
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
  documentsLink: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 8, marginTop: 14, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#EFF6FF' },
  documentsLinkText: { color: '#1976D2', fontSize: 13, fontWeight: '800' },
  noDocumentsText: { color: '#B45309', fontSize: 13, fontWeight: '700', marginTop: 14 },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  documentsModal: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, maxHeight: '80%' },
  documentsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  documentsTitle: { color: '#1F2937', fontSize: 18, fontWeight: '800' },
  closeText: { color: '#64748B', fontWeight: '700' },
  documentRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  documentName: { color: '#334155', fontSize: 14, flex: 1 },
  documentActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  openText: { color: '#1976D2', fontWeight: '800' },
  downloadText: { color: '#047857', fontWeight: '800' },
  disabledText: { color: '#94A3B8' },
  confirmModal: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 20 },
  confirmMessage: { color: '#475569', fontSize: 14, marginTop: 10, marginBottom: 20 },
  confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelButton: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F1F5F9' },
  cancelText: { color: '#475569', fontWeight: '800' },
  confirmButton: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, backgroundColor: '#1976D2' },
  confirmText: { color: '#FFFFFF', fontWeight: '800' },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 },
  statusBadge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: '#E5F6FF' },
  statusText: { color: '#0C4A6E', fontWeight: '700', fontSize: 12 },
  button: { marginTop: 0, backgroundColor: '#1976D2', paddingVertical: 14, borderRadius: 16, alignItems: 'center', flex: 0.48 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  logoutText: { color: '#1976D2', fontWeight: '700' },
});
