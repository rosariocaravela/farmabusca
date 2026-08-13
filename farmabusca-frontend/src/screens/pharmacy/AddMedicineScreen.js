import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { createMedicine } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const defaultCategories = ['Analgésicos', 'Antibióticos', 'Vitaminas', 'Anti-inflamatórios', 'Gripes e Resfriados', 'Digestivos', 'Antialérgicos', 'Dermatológicos', 'Vitaminas e Suplementos', 'Medicamentos Genéricos', 'Outro'];

export default function AddMedicineScreen({ navigation }) {
  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: '',
      category: '',
      description: '',
      quantity: '',
      price: '',
    },
  });

  const categoryValue = watch('category');
  const { user } = useAuth();
  const [imageUri, setImageUri] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    register('category', { required: 'Categoria é obrigatória.' });
  }, [register]);

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

  const onSubmit = async (data) => {
    if (user?.role?.toLowerCase() !== 'pharmacy') {
      return Alert.alert('Acesso negado', 'Você precisa estar logado como farmácia para cadastrar medicamentos.');
    }

    if (!data.category || data.category.trim() === '') {
      return Alert.alert('Validação', 'Categoria é obrigatória.');
    }

    setLoading(true);
    setSuccessMessage('');

    try {
      const form = new FormData();
      form.append('name', data.name.trim());
      form.append('category', data.category);
      form.append('description', data.description?.trim() || '');
      form.append('quantity', String(Number(data.quantity) || 0));
      form.append('price', data.price?.trim() ? String(data.price.trim()) : '');
      form.append('manufacturer', data.manufacturer?.trim() || '');
      form.append('activeIngredient', data.activeIngredient?.trim() || '');
      form.append('dosage', data.dosage?.trim() || '');

      const imageField = await buildImageField();
      if (imageField) {
        form.append('image', imageField);
      }

      await createMedicine(form);
      setSuccessMessage('Medicamento cadastrado com sucesso.');
      reset();
      setImageUri('');
      setShowCustomCategory(false);
    } catch (error) {
      console.error('createMedicine error', error.response?.data || error.message || error);
      const serverMessage = error.response?.data?.message || error.message || 'Não foi possível adicionar o medicamento.';
      Alert.alert('Erro', serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Dashboard')}>
          <Ionicons name="chevron-back" size={22} color="#1F2937" />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Adicionar Medicamento</Text>
      <Text style={styles.subtitle}>Cadastre medicamentos para aparecerem no catálogo do FarmaBusca.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Imagem do medicamento</Text>
        <Text style={styles.cardDescription}>Adicione uma foto para que o medicamento apareça mais claro no catálogo.</Text>
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
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Informações do medicamento</Text>
        <Controller
          control={control}
          name="name"
          rules={{ required: 'Nome do medicamento é obrigatório.' }}
          render={({ field: { onChange, value } }) => (
            <CustomInput label="Nome do medicamento" placeholder="Paracetamol 500mg" value={value} onChangeText={onChange} />
          )}
        />
        {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}

        <Text style={styles.label}>Categoria</Text>
        <View style={styles.categoryChecklist}>
          {defaultCategories.map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.checklistItem}
              onPress={() => { setValue('category', item, { shouldValidate: true }); setShowCustomCategory(false); }}
            >
              <View style={[styles.checkbox, item === categoryValue && styles.checkboxSelected]}>
                {item === categoryValue && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
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
            <Controller
              control={control}
              name="category"
              rules={{ required: 'Categoria é obrigatória.' }}
              render={({ field: { onChange, value } }) => (
                <CustomInput
                  placeholder="Digite sua categoria"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            <TouchableOpacity onPress={() => setShowCustomCategory(false)} style={styles.customCategoryClose}>
              <Text style={styles.customCategoryCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        )}
        {errors.category && <Text style={styles.errorText}>{errors.category.message || 'Categoria é obrigatória.'}</Text>}

        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <CustomInput
              label="Descrição"
              placeholder="Informações sobre o medicamento."
              value={value}
              onChangeText={onChange}
              keyboardType="default"
            />
          )}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quantidade</Text>
        <Controller
          control={control}
          name="quantity"
          rules={{ required: 'Quantidade é obrigatória.' }}
          render={({ field: { onChange, value } }) => (
            <CustomInput label="Quantidade disponível" placeholder="50 unidades" value={value} onChangeText={onChange} keyboardType="numeric" />
          )}
        />
        {errors.quantity && <Text style={styles.errorText}>{errors.quantity.message}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Preço (opcional)</Text>
        <Controller
          control={control}
          name="price"
          render={({ field: { onChange, value } }) => (
            <CustomInput label="Preço" placeholder="50 MT" value={value} onChangeText={onChange} keyboardType="numeric" />
          )}
        />
        <Text style={styles.helpText}>O preço pode ser mostrado ao cliente ou apenas usado como referência da farmácia.</Text>
      </View>

      {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

      <CustomButton title={loading ? 'Salvando...' : '➕ Adicionar Medicamento'} onPress={handleSubmit(onSubmit)} loading={loading} disabled={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#EFF8F8' },
  container: { padding: 20, paddingBottom: 36 },
  headerRow: { marginBottom: 18 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 16, color: '#1F2937', marginLeft: 4 },
  title: { fontSize: 26, fontWeight: '800', color: '#1F2937', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#475569', lineHeight: 20, marginBottom: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 10 },
  cardDescription: { color: '#64748B', fontSize: 14, marginBottom: 18 },
  imagePicker: {
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: { color: '#2F9E5D', fontSize: 16, fontWeight: '700', marginTop: 8 },
  imagePreview: { width: '100%', height: '100%' },
  label: { fontSize: 14, color: '#475569', marginBottom: 10, fontWeight: '600' },
  categoryChecklist: { marginBottom: 12 },
  checklistItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkboxSelected: { backgroundColor: '#2F9E5D', borderColor: '#2F9E5D' },
  checklistLabel: { fontSize: 14, color: '#334155', fontWeight: '500' },
  customCategoryButton: { marginTop: 12, paddingVertical: 10, alignItems: 'center' },
  customCategoryText: { color: '#2F9E5D', fontSize: 14, fontWeight: '600' },
  customCategoryInput: { marginTop: 12, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  customCategoryClose: { marginTop: 10, paddingVertical: 10, alignItems: 'center' },
  customCategoryCloseText: { color: '#64748B', fontSize: 13 },
  helpText: { color: '#64748B', fontSize: 13, marginTop: 8 },
  errorText: { color: '#DC2626', fontSize: 13, marginTop: -10, marginBottom: 12 },
  successText: { color: '#15803D', fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
});
