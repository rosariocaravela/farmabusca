import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Alert, View, Modal, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { getMedicineById, updateMedicine } from '../../services/api';

const defaultCategories = ['Analgésicos', 'Antibióticos', 'Vitaminas', 'Anti-inflamatórios', 'Gripes e Resfriados', 'Digestivos', 'Antialérgicos', 'Dermatológicos', 'Vitaminas e Suplementos', 'Medicamentos Genéricos', 'Outro'];

export default function EditMedicineScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params || {};

  const [loading, setLoading] = useState(false);
  const [medicine, setMedicine] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [stockStatus, setStockStatus] = useState('AVAILABLE');
  const [imageUri, setImageUri] = useState(null);
  const [imageChanged, setImageChanged] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadMedicine = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const response = await getMedicineById(id);
        const data = response?.data || response;
        if (!mounted) return;
        setMedicine(data);
        setName(data.name || '');
        setPrice(data.price != null ? String(data.price) : '');
        setStock(data.quantity != null ? String(data.quantity) : '');
        setCategory(data.Category?.name || data.category || '');
        setDescription(data.description || '');
        setStockStatus(data.stockStatus || 'AVAILABLE');
        setImageUri(data.image || null);
        setImageChanged(false);
      } catch (error) {
        console.warn('Erro ao carregar medicamento', error);
        Alert.alert('Erro', 'Não foi possível carregar os dados do medicamento.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadMedicine();
    return () => {
      mounted = false;
    };
  }, [id]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar suas imagens.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets?.[0]?.uri || result.uri);
      setImageChanged(true);
    }
  };

  const buildImageField = async () => {
    if (!imageUri) return null;

    const uriParts = imageUri.split('/');
    const fileName = uriParts[uriParts.length - 1] || `medicine-${Date.now()}.jpg`;
    const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const type = extension === 'png' ? 'image/png' : 'image/jpeg';

    if (Platform.OS === 'web') {
      try {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        return new File([blob], fileName, { type: blob.type || type });
      } catch (err) {
        console.error('Web image fetch error', err);
        return null;
      }
    }

    return {
      uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
      name: fileName,
      type,
    };
  };

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Erro', 'Nome é obrigatório.');
    if (!price.trim() || isNaN(Number(price))) return Alert.alert('Erro', 'Preço inválido.');
    if (!stock.trim() || isNaN(Number(stock))) return Alert.alert('Erro', 'Quantidade inválida.');

    setLoading(true);
    try {
      const form = new FormData();
      form.append('name', name.trim());
      form.append('category', category.trim());
      form.append('price', Number(price));
      form.append('stock', Number(stock));
      form.append('stockStatus', stockStatus);
      form.append('description', description.trim() || '');

      if (imageChanged) {
        if (imageUri) {
          const imageField = await buildImageField();
          if (imageField) {
            form.append('image', imageField);
          }
        } else {
          // Image was removed
          form.append('imageRemoved', 'true');
        }
      }

      await updateMedicine(id, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Sucesso', 'Medicamento atualizado com sucesso.');
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.navigate('PharmacyTabs', { screen: 'Medicamentos' });
    } catch (error) {
      console.warn('Erro ao atualizar medicamento', error.response || error);
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !medicine) {
    return <ActivityIndicator style={styles.loader} size="large" color="#2F9E5D" />;
  }

  return (
    <ScrollView
      style={[styles.page, Platform.OS === 'web' && styles.webScroll]}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      nestedScrollEnabled
      showsVerticalScrollIndicator
      persistentScrollbar
      alwaysBounceVertical
    >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('PharmacyTabs', { screen: 'Medicamentos' })}>
        <Ionicons name="chevron-back" size={22} color="#1F2937" />
        <Text style={styles.backText}>Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Editar medicamento</Text>

      <View style={styles.imageCard}>
        <Text style={styles.cardLabel}>Imagem do medicamento</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera" size={24} color="#2F9E5D" />
              <Text style={styles.imagePlaceholderText}>Adicionar imagem</Text>
            </View>
          )}
        </TouchableOpacity>
        {imageUri && (
          <TouchableOpacity style={styles.removeImageButton} onPress={() => { setImageUri(null); setImageChanged(true); }}>
            <Text style={styles.removeImageText}>Remover imagem</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statusCard}>
        <View style={[styles.statusIndicator, medicine?.stockStatus === 'AVAILABLE' ? styles.statusAvailable : styles.statusUnavailable]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.statusLabel}>Estado</Text>
          <Text style={styles.statusValue}>{medicine?.stockStatus === 'AVAILABLE' ? '🟢 Disponível' : medicine?.stockStatus === 'LOW_STOCK' ? '🟡 Stock baixo' : '🔴 Indisponível'}</Text>
        </View>
      </View>

      <Text style={styles.label}>Alterar status do medicamento</Text>
      <View style={styles.statusRow}>
        <TouchableOpacity
          style={[styles.statusButton, stockStatus === 'AVAILABLE' && styles.statusButtonActive]}
          onPress={() => setStockStatus('AVAILABLE')}
        >
          <Text style={[styles.statusLabel, stockStatus === 'AVAILABLE' && styles.statusLabelActive]}>🟢 Disponível</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statusButton, stockStatus === 'OUT_OF_STOCK' && styles.statusButtonActive]}
          onPress={() => setStockStatus('OUT_OF_STOCK')}
        >
          <Text style={[styles.statusLabel, stockStatus === 'OUT_OF_STOCK' && styles.statusLabelActive]}>🔴 Esgotado</Text>
        </TouchableOpacity>
      </View>

      <CustomInput label="Nome" placeholder="Nome do medicamento" value={name} onChangeText={setName} />
      
      <Text style={styles.label}>Categoria</Text>
      <View style={styles.categoryChecklist}>
        {defaultCategories.map((item) => (
          <TouchableOpacity
            key={item}
            style={styles.checklistItem}
            onPress={() => { setCategory(item); setShowCustomCategory(false); }}
          >
            <View style={[styles.checkbox, item === category && styles.checkboxSelected]}>
              {item === category && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
            <Text style={styles.checklistLabel}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {!showCustomCategory && (
        <TouchableOpacity onPress={() => setShowCustomCategory(true)} style={styles.customCategoryButton}>
          <Text style={styles.customCategoryText}>+ Adicionar categoria personalizada</Text>
        </TouchableOpacity>
      )}
      {showCustomCategory && (
        <View style={styles.customCategoryInput}>
          <CustomInput
            placeholder="Digite sua categoria"
            value={category}
            onChangeText={setCategory}
          />
          <TouchableOpacity onPress={() => setShowCustomCategory(false)} style={styles.customCategoryClose}>
            <Text style={styles.customCategoryCloseText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <CustomInput label="Preço" placeholder="Preço" keyboardType="numeric" value={price} onChangeText={setPrice} />
      <CustomInput label="Quantidade" placeholder="Quantidade" keyboardType="numeric" value={stock} onChangeText={setStock} />
      <CustomInput label="Descrição" placeholder="Descrição" value={description} onChangeText={setDescription} />
      <CustomButton title="Guardar alterações" onPress={handleSave} loading={loading} disabled={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F7F9FC' },
  webScroll: { overflowY: 'scroll' },
  container: { flexGrow: 1, padding: 20, paddingBottom: 80 },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  backText: { fontSize: 16, color: '#1F2937', marginLeft: 6, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '800', color: '#333', marginBottom: 16 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  imageCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardLabel: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 12 },
  imagePicker: {
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: { color: '#2F9E5D', fontSize: 14, fontWeight: '600', marginTop: 8 },
  imagePreview: { width: '100%', height: '100%' },
  removeImageButton: { marginTop: 10, paddingVertical: 8, alignItems: 'center' },
  removeImageText: { color: '#DC2626', fontSize: 13, fontWeight: '600' },
  statusCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  statusIndicator: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  statusAvailable: { backgroundColor: '#15803D' },
  statusUnavailable: { backgroundColor: '#DC2626' },
  statusLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  statusValue: { fontSize: 14, color: '#1F2937', fontWeight: '700', marginTop: 2 },
  statusRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statusButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#ECFDF3',
    borderColor: '#2F9E5D',
  },
  statusLabelActive: { color: '#1F2937' },
  label: { fontSize: 14, color: '#475569', marginBottom: 10, fontWeight: '600', marginTop: 12 },
  categoryChecklist: { marginBottom: 12 },
  checklistItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkboxSelected: { backgroundColor: '#2F9E5D', borderColor: '#2F9E5D' },
  checklistLabel: { fontSize: 14, color: '#334155', fontWeight: '500' },
  customCategoryButton: { marginTop: 12, paddingVertical: 10, alignItems: 'center', marginBottom: 12 },
  customCategoryText: { color: '#2F9E5D', fontSize: 14, fontWeight: '600' },
  customCategoryInput: { marginTop: 12, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
  customCategoryClose: { marginTop: 10, paddingVertical: 10, alignItems: 'center' },
  customCategoryCloseText: { color: '#64748B', fontSize: 13 },
});
