import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../context/AuthContext';
import { updatePharmacyProfile } from '../../services/api';
import CustomButton from '../../components/CustomButton';
import { Ionicons } from '@expo/vector-icons';

export default function PharmacyProfileDocs({ navigation }) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const pickDocuments = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
      if (result.type === 'cancel') return;
      // expo's DocumentPicker returns a single file unless using the new multi option; normalize
      const picked = Array.isArray(result) ? result : [result];
      setDocuments((d) => [...d, ...picked]);
    } catch (err) {
      console.warn('Document pick error', err);
      Alert.alert('Erro', 'Não foi possível selecionar documentos.');
    }
  };

  const submitDocuments = async () => {
    if (!documents.length) {
      Alert.alert('Atenção', 'Adicione pelo menos um documento.');
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      documents.forEach((doc, idx) => {
        const uri = doc.uri || doc.uri;
        const name = doc.name || `document-${idx}`;
        const type = doc.mimeType || 'application/octet-stream';
        form.append('documents', { uri, name, type });
      });

      const updated = await updatePharmacyProfile(form);
      Alert.alert('Sucesso', 'Documentos enviados. A sua farmácia ficará pendente para aprovação.');
      navigation.replace('PharmacyTabs');
    } catch (err) {
      console.error('Upload error', err);
      Alert.alert('Erro', 'Falha ao enviar documentos.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}> 
        <View style={styles.iconWrap}><Ionicons name="document-text" size={36} color="#2F9E5D" /></View>
        <Text style={styles.title}>Documentos</Text>
        <Text style={styles.subtitle}>Selecione os documentos oficiais para análise (licença, identificação, certificado).</Text>
      </View>

      <TouchableOpacity style={styles.pickBtn} onPress={pickDocuments}>
        <Text style={styles.pickBtnText}>Selecionar documentos</Text>
      </TouchableOpacity>

      {documents.length > 0 && (
        <View style={styles.docsList}>
          {documents.map((d, i) => (
            <View key={`${d.name || d.uri}-${i}`} style={styles.docRow}>
              <Ionicons name="document-outline" size={18} color="#444" style={{ marginRight: 8 }} />
              <Text numberOfLines={1} style={styles.docName}>{d.name || d.uri}</Text>
            </View>
          ))}
        </View>
      )}

      <CustomButton title="Enviar documentos" loading={submitting} onPress={submitDocuments} disabled={submitting || documents.length === 0} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#F6FBF6', flexGrow: 1 },
  header: { alignItems: 'center', marginBottom: 18 },
  iconWrap: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#EAF8EE', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 6, color: '#233447' },
  subtitle: { color: '#6F7882', textAlign: 'center', marginBottom: 12 },
  pickBtn: { backgroundColor: '#2F9E5D', padding: 14, borderRadius: 12, marginBottom: 12 },
  pickBtnText: { color: '#fff', textAlign: 'center', fontWeight: '700' },
  docsList: { marginBottom: 12, backgroundColor: '#fff', borderRadius: 8, padding: 8 },
  docRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#F0F2F4' },
  docName: { color: '#333', flex: 1 },
});
