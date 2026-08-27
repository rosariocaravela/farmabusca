import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Linking, Modal, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import SearchBar from '../../components/SearchBar';
import { getAdminPharmacies, updateAdminPharmacyStatus } from '../../services/api';

export default function AdminPharmaciesScreen() {
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [province, setProvince] = useState('');
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [pharmacies, setPharmacies] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [picker, setPicker] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [documentsToView, setDocumentsToView] = useState(null);
  const [downloadingDocument, setDownloadingDocument] = useState(null);

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

  const provinceOptions = [...new Set(pharmacies.map((pharmacy) => pharmacy.province).filter(Boolean))].sort();
  const districtOptions = [...new Set(pharmacies.filter((pharmacy) => !province || pharmacy.province === province).map((pharmacy) => pharmacy.district).filter(Boolean))].sort();
  const pickerOptions = picker === 'province' ? provinceOptions : districtOptions;

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

  const confirmStatus = (pharmacy, action) => {
    setConfirmation({ type: 'status', pharmacy, action });
  };

  const executeConfirmation = async () => {
    const pending = confirmation;
    if (!pending) return;
    setConfirmation(null);
    return handleStatus(pending.pharmacy.id, pending.action);
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
        const link = globalThis.document.createElement('a');
        link.href = document.url;
        link.download = document.originalName || `documento-${index + 1}`;
        link.target = '_blank';
        link.rel = 'noreferrer';
        globalThis.document.body.appendChild(link);
        link.click();
        globalThis.document.body.removeChild(link);
        return;
      }
      const fileName = (document.originalName || `documento-${index + 1}`).replace(/[^a-zA-Z0-9._-]/g, '_');
      const result = await FileSystem.downloadAsync(document.url, `${FileSystem.cacheDirectory}${fileName}`);
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri, { dialogTitle: 'Guardar documento' });
      else Alert.alert('Download concluído', 'O documento foi guardado temporariamente no dispositivo.');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível baixar este documento. Tente novamente.');
    } finally {
      setDownloadingDocument(null);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Gestão de Farmácias</Text>
      <Text style={styles.subtitle}>Busque, aprove ou suspenda farmácias e veja documentos enviados.</Text>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Buscar nome, distrito ou província" />

      <View style={styles.filterRow}>
        <View style={styles.filterColumn}>
          <Text style={styles.filterLabel}>Distrito</Text>
          <TouchableOpacity disabled={!province} style={[styles.selectField, !province && styles.selectFieldDisabled]} onPress={() => setPicker('district')}><Text style={district ? styles.selectValue : styles.selectPlaceholder}>{district || (province ? 'Selecionar distrito' : 'Escolha a província primeiro')}</Text><Ionicons name="chevron-down" size={18} color="#64748B" /></TouchableOpacity>
        </View>
        <View style={[styles.filterColumn, styles.filterColumnRight]}>
          <Text style={styles.filterLabel}>Província</Text>
          <TouchableOpacity style={styles.selectField} onPress={() => setPicker('province')}><Text style={province ? styles.selectValue : styles.selectPlaceholder}>{province || 'Selecionar província'}</Text><Ionicons name="chevron-down" size={18} color="#64748B" /></TouchableOpacity>
        </View>
      </View>

      <View style={styles.statusRow}>
        {['pending', 'approved', 'suspended', 'rejected'].map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.statusButton, status === option ? styles.statusButtonActive : null]}
            onPress={() => setStatus(option)}
          >
            <Text style={[styles.statusText, status === option ? styles.statusTextActive : null]}>{option === 'pending' ? 'Pendente' : option === 'approved' ? 'Aprovadas' : option === 'rejected' ? 'Rejeitadas' : 'Suspensas'}</Text>
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
            <Text style={styles.cardField}>Localização: {[pharmacy.neighborhood, pharmacy.address].filter(Boolean).join(' · ') || 'Não informada'}</Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleViewDocuments(pharmacy.documents)}>
                <Ionicons name="document-text-outline" size={18} color="#2563EB" />
                <Text style={styles.actionLabel}>Ver docs</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                disabled={updatingId === pharmacy.id}
                onPress={() => confirmStatus(pharmacy, 'approve')}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#065F46" />
                <Text style={[styles.actionLabel, styles.approveLabel]}>Aprovar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.suspendButton]}
                disabled={updatingId === pharmacy.id}
                onPress={() => confirmStatus(pharmacy, 'suspend')}
              >
                <Ionicons name="ban-outline" size={18} color="#B91C1C" />
                <Text style={[styles.actionLabel, styles.suspendLabel]}>Suspender</Text>
              </TouchableOpacity>
              {pharmacy.reviewStatus === 'PENDING' ? <TouchableOpacity style={[styles.actionButton, styles.suspendButton]} disabled={updatingId === pharmacy.id} onPress={() => confirmStatus(pharmacy, 'reject')}><Ionicons name="close-circle-outline" size={18} color="#B91C1C" /><Text style={[styles.actionLabel, styles.suspendLabel]}>Rejeitar</Text></TouchableOpacity> : null}
            </View>
          </View>
        ))
      )}
      <Modal visible={Boolean(picker)} transparent animationType="fade" onRequestClose={() => setPicker(null)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setPicker(null)}>
          <View style={styles.pickerModal} onStartShouldSetResponder={() => true}>
            <View style={styles.pickerHeader}><Text style={styles.pickerTitle}>{picker === 'province' ? 'Selecionar província' : 'Selecionar distrito'}</Text><TouchableOpacity onPress={() => setPicker(null)}><Ionicons name="close" size={22} color="#475569" /></TouchableOpacity></View>
            <TouchableOpacity style={styles.optionItem} onPress={() => { picker === 'province' ? setProvince('') : setDistrict(''); setPicker(null); }}><Text style={styles.clearOption}>Todos</Text></TouchableOpacity>
            {pickerOptions.map((option) => <TouchableOpacity key={option} style={styles.optionItem} onPress={() => { if (picker === 'province') { setProvince(option); setDistrict(''); } else setDistrict(option); setPicker(null); }}><Text style={styles.optionText}>{option}</Text></TouchableOpacity>)}
            {!pickerOptions.length ? <Text style={styles.noOptions}>Nenhuma opção disponível.</Text> : null}
          </View>
        </TouchableOpacity>
      </Modal>
      <Modal visible={Boolean(documentsToView)} transparent animationType="fade" onRequestClose={() => setDocumentsToView(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}><Text style={styles.pickerTitle}>Documentos enviados</Text><TouchableOpacity onPress={() => setDocumentsToView(null)}><Ionicons name="close" size={22} color="#475569" /></TouchableOpacity></View>
            {(documentsToView || []).map((document, index) => (
              <View key={`${document.url || document.originalName}-${index}`} style={styles.documentRow}>
                <Ionicons name="document-text-outline" size={19} color={document.url ? '#2563EB' : '#94A3B8'} />
                <Text style={styles.documentName} numberOfLines={1}>{document.originalName || `Documento ${index + 1}`}</Text>
                <View style={styles.documentActions}>
                  <TouchableOpacity disabled={!document.url} onPress={() => document.url && Linking.openURL(document.url)}><Text style={document.url ? styles.openDocument : styles.unavailableDocument}>{document.url ? 'Abrir' : 'Indisponível'}</Text></TouchableOpacity>
                  {document.url ? <TouchableOpacity disabled={downloadingDocument === index} onPress={() => handleDownloadDocument(document, index)}><Text style={styles.downloadDocument}>{downloadingDocument === index ? 'A baixar...' : 'Baixar'}</Text></TouchableOpacity> : null}
                </View>
              </View>
            ))}
          </View>
        </View>
      </Modal>
      <Modal visible={Boolean(confirmation)} transparent animationType="fade" onRequestClose={() => setConfirmation(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmModal}>
            <Text style={styles.pickerTitle}>{`${confirmation?.action === 'approve' ? 'Aprovar' : confirmation?.action === 'reject' ? 'Rejeitar' : 'Suspender'} farmácia?`}</Text>
            <Text style={styles.confirmMessage}>Confirma esta acção para {confirmation?.pharmacy?.name || 'a farmácia'}?</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setConfirmation(null)}><Text style={styles.cancelText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.confirmButton, confirmation?.action && confirmation.action !== 'approve' ? styles.dangerConfirmButton : null]} onPress={executeConfirmation}><Text style={styles.confirmText}>Confirmar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  selectField: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  selectValue: { color: '#111827', fontSize: 14, fontWeight: '700' },
  selectPlaceholder: { color: '#64748B', fontSize: 14 },
  selectFieldDisabled: { backgroundColor: '#F1F5F9' },
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
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  pickerModal: { maxHeight: '80%', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  pickerTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  optionItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  optionText: { color: '#1F2937', fontSize: 15, fontWeight: '600' },
  clearOption: { color: '#2563EB', fontSize: 15, fontWeight: '700' },
  noOptions: { color: '#64748B', paddingVertical: 18 },
  documentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  documentName: { color: '#334155', fontSize: 14, flex: 1 },
  documentActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  openDocument: { color: '#2563EB', fontWeight: '800' },
  downloadDocument: { color: '#047857', fontWeight: '800' },
  unavailableDocument: { color: '#94A3B8', fontWeight: '700' },
  confirmModal: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 20 },
  confirmMessage: { color: '#475569', fontSize: 14, marginTop: 10, marginBottom: 20 },
  confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelButton: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F1F5F9' },
  cancelText: { color: '#475569', fontWeight: '800' },
  confirmButton: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, backgroundColor: '#059669' },
  dangerConfirmButton: { backgroundColor: '#DC2626' },
  confirmText: { color: '#FFFFFF', fontWeight: '800' },
});
