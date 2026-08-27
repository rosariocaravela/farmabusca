import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SearchBar from '../../components/SearchBar';
import { getAdminUsers, updateAdminUserStatus } from '../../services/api';
import { colors, radius, spacing, typography } from '../../theme';

export default function AdminUsersScreen() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('PATIENT');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setUsers(await getAdminUsers({ search, role }));
    } catch (_error) {
      setError('Não foi possível carregar os utilizadores.');
    } finally {
      setLoading(false);
    }
  }, [search, role]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const changeStatus = (user) => Alert.alert(
    user.isActive === false ? 'Activar utilizador?' : 'Suspender utilizador?',
    `${user.name} ${user.isActive === false ? 'voltará a ter acesso' : 'deixará de conseguir entrar'} no FarmaBusca.`,
    [
      { text: 'Cancelar', style: 'cancel' },
      { text: user.isActive === false ? 'Activar' : 'Suspender', style: user.isActive === false ? 'default' : 'destructive', onPress: async () => {
        setUpdating(user.id);
        try {
          const updated = await updateAdminUserStatus(user.id, user.isActive === false);
          setUsers((current) => current.map((item) => item.id === updated.id ? updated : item));
          Alert.alert('Sucesso', updated.isActive ? 'Utilizador activado.' : 'Utilizador suspenso.');
        } catch (requestError) {
          Alert.alert('Erro', requestError.response?.data?.message || 'Não foi possível actualizar o utilizador.');
        } finally {
          setUpdating(null);
        }
      } },
    ],
  );

  return <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Text style={styles.title}>Utilizadores</Text>
    <Text style={styles.subtitle}>Consulte pacientes e contas de farmácia.</Text>
    <SearchBar value={search} onChangeText={setSearch} placeholder="Pesquisar nome, email ou contacto" />
    <View style={styles.filters}>{[['PATIENT', 'Pacientes'], ['PHARMACY', 'Farmácias'], ['ADMIN', 'Admin']].map(([value, label]) => <TouchableOpacity key={value} style={[styles.filter, role === value && styles.filterActive]} onPress={() => setRole(value)}><Text style={[styles.filterText, role === value && styles.filterTextActive]}>{label}</Text></TouchableOpacity>)}</View>
    {loading ? <ActivityIndicator color={colors.primary} style={styles.state} /> : error ? <Text style={styles.error}>{error}</Text> : users.length === 0 ? <Text style={styles.empty}>Nenhum utilizador encontrado.</Text> : users.map((user) => <View key={user.id} style={styles.card}>
      <View style={styles.row}><View style={styles.info}><Text style={styles.name}>{user.name}</Text><Text style={styles.meta}>{user.email}</Text><Text style={styles.meta}>{user.phone || 'Sem contacto'}</Text></View><View style={[styles.badge, user.isActive === false && styles.badgeSuspended]}><Text style={styles.badgeText}>{user.isActive === false ? 'Suspenso' : 'Activo'}</Text></View></View>
      <TouchableOpacity disabled={updating === user.id} style={[styles.action, user.isActive !== false && styles.actionDanger]} onPress={() => changeStatus(user)}><Text style={[styles.actionText, user.isActive !== false && styles.actionDangerText]}>{updating === user.id ? 'A actualizar...' : user.isActive === false ? 'Activar utilizador' : 'Suspender utilizador'}</Text></TouchableOpacity>
    </View>)}
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background }, content: { padding: spacing.xl, paddingBottom: 40 }, title: { ...typography.title, color: colors.text }, subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 4, marginBottom: 16 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 16 }, filter: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }, filterActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary }, filterText: { color: colors.textSecondary, fontWeight: '700' }, filterTextActive: { color: colors.primaryDark },
  state: { marginTop: 28 }, error: { color: colors.error, marginTop: 20 }, empty: { color: colors.textSecondary, textAlign: 'center', marginTop: 28 }, card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 12 }, row: { flexDirection: 'row', alignItems: 'flex-start' }, info: { flex: 1 }, name: { ...typography.heading, color: colors.text }, meta: { ...typography.caption, color: colors.textSecondary, marginTop: 4 }, badge: { backgroundColor: colors.successLight, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 }, badgeSuspended: { backgroundColor: colors.errorLight }, badgeText: { fontSize: 12, fontWeight: '800', color: colors.text }, action: { marginTop: 14, backgroundColor: colors.primaryLight, borderRadius: radius.md, padding: 11, alignItems: 'center' }, actionDanger: { backgroundColor: colors.errorLight }, actionText: { color: colors.primaryDark, fontWeight: '800' }, actionDangerText: { color: colors.error },
});
