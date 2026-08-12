import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const { forgotPassword } = useAuth();
  const { control, handleSubmit } = useForm();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await forgotPassword({ email: data.email });
      setMessage('Se o email existir, você receberá instruções para recuperar a senha.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erro ao enviar instruções de recuperação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 80}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Recuperar senha</Text>
          <Text style={styles.subtitle}>Digite o email associado à sua conta.</Text>

          <Controller
            control={control}
            name="email"
            defaultValue=""
            render={({ field: { onChange, value } }) => (
              <CustomInput label="Email" placeholder="seu@email.com" value={value} onChangeText={onChange} keyboardType="email-address" />
            )}
          />

          <CustomButton title="Enviar instruções" loading={loading} onPress={handleSubmit(onSubmit)} />
          {message ? <Text style={styles.success}>{message}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
            <Text style={styles.link}>Voltar para login</Text>
          </TouchableOpacity>
        </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#F7F9FC' },
  scrollView: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#333', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 20 },
  link: { textAlign: 'center', color: '#1976D2', fontWeight: '700' },
  error: { color: '#E85D5D', marginTop: 12, textAlign: 'center' },
  success: { color: '#2F9E5D', marginTop: 12, textAlign: 'center' },
});
