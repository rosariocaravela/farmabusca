import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { getMedicineById, updateMedicine } from '../../services/api';

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

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Erro', 'Nome é obrigatório.');
    if (!price.trim() || isNaN(Number(price))) return Alert.alert('Erro', 'Preço inválido.');
    if (!stock.trim() || isNaN(Number(stock))) return Alert.alert('Erro', 'Quantidade inválida.');

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        category: category.trim(),
        price: Number(price),
        stock: Number(stock),
        description: description.trim() || undefined,
      };
      await updateMedicine(id, payload);
      Alert.alert('Sucesso', 'Medicamento atualizado com sucesso.');
      navigation.goBack();
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
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={22} color="#1F2937" />
        <Text style={styles.backText}>Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Editar medicamento</Text>
      <CustomInput label="Nome" placeholder="Nome do medicamento" value={name} onChangeText={setName} />
      <CustomInput label="Categoria" placeholder="Categoria" value={category} onChangeText={setCategory} />
      <CustomInput label="Preço" placeholder="Preço" keyboardType="numeric" value={price} onChangeText={setPrice} />
      <CustomInput label="Quantidade" placeholder="Quantidade" keyboardType="numeric" value={stock} onChangeText={setStock} />
      <CustomInput label="Descrição" placeholder="Descrição" value={description} onChangeText={setDescription} />
      <CustomButton title="Guardar alterações" onPress={handleSave} loading={loading} disabled={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  backText: { fontSize: 16, color: '#1F2937', marginLeft: 6, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '800', color: '#333', marginBottom: 16 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
});
