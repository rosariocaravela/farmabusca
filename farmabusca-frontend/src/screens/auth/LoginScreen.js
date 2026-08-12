import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login } = useAuth();
  const { control, handleSubmit } = useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      await login({ email: data.email, password: data.password });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erro ao efetuar login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 80}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Entrar</Text>
          <Text style={styles.subtitle}>Acesse a sua conta para encontrar medicamentos</Text>

          <Controller
            control={control}
            name="email"
            defaultValue=""
            render={({ field: { onChange, value } }) => (
              <CustomInput label="Email" placeholder="seu@email.com" value={value} onChangeText={onChange} keyboardType="email-address" />
            )}
          />

          <Controller
            control={control}
            name="password"
            defaultValue=""
            render={({ field: { onChange, value } }) => (
              <CustomInput label="Palavra-passe" placeholder="********" value={value} onChangeText={onChange} secureTextEntry />
            )}
          />

          <CustomButton title="Entrar" loading={loading} onPress={handleSubmit(onSubmit)} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkButton}>
            <Text style={styles.link}>Criar conta</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.linkButton}> 
            <Text style={styles.secondaryLink}>Esqueci a palavra-passe</Text>
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
  error: { color: '#E85D5D', marginTop: 12, textAlign: 'center' },
  linkButton: { marginTop: 16 },
  link: { textAlign: 'center', color: '#1976D2', fontWeight: '700' },
  secondaryLink: { textAlign: 'center', color: '#888' },
});
