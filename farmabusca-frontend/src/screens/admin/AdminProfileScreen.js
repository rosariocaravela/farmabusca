import React from 'react';
import { Alert, View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function AdminProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Perfil</Text>
      <Text style={styles.subtitle}>Informações do administrador e configurações da conta.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nome</Text>
        <Text style={styles.value}>{user?.name || 'Administrador'}</Text>
      </View>
      <TouchableOpacity style={styles.logout} onPress={() => Alert.alert('Terminar sessão?', 'Terá de iniciar sessão novamente para aceder à administração.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sair', style: 'destructive', onPress: () => logout('Login') }])}><Text style={styles.logoutText}>Terminar sessão</Text></TouchableOpacity>
      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email || 'admin@farmabusca.com'}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Perfil</Text>
        <Text style={styles.value}>{user?.role || 'ADMIN'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: '#1F2937', marginBottom: 6 },
  subtitle: { color: '#475569', fontSize: 14, marginBottom: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16 },
  label: { color: '#6B7280', fontSize: 12, marginBottom: 6 },
  value: { color: '#111827', fontSize: 16, fontWeight: '700' },
  logout: { marginTop: 8, padding: 16, borderRadius: 16, backgroundColor: '#FEE2E2', alignItems: 'center' },
  logoutText: { color: '#B91C1C', fontWeight: '800' },
});
