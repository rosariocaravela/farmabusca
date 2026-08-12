import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { createPharmacyProfile, getMyPharmacy, getProfile, updateUserProfile, updatePharmacyProfile } from '../../services/api';
import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';

const defaultHours = [
  { day: 'Segunda-feira', time: '08:00 - 18:00' },
  { day: 'Terça-feira', time: '08:00 - 18:00' },
  { day: 'Quarta-feira', time: '08:00 - 18:00' },
  { day: 'Quinta-feira', time: '08:00 - 18:00' },
  { day: 'Sexta-feira', time: '08:00 - 18:00' },
  { day: 'Sábado', time: '08:00 - 14:00' },
  { day: 'Domingo', time: 'Fechado' },
];

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateSessionUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState(user?.phone || '');
  const [whatsapp, setWhatsapp] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [category, setCategory] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [open24h, setOpen24h] = useState(false);
  const [logo, setLogo] = useState(user?.image || null);
  const [logoChanged, setLogoChanged] = useState(false);
  const [pharmacyId, setPharmacyId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [approved, setApproved] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const medicineCount = 24;

  const isPharmacy = user?.role?.toLowerCase() === 'pharmacy';
  const isPatient = user?.role?.toLowerCase() === 'patient';
  const status = isPharmacy ? (approved ? '🟢 Farmácia aprovada' : '🟠 Aguardando aprovação') : '👤 Perfil de paciente';

  const pickImage = async (setter) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const mediaTypes = ImagePicker.MediaType ? [ImagePicker.MediaType.Images] : ImagePicker.MediaTypeOptions.Images;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes,
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets?.[0]?.uri || result.uri;
      setter(uri);
      setLogoChanged(true);
    }
  };

  const buildImageField = async (imageUri) => {
    if (!imageUri) return null;

    const uriParts = imageUri.split('/');
    const fileName = uriParts[uriParts.length - 1] || `pharmacy-${Date.now()}.jpg`;
    const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const type = extension === 'png' ? 'image/png' : 'image/jpeg';

    const shouldFetch = imageUri.startsWith('http://') || imageUri.startsWith('https://');
    if (Platform.OS === 'web' || shouldFetch) {
      try {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        if (Platform.OS === 'web') {
          return new File([blob], fileName, { type: blob.type || type });
        }

        const file = new Blob([blob], { type: blob.type || type });
        file.name = fileName;
        return file;
      } catch (err) {
        console.error('Image fetch error', err);
        return null;
      }
    }

    return {
      uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
      name: fileName,
      type,
    };
  };

  const removeImage = (uri) => {
    setLogo(null);
  };

  const loadPharmacyProfile = async () => {
    try {
      const pharmacy = await getMyPharmacy();
      if (pharmacy) {
        setPharmacyId(pharmacy.id);
        setName(pharmacy.name || user?.name || 'Farmácia Central');
        setDescription(pharmacy.description || 'Especializada em medicamentos e atendimento local.');
        setContact(pharmacy.phone || user?.phone || '84 000 000');
        setWhatsapp(pharmacy.whatsapp || user?.phone || '');
        setProvince(pharmacy.province || 'Maputo');
        setCity(pharmacy.city || 'Maputo Cidade');
        setAddress(pharmacy.address || 'Av. 25 de Setembro, 123');
        setOpen24h(pharmacy.openingHours === '24h');
        setApproved(Boolean(pharmacy.approved));
        setLogo(pharmacy.image || null);
        setLogoChanged(false);
      } else {
        setPharmacyId(null);
        setApproved(false);
        setProfileMessage('Complete o perfil da farmácia para que ele apareça no aplicativo.');
      }
    } catch (error) {
      setPharmacyId(null);
      setApproved(false);
      setProfileMessage('Complete o perfil da farmácia para que ele apareça no aplicativo.');
      console.log('Erro carregando perfil da farmácia', error.response?.data || error.message || error);
    }
  };

  const loadProfile = async () => {
    if (!user) return;
    setLoadingProfile(true);

    try {
      const currentUser = await getProfile();
      if (currentUser) {
        setName(currentUser.name || '');
        setEmail(currentUser.email || '');
        setContact(currentUser.phone || '');
        setLogo(currentUser.image || logo);
      }

      if (currentUser?.role?.toLowerCase() === 'pharmacy') {
        await loadPharmacyProfile();
      }
    } catch (error) {
      console.log('Erro carregando perfil', error.response?.data || error.message || error);
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const saveProfile = async () => {
    setSaving(true);
    setProfileMessage('');
    try {
      const payload = new FormData();
      payload.append('name', name.trim());
      payload.append('description', description.trim());
      payload.append('phone', contact.trim());
      payload.append('whatsapp', whatsapp.trim());
      payload.append('address', address.trim());
      payload.append('city', city.trim());
      payload.append('province', province.trim());
      payload.append('openingHours', open24h ? '24h' : '08:00 - 18:00');

      if (logoChanged && logo) {
        const imageField = await buildImageField(logo);
        if (imageField) {
          payload.append('image', imageField);
        }
      }

      const pharmacy = pharmacyId
        ? await updatePharmacyProfile(payload, { headers: { 'Content-Type': 'multipart/form-data' } })
        : await createPharmacyProfile(payload, { headers: { 'Content-Type': 'multipart/form-data' } });

      setPharmacyId(pharmacy.id);
      setApproved(Boolean(pharmacy.approved));
      if (pharmacy.image) {
        setLogo(pharmacy.image);
      }
      setLogoChanged(false);
      setProfileMessage(pharmacy.approved ? 'Perfil atualizado e aprovado.' : 'Perfil salvo. Aguardando aprovação.');
      await loadPharmacyProfile();
    } catch (error) {
      console.log('Erro salvando perfil da farmácia', error.response?.data || error.message || error);
      Alert.alert('Erro', error.response?.data?.message || error.message || 'Não foi possível salvar o perfil da farmácia.');
    } finally {
      setSaving(false);
    }
  };

  const savePatientProfile = async () => {
    setSaving(true);
    setProfileMessage('');
    try {
      const payload = new FormData();
      payload.append('name', name.trim());
      payload.append('email', email.trim());
      payload.append('phone', contact.trim());

      if (logoChanged && logo) {
        const imageField = await buildImageField(logo);
        if (imageField) {
          payload.append('image', imageField);
        }
      }

      const updatedUser = await updateUserProfile(payload, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (updatedUser.image) {
        setLogo(updatedUser.image);
      }
      setLogoChanged(false);
      await updateSessionUser(updatedUser);
      setProfileMessage('Perfil do paciente atualizado com sucesso.');
    } catch (error) {
      console.log('Erro salvando perfil do paciente', error.response?.data || error.message || error);
      Alert.alert('Erro', error.response?.data?.message || error.message || 'Não foi possível salvar o perfil do paciente.');
    } finally {
      setSaving(false);
    }
  };

  const openMap = async () => {
    const fullAddress = `${address}, ${district}, ${city}, ${province}`;
    const query = encodeURIComponent(fullAddress);
    const url = Platform.select({
      ios: `maps:0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
    }) || `https://www.google.com/maps/search/?api=1&query=${query}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível abrir o mapa.');
    }
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.topCard}>
        <View style={styles.topInfo}>
          <TouchableOpacity
            style={styles.logoWrapper}
            onPress={() => (isPharmacy || isPatient ? pickImage(setLogo) : undefined)}
            activeOpacity={isPharmacy || isPatient ? 0.7 : 1}
          >
            {logo ? (
              <Image source={{ uri: logo }} style={styles.logoImage} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Ionicons name={isPharmacy ? 'business' : 'person-circle'} size={28} color="#2F9E5D" />
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.brandInfo}>
            <Text style={styles.brandTitle}>{name}</Text>
            <Text style={[styles.brandStatus, isPharmacy ? (approved ? styles.brandStatusApproved : styles.brandStatusPending) : styles.brandStatusPatient]}>{status}</Text>
            <Text style={styles.brandSubtitle}>{isPharmacy ? 'Atualize o perfil e ajude clientes a encontrar sua farmácia.' : 'Atualize seus dados pessoais para continuar usando o FarmaBusca.'}</Text>
            {profileMessage ? <Text style={styles.profileMessage}>{profileMessage}</Text> : null}
          </View>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{isPharmacy ? 'Informações básicas' : 'Dados pessoais'}</Text>
        <CustomInput label={isPharmacy ? 'Nome da farmácia' : 'Nome'} placeholder={isPharmacy ? 'Nome da farmácia' : 'Seu nome'} value={name} onChangeText={setName} />
        {isPharmacy ? (
          <CustomInput
            label="Descrição da farmácia"
            placeholder="Descrição breve"
            value={description}
            onChangeText={setDescription}
          />
        ) : null}
        <CustomInput label="Telefone" placeholder="84 000 000" value={contact} onChangeText={setContact} keyboardType="phone-pad" />
        <CustomInput label="WhatsApp" placeholder="84 256 7470" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" />
        <CustomInput label="Email" placeholder="seu@email.com" value={email} onChangeText={setEmail} keyboardType="email-address" />
        {isPharmacy ? <CustomInput label="Categoria" placeholder="Farmácia / Clínica / Outro" value={category} onChangeText={setCategory} /> : null}
      </View>

      {isPharmacy ? (
        <>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Localização</Text>
              <TouchableOpacity onPress={openMap}>
                <Text style={styles.sectionLink}>Localizar no mapa</Text>
              </TouchableOpacity>
            </View>
            <CustomInput label="Província" placeholder="Província" value={province} onChangeText={setProvince} />
            <CustomInput label="Cidade / Distrito" placeholder="Cidade ou distrito" value={city} onChangeText={setCity} />
            <CustomInput label="Bairro" placeholder="Bairro" value={district} onChangeText={setDistrict} />
            <CustomInput label="Endereço" placeholder="Endereço completo" value={address} onChangeText={setAddress} />
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Horário</Text>
              <TouchableOpacity onPress={() => setOpen24h((prev) => !prev)}>
                <Text style={styles.sectionLink}>{open24h ? 'Desativar 24h' : 'Aberto 24 horas'}</Text>
              </TouchableOpacity>
            </View>
            {defaultHours.map((item) => (
              <View key={item.day} style={styles.scheduleRow}>
                <Text style={styles.scheduleDay}>{item.day}</Text>
                <Text style={styles.scheduleTime}>{open24h ? '24 horas' : item.time}</Text>
              </View>
            ))}
          </View>

          <View style={styles.statsCard}>
            <Text style={styles.sectionTitle}>Estatísticas</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>540</Text>
                <Text style={styles.statLabel}>Visualizações</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{medicineCount}</Text>
                <Text style={styles.statLabel}>Medicamentos cadastrados</Text>
              </View>
            </View>
          </View>
        </>
      ) : null}

      <View style={styles.actionsContainer}>
        <CustomButton title={saving ? 'Salvando...' : isPharmacy ? (pharmacyId ? 'Salvar alterações' : 'Criar perfil da farmácia') : 'Atualizar perfil'} loading={saving} onPress={isPharmacy ? saveProfile : savePatientProfile} />
        <CustomButton title="Sair" style={styles.logoutButton} onPress={logout} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: '#EFF8F8' },
  container: { padding: 20, paddingBottom: 40 },
  topCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  topInfo: { flexDirection: 'row', alignItems: 'center' },
  logoWrapper: {
    width: 86,
    height: 86,
    borderRadius: 22,
    backgroundColor: '#F5FAF7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  logoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#EAF8EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 86,
    height: 86,
    borderRadius: 22,
  },
  brandInfo: { flex: 1 },
  brandTitle: { fontSize: 22, fontWeight: '800', color: '#1F2937', marginBottom: 8 },
  brandStatus: { fontSize: 14, color: '#16A34A', fontWeight: '700', marginBottom: 8 },
  brandSubtitle: { color: '#4B5563', fontSize: 14, lineHeight: 20 },
  brandStatusPatient: { color: '#2563EB', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  editButton: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2F9E5D',
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: '#ECFDF3',
  },
  editButtonText: {
    color: '#2F9E5D',
    fontWeight: '700',
    marginLeft: 8,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1F2937' },
  sectionLink: { color: '#2563EB', fontWeight: '700' },
  scheduleRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  scheduleDay: { color: '#4B5563', fontSize: 14 },
  scheduleTime: { color: '#111827', fontWeight: '700', fontSize: 14 },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  statItem: { width: '48%', backgroundColor: '#F5FAF7', borderRadius: 18, padding: 16 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#1F2937' },
  statLabel: { marginTop: 8, color: '#4B5563', fontSize: 13 },
  actionsContainer: { marginBottom: 24 },
  logoutButton: { backgroundColor: '#E85D5D', marginTop: 12 },
});
