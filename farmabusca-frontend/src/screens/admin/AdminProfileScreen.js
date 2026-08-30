import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, Modal, Alert, Platform, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { updateUserProfile } from '../../services/api';
import { colors, radius, shadows, spacing, typography } from '../../theme';

const DetailRow = ({ icon, label, value, last }) => <View style={[styles.detailRow, last && styles.detailRowLast]}><View style={styles.detailIcon}><Ionicons name={icon} size={20} color={colors.primaryDark} /></View><View style={styles.detailContent}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View></View>;

export default function AdminProfileScreen() {
  const { user, logout, updateSessionUser } = useAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);
  const displayName = user?.name || 'Administrador FarmaBusca';
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'AD';
  const handleLogout = async () => { setConfirmLogout(false); await logout('Login'); };
  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') return Alert.alert('Permissão necessária', 'Permita o acesso às fotos para alterar a imagem.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaType ? [ImagePicker.MediaType.Images] : ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (result.canceled) return;
    const uri = result.assets?.[0]?.uri || result.uri;
    const fileName = uri.split('/').pop() || `admin-${Date.now()}.jpg`;
    const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const type = extension === 'png' ? 'image/png' : 'image/jpeg';
    setSavingPhoto(true);
    try {
      const payload = new FormData();
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        payload.append('image', new File([blob], fileName, { type: blob.type || type }));
      } else {
        payload.append('image', { uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''), name: fileName, type });
      }
      const updatedUser = await updateUserProfile(payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      await updateSessionUser(updatedUser);
      Alert.alert('Sucesso', 'Foto do administrador actualizada.');
    } catch (error) {
      Alert.alert('Erro', error.response?.data?.message || 'Não foi possível actualizar a foto.');
    } finally {
      setSavingPhoto(false);
    }
  };

  return <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    <Text style={styles.title}>Perfil</Text><Text style={styles.subtitle}>Informações da conta administrativa.</Text>
    <View style={styles.heroCard}>
      <View style={styles.avatarWrapper}>
        <TouchableOpacity onPress={() => user?.image && setPhotoPreviewOpen(true)} disabled={!user?.image} activeOpacity={0.85} accessibilityLabel="Ver foto do administrador">
          {user?.image ? <Image source={{ uri: user.image }} style={styles.avatar} /> : <View style={styles.avatarFallback}><Text style={styles.initials}>{initials}</Text></View>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.cameraButton} onPress={pickPhoto} disabled={savingPhoto} accessibilityRole="button" accessibilityLabel="Alterar foto do administrador">
          {savingPhoto ? <ActivityIndicator size="small" color={colors.surface} /> : <Ionicons name="camera" size={17} color={colors.surface} />}
        </TouchableOpacity>
      </View>
      <View style={styles.heroText}><Text style={styles.name}>{displayName}</Text><View style={styles.roleBadge}><Ionicons name="shield-checkmark" size={15} color={colors.primaryDark} /><Text style={styles.roleText}>Administrador</Text></View></View>
    </View>
    <View style={styles.statusCard}><View style={styles.statusIcon}><Ionicons name="checkmark-circle" size={22} color={colors.primary} /></View><View style={styles.statusContent}><Text style={styles.statusTitle}>Conta activa</Text><Text style={styles.statusDescription}>Acesso autorizado ao painel administrativo.</Text></View></View>
    <Text style={styles.sectionTitle}>Dados da conta</Text>
    <View style={styles.detailsCard}>
      <DetailRow icon="person-outline" label="Nome" value={displayName} />
      <DetailRow icon="mail-outline" label="Email" value={user?.email || 'Não informado'} />
      {user?.phone ? <DetailRow icon="call-outline" label="Contacto" value={user.phone} /> : null}
      <DetailRow icon="key-outline" label="Nível de acesso" value="Administração" last />
    </View>
    <View style={styles.securityNote}><Ionicons name="lock-closed-outline" size={20} color={colors.support} /><Text style={styles.securityText}>Esta conta possui permissões administrativas. Não partilhe as suas credenciais.</Text></View>
    <TouchableOpacity style={styles.logoutButton} onPress={() => setConfirmLogout(true)}><Ionicons name="log-out-outline" size={21} color={colors.error} /><Text style={styles.logoutText}>Terminar sessão</Text></TouchableOpacity>
    <Modal visible={photoPreviewOpen} transparent animationType="fade" onRequestClose={() => setPhotoPreviewOpen(false)}><TouchableOpacity style={styles.photoModal} activeOpacity={1} onPress={() => setPhotoPreviewOpen(false)}><Image source={{ uri: user?.image }} style={styles.previewImage} resizeMode="contain" /><Text style={styles.photoHint}>Toque para fechar</Text></TouchableOpacity></Modal>
    <Modal visible={confirmLogout} transparent animationType="fade" onRequestClose={() => setConfirmLogout(false)}><View style={styles.modalBackdrop}><View style={styles.modalCard}><View style={styles.modalIcon}><Ionicons name="log-out-outline" size={26} color={colors.error} /></View><Text style={styles.modalTitle}>Terminar sessão?</Text><Text style={styles.modalMessage}>Terá de iniciar sessão novamente para aceder à administração.</Text><View style={styles.modalActions}><TouchableOpacity style={styles.cancelButton} onPress={() => setConfirmLogout(false)}><Text style={styles.cancelText}>Cancelar</Text></TouchableOpacity><TouchableOpacity style={styles.confirmButton} onPress={handleLogout}><Text style={styles.confirmText}>Sair</Text></TouchableOpacity></View></View></View></Modal>
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background }, content: { padding: spacing.xl, paddingBottom: 48 }, title: { ...typography.display, color: colors.text }, subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 4, marginBottom: 22 },
  heroCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.xl, padding: 20, borderWidth: 1, borderColor: colors.border, ...shadows.card }, avatarWrapper: { position: 'relative' }, avatar: { width: 78, height: 78, borderRadius: 39 }, avatarFallback: { width: 78, height: 78, borderRadius: 39, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' }, cameraButton: { position: 'absolute', right: -4, bottom: -4, width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, borderWidth: 3, borderColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, initials: { color: colors.primaryDark, fontSize: 25, fontWeight: '900' }, heroText: { flex: 1, marginLeft: 16 }, name: { ...typography.heading, color: colors.text, fontSize: 20 },
  roleBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.primaryLight, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6, marginTop: 8 }, roleText: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
  statusCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryMuted, borderRadius: radius.lg, padding: 15, marginTop: 14, borderWidth: 1, borderColor: colors.primaryLight }, statusIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, statusContent: { flex: 1, marginLeft: 12 }, statusTitle: { color: colors.primaryDark, fontWeight: '800', fontSize: 15 }, statusDescription: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: { ...typography.heading, color: colors.text, marginTop: 25, marginBottom: 10 }, detailsCard: { backgroundColor: colors.surface, borderRadius: radius.xl, paddingHorizontal: 17, borderWidth: 1, borderColor: colors.border, ...shadows.card }, detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.border }, detailRowLast: { borderBottomWidth: 0 }, detailIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }, detailContent: { flex: 1, marginLeft: 12 }, detailLabel: { ...typography.caption, color: colors.textSecondary }, detailValue: { ...typography.body, color: colors.text, fontWeight: '700', marginTop: 1 },
  securityNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#EFF6FF', borderRadius: radius.lg, padding: 15, marginTop: 16 }, securityText: { ...typography.caption, color: '#1E3A8A', flex: 1 }, logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 54, borderRadius: radius.lg, backgroundColor: colors.errorLight, marginTop: 22 }, logoutText: { color: colors.error, fontSize: 15, fontWeight: '800' },
  photoModal: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.9)', justifyContent: 'center', alignItems: 'center', padding: 24 }, previewImage: { width: '100%', height: '70%' }, photoHint: { color: colors.surface, marginTop: 16 },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(15, 23, 42, 0.5)' }, modalCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 22 }, modalIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.errorLight, alignItems: 'center', justifyContent: 'center', marginBottom: 15 }, modalTitle: { ...typography.heading, color: colors.text }, modalMessage: { ...typography.body, color: colors.textSecondary, marginTop: 8 }, modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 22 }, cancelButton: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: radius.md, backgroundColor: colors.surfaceMuted }, cancelText: { color: colors.textSecondary, fontWeight: '800' }, confirmButton: { paddingHorizontal: 22, paddingVertical: 12, borderRadius: radius.md, backgroundColor: colors.error }, confirmText: { color: colors.surface, fontWeight: '800' },
});
