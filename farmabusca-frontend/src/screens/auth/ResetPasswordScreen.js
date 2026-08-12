import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';

export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  const { resetPassword } = useAuth();
  const { control, handleSubmit } = useForm();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await resetPassword({ token: data.token, password: data.password, confirmPassword: data.confirmPassword });
      setMessage('Senha alterada com sucesso. Você já está autenticado.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 80}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Redefinir senha</Text>
          <Text style={styles.subtitle}>Insira o código de recuperação e a nova senha.</Text>

          <Controller
            control={control}
            name="token"
            defaultValue=""
            render={({ field: { onChange, value } }) => (
              <CustomInput label="Código de recuperação" placeholder="Token recebido por email" value={value} onChangeText={onChange} />
            )}
          />
          <Controller
            control={control}
            name="password"
            defaultValue=""
            render={({ field: { onChange, value } }) => (
              <CustomInput label="Nova senha" placeholder="********" value={value} onChangeText={onChange} secureTextEntry />
            )}
          />
          <Controller
            control={control}
            name="confirmPassword"
            defaultValue=""
            render={({ field: { onChange, value } }) => (
              <CustomInput label="Confirmar senha" placeholder="********" value={value} onChangeText={onChange} secureTextEntry />
            )}
          />

          <CustomButton title="Redefinir senha" loading={loading} onPress={handleSubmit(onSubmit)} />
          {message ? <Text style={styles.success}>{message}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
            <Text style={styles.link}>Voltar</Text>
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
