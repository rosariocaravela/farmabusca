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

const categories = ['Analgésicos', 'Antibióticos', 'Vitaminas', 'Anti-inflamatórios', 'Outros'];

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
  const [stockStatus, setStockStatus] = useState('AVAILABLE');
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

    if (Number(data.quantity) <= 0 && stockStatus === 'AVAILABLE') {
      return Alert.alert('Validação', 'Quantidade deve ser maior que zero quando o medicamento estiver disponível.');
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
      form.append('stockStatus', stockStatus);

      const imageField = await buildImageField();
      if (imageField) {
        form.append('image', imageField);
      }

      await createMedicine(form);
      setSuccessMessage('Medicamento cadastrado com sucesso.');
      reset();
      setImageUri('');
      setStockStatus('AVAILABLE');
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
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
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
        <View style={styles.optionsRow}>
          {categories.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.optionPill, errors.category && styles.optionPillError, item === categoryValue && styles.optionPillSelected]}
              onPress={() => setValue('category', item, { shouldValidate: true })}
            >
              <Text style={[styles.optionText, item === categoryValue && styles.optionTextSelected]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.category && <Text style={styles.errorText}>{errors.category.message || 'Selecione uma categoria.'}</Text>}

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
        <Text style={styles.cardTitle}>Estado do medicamento</Text>
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
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  optionPill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  optionPillSelected: {
    backgroundColor: '#E6F4EC',
    borderColor: '#2F9E5D',
  },
  optionPillError: { borderColor: '#EF4444' },
  optionText: { color: '#334155', fontSize: 14 },
  optionTextSelected: { color: '#1F2937', fontWeight: '700' },
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
  statusLabel: { color: '#475569', fontWeight: '700' },
  statusLabelActive: { color: '#1F2937' },
  helpText: { color: '#64748B', fontSize: 13, marginTop: 8 },
  errorText: { color: '#DC2626', fontSize: 13, marginTop: -10, marginBottom: 12 },
  successText: { color: '#15803D', fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
});
