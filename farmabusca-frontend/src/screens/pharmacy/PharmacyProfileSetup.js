import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { createPharmacyProfile } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function PharmacyProfileSetup() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { control, handleSubmit } = useForm();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Build form data for multipart when needed later. For now send JSON.
      const payload = {
        name: data.name,
        nuit: data.nuit,
        licenseNumber: data.licenseNumber,
        address: data.address,
        province: data.province,
        district: data.district,
        phone: data.phone,
        openingHours: data.openingHours,
      };

      const res = await createPharmacyProfile(payload);
      Alert.alert('Sucesso', 'Perfil salvo. Complete os documentos no próximo passo.');
      navigation.replace('PharmacyProfileDocs');
    } catch (err) {
      console.log('Erro ao salvar perfil:', err.response?.data || err.message || err);
      Alert.alert('Erro', 'Não foi possível salvar o perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Dados da farmácia</Text>
      <Text style={styles.subtitle}>Preencha as informações básicas da farmácia (Nível 1)</Text>

      <Controller control={control} name="name" defaultValue="" render={({ field: { onChange, value } }) => (
        <CustomInput label="Nome da farmácia" placeholder="Nome" value={value} onChangeText={onChange} />
      )} />

      <Controller control={control} name="nuit" defaultValue="" render={({ field: { onChange, value } }) => (
        <CustomInput label="NUIT" placeholder="NUIT" value={value} onChangeText={onChange} />
      )} />

      <Controller control={control} name="licenseNumber" defaultValue="" render={({ field: { onChange, value } }) => (
        <CustomInput label="Número da licença" placeholder="Licença / Alvará" value={value} onChangeText={onChange} />
      )} />

      <Controller control={control} name="address" defaultValue="" render={({ field: { onChange, value } }) => (
        <CustomInput label="Endereço" placeholder="Endereço completo" value={value} onChangeText={onChange} />
      )} />

      <Controller control={control} name="province" defaultValue="" render={({ field: { onChange, value } }) => (
        <CustomInput label="Província" placeholder="Província" value={value} onChangeText={onChange} />
      )} />

      <Controller control={control} name="district" defaultValue="" render={({ field: { onChange, value } }) => (
        <CustomInput label="Distrito" placeholder="Distrito" value={value} onChangeText={onChange} />
      )} />

      <Controller control={control} name="phone" defaultValue="" render={({ field: { onChange, value } }) => (
        <CustomInput label="Telefone" placeholder="84 000 000" value={value} onChangeText={onChange} keyboardType="phone-pad" />
      )} />

      <Controller control={control} name="openingHours" defaultValue="" render={({ field: { onChange, value } }) => (
        <CustomInput label="Horário de funcionamento" placeholder="08:00-20:00" value={value} onChangeText={onChange} />
      )} />

      <CustomButton title="Salvar e continuar" loading={loading} onPress={handleSubmit(onSubmit)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  title: { fontSize: 22, fontWeight: '800', color: '#233447', marginBottom: 8 },
  subtitle: { color: '#6F7882', marginBottom: 16 },
});
