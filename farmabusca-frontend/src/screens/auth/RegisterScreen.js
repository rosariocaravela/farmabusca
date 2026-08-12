import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const { register } = useAuth();
  const { control, handleSubmit } = useForm();
  const [selectedRole, setSelectedRole] = useState('PATIENT');
  const [currentStep, setCurrentStep] = useState('selectRole');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const roleOptions = [
    { value: 'PATIENT', label: 'Paciente', description: 'Buscar remédios e farmácias' },
    { value: 'PHARMACY', label: 'Farmácia', description: 'Gerenciar estoque e pedidos' },
    { value: 'ADMIN', label: 'Administrador', description: 'Aprovar farmácias e gerenciar usuários' },
  ];

  const selectedRoleLabel = roleOptions.find((role) => role.value === selectedRole)?.label || 'Paciente';

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...data,
        role: selectedRole,
      };
      await register(payload);
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (Array.isArray(serverErrors) && serverErrors.length > 0) {
        setError(serverErrors.map((item) => item.msg).join(', '));
      } else {
        setError(err.response?.data?.message || err.message || 'Erro ao criar conta');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    setCurrentStep('fillForm');
  };

  return (
    <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 60}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContainer, styles.scrollPadding]}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        scrollEnabled={true}
      >
        <Text style={styles.title}>Criar conta</Text>
        <Text style={styles.subtitle}>Junte-se ao FarmaBusca</Text>

        {currentStep === 'selectRole' ? (
          <>
            <Text style={styles.sectionTitle}>Escolha o tipo de conta</Text>
            <View style={styles.roleRow}>
              {roleOptions.map((role) => (
                <TouchableOpacity
                  key={role.value}
                  style={[styles.roleOption, selectedRole === role.value && styles.roleOptionActive]}
                  onPress={() => setSelectedRole(role.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.roleLabel, selectedRole === role.value && styles.roleLabelActive]}>{role.label}</Text>
                  <Text style={styles.roleDescription}>{role.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <CustomButton title="Continuar" onPress={handleContinue} />
            <Text style={styles.link} onPress={() => navigation.goBack()}>Já tenho conta</Text>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Registro para {selectedRoleLabel}</Text>
            <Controller control={control} name="name" defaultValue="" render={({ field: { onChange, value } }) => (<CustomInput label="Nome completo" placeholder="Seu nome" value={value} onChangeText={onChange} />)} />
            <Controller control={control} name="email" defaultValue="" render={({ field: { onChange, value } }) => (<CustomInput label="Email" placeholder="seu@email.com" value={value} onChangeText={onChange} keyboardType="email-address" />)} />
            <Controller control={control} name="phone" defaultValue="" render={({ field: { onChange, value } }) => (<CustomInput label="Telefone" placeholder="84 000 000" value={value} onChangeText={onChange} keyboardType="phone-pad" />)} />
            <Controller control={control} name="password" defaultValue="" render={({ field: { onChange, value } }) => (<CustomInput label="Senha" placeholder="********" value={value} onChangeText={onChange} secureTextEntry />)} />
            <Controller control={control} name="confirmPassword" defaultValue="" render={({ field: { onChange, value } }) => (<CustomInput label="Confirmar senha" placeholder="********" value={value} onChangeText={onChange} secureTextEntry />)} />

            <CustomButton title="Criar conta" loading={loading} onPress={handleSubmit(onSubmit)} />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Text style={styles.link} onPress={() => setCurrentStep('selectRole')}>Alterar tipo de conta</Text>
            <Text style={styles.link} onPress={() => navigation.goBack()}>Já tenho conta</Text>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#F7F9FC' },
  scrollView: { flex: 1 },
  scrollContainer: { flexGrow: 1, padding: 24, paddingBottom: 40 },
  scrollPadding: { paddingBottom: 180 },
  title: { fontSize: 28, fontWeight: '800', color: '#233447', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6F7882', marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#2F9E5D', marginBottom: 12, marginTop: 10 },
  roleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18, gap: 10 },
  roleOption: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8EEF5',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  roleOptionActive: {
    borderColor: '#2F9E5D',
    backgroundColor: '#EAF8EE',
  },
  roleLabel: { fontSize: 15, fontWeight: '700', color: '#334155' },
  roleLabelActive: { color: '#1B5E34' },
  roleDescription: { color: '#6F7882', marginTop: 6, fontSize: 12, lineHeight: 18 },
  link: { textAlign: 'center', color: '#1976D2', fontWeight: '700', marginTop: 14 },
  error: { color: '#E85D5D', marginTop: 12, textAlign: 'center' },
  scrollPadding: { paddingBottom: 140 },
});
