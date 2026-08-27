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
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
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

const provinceOptions = ['Maputo', 'Gaza', 'Inhambane', 'Sofala', 'Manica', 'Tete', 'Zambézia', 'Nampula', 'Niassa', 'Cabo Delgado'];
const categoryOptions = ['Farmácia', 'Clínica', 'Outro'];
const cityOptionsByProvince = {
  Maputo: ['Maputo Cidade', 'Matola', 'Boane', 'Marracuene', 'Magude'],
  Gaza: ['Xai-Xai', 'Chibuto', 'Massingir', 'Bilene', 'Mabalane'],
  Inhambane: ['Inhambane', 'Maxixe', 'Vilankulo', 'Jangamo', 'Panda'],
  Sofala: ['Beira', 'Dondo', 'Nhamatanda', 'Muanza', 'Save'],
  Manica: ['Chimoio', 'Barue', 'Gondola', 'Sussundenga', 'Machaze'],
  Tete: ['Tete', 'Moatize', 'Mutarara', 'Chiuta', 'Angónia'],
  'Zambézia': ['Quelimane', 'Milange', 'Gurué', 'Alto Molócuè', 'Namacurra'],
  Nampula: ['Nampula', 'Malema', 'Mecubúri', 'Ribaue', 'Monapo'],
  Niassa: ['Lichinga', 'Cuamba', 'Majune', 'Sanga', 'Marrupa'],
  'Cabo Delgado': ['Pemba', 'Metuge', 'Mueda', 'Montepuez', 'Ancuabe'],
};

export default function ProfileScreen({ navigation }) {
  const tabBarHeight = useBottomTabBarHeight();
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
  const [neighborhood, setNeighborhood] = useState('');
  const [locationReference, setLocationReference] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [open24h, setOpen24h] = useState(false);
  const [openingTime, setOpeningTime] = useState('08:00');
  const [closingTime, setClosingTime] = useState('18:00');
  const [logo, setLogo] = useState(user?.image || null);
  const [logoChanged, setLogoChanged] = useState(false);
  const [pharmacyId, setPharmacyId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [approved, setApproved] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [medicineCount, setMedicineCount] = useState(0);
  const [pharmacyStats, setPharmacyStats] = useState({ views: 0 });
  const [provincePickerOpen, setProvincePickerOpen] = useState(false);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);

  const cityOptions = cityOptionsByProvince[province] || [];

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
        setName(pharmacy.name || user?.name || '');
        setDescription(pharmacy.description || '');
        setContact(pharmacy.phone || user?.phone || '');
        setWhatsapp(pharmacy.whatsapp || user?.phone || '');
        setProvince(pharmacy.province || '');
        setCity(pharmacy.city || '');
        setDistrict(pharmacy.district || '');
        setNeighborhood(pharmacy.neighborhood || '');
        setAddress(pharmacy.address || '');
        setLocationReference(pharmacy.location || '');
        setLatitude(pharmacy.latitude != null ? String(pharmacy.latitude) : '');
        setLongitude(pharmacy.longitude != null ? String(pharmacy.longitude) : '');
        const savedHours = pharmacy.openingHours || '08:00 - 18:00';
        setOpen24h(savedHours === '24h');
        if (savedHours !== '24h') {
          const [start, end] = savedHours.split('-').map((part) => part.trim());
          setOpeningTime(start || '08:00');
          setClosingTime(end || '18:00');
        }
        setApproved(Boolean(pharmacy.approved));
        setLogo(pharmacy.image || null);
        setPharmacyStats({ views: Number(pharmacy.views || 0) });
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
        try {
          const medications = await import('../../services/api').then(({ getMyPharmacyMedicines }) => getMyPharmacyMedicines());
          setMedicineCount(Array.isArray(medications) ? medications.length : 0);
        } catch (error) {
          setMedicineCount(0);
        }
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
    if (!name.trim() || !address.trim() || !contact.trim() || !province.trim()) {
      return Alert.alert('Dados obrigatórios', 'Preencha nome, contacto, província e endereço da farmácia.');
    }
    if (!open24h && (!/^\d{2}:\d{2}$/.test(openingTime.trim()) || !/^\d{2}:\d{2}$/.test(closingTime.trim()))) {
      return Alert.alert('Horário inválido', 'Use o formato HH:MM para abertura e encerramento.');
    }
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
      payload.append('district', district.trim());
      payload.append('neighborhood', neighborhood.trim());
      payload.append('location', locationReference.trim());
      if (latitude.trim() && longitude.trim()) {
        payload.append('latitude', latitude.trim());
        payload.append('longitude', longitude.trim());
      }
      payload.append('openingHours', open24h ? '24h' : `${openingTime.trim()} - ${closingTime.trim()}`);

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
      Alert.alert('Erro', 'Não foi possível salvar o perfil.');
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
      Alert.alert('Erro', 'Não foi possível salvar o perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleProvinceSelect = (nextProvince) => {
    setProvince(nextProvince);
    const nextCities = cityOptionsByProvince[nextProvince] || [];
    if (nextCities.length > 0 && !nextCities.includes(city)) {
      setCity(nextCities[0]);
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
    <ScrollView style={styles.page} contentContainerStyle={[styles.container, { paddingBottom: tabBarHeight + 32 }]} keyboardShouldPersistTaps="handled">
      <View style={styles.topCard}>
        <View style={styles.topInfo}>
          <TouchableOpacity
            style={styles.logoWrapper}
            onPress={() => {
              if (logo) setPhotoPreviewOpen(true);
              else if (isPharmacy || isPatient) pickImage(setLogo);
            }}
            activeOpacity={isPharmacy || isPatient ? 0.7 : 1}
          >
            {logo ? (
              <Image source={{ uri: logo }} style={styles.logoImage} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Ionicons name={isPharmacy ? 'business' : 'person-circle'} size={28} color="#2F9E5D" />
              </View>
            )}
            {isPharmacy || isPatient ? (
              <TouchableOpacity
                style={styles.logoEditBadge}
                onPress={() => pickImage(setLogo)}
                accessibilityRole="button"
                accessibilityLabel="Alterar foto do perfil"
              >
                <Ionicons name="camera" size={15} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null}
          </TouchableOpacity>
          <View style={styles.brandInfo}>
            <Text style={styles.brandTitle}>{name}</Text>
            <Text style={[styles.brandStatus, isPharmacy ? (approved ? styles.brandStatusApproved : styles.brandStatusPending) : styles.brandStatusPatient]}>{status}</Text>
            <Text style={styles.brandSubtitle}>{isPharmacy ? 'Atualize o perfil e ajude clientes a encontrar sua farmácia.' : 'Atualize seus dados pessoais para continuar usando o FarmaBusca.'}</Text>
            {profileMessage ? <Text style={styles.profileMessage}>{profileMessage}</Text> : null}
          </View>
        </View>
      </View>

      {isPatient ? (
        <TouchableOpacity style={styles.planBanner} onPress={() => navigation.navigate('Plans')} activeOpacity={0.86} accessibilityRole="button" accessibilityLabel="Ver planos do FarmaBusca">
          <View style={styles.planIcon}><Ionicons name="sparkles" size={20} color="#166534" /></View>
          <View style={styles.planCopy}><Text style={styles.planEyebrow}>PLANOS FARMA busca</Text><Text style={styles.planTitle}>Cuide da sua saúde do seu jeito</Text><Text style={styles.planText}>Comece grátis e escolha mais benefícios quando precisar.</Text></View>
          <Ionicons name="chevron-forward" size={20} color="#166534" />
        </TouchableOpacity>
      ) : null}

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
        {isPharmacy ? (
          <View style={styles.selectField}>
            <Text style={styles.label}>Categoria</Text>
            <TouchableOpacity style={styles.selectBox} onPress={() => setCategoryPickerOpen(true)}>
              <Text style={[styles.selectValue, !category && styles.placeholderText]}>{category || 'Selecione a categoria'}</Text>
              <Ionicons name="chevron-down" size={18} color="#475569" />
            </TouchableOpacity>
          </View>
        ) : null}
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
            <View style={styles.selectField}>
              <Text style={styles.label}>Província</Text>
              <TouchableOpacity style={styles.selectBox} onPress={() => setProvincePickerOpen(true)}>
                <Text style={[styles.selectValue, !province && styles.placeholderText]}>{province || 'Selecione a província'}</Text>
                <Ionicons name="chevron-down" size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            <View style={styles.selectField}>
              <Text style={styles.label}>Cidade</Text>
              <TouchableOpacity style={styles.selectBox} onPress={() => setCityPickerOpen(true)} disabled={!province}>
                <Text style={[styles.selectValue, (!city || !province) && styles.placeholderText]}>{city || 'Selecione a cidade'}</Text>
                <Ionicons name="chevron-down" size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            <CustomInput label="Distrito" placeholder="Informe o distrito" value={district} onChangeText={setDistrict} />
            <CustomInput label="Bairro" placeholder="Informe o bairro" value={neighborhood} onChangeText={setNeighborhood} />
            <CustomInput label="Endereço" placeholder="Endereço completo" value={address} onChangeText={setAddress} />
            <CustomInput label="Ponto de referência" placeholder="Ex.: junto ao mercado" value={locationReference} onChangeText={setLocationReference} />
          </View>

          <Modal visible={categoryPickerOpen} transparent animationType="fade" onRequestClose={() => setCategoryPickerOpen(false)}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCategoryPickerOpen(false)}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Selecione a categoria</Text>
                <ScrollView style={styles.modalList}>
                  {categoryOptions.map((item) => (
                    <TouchableOpacity key={item} style={styles.optionItem} onPress={() => { setCategory(item); setCategoryPickerOpen(false); }}>
                      <Text style={styles.optionText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>

          <Modal visible={provincePickerOpen} transparent animationType="fade" onRequestClose={() => setProvincePickerOpen(false)}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setProvincePickerOpen(false)}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Selecione a província</Text>
                <ScrollView style={styles.modalList}>
                  {provinceOptions.map((item) => (
                    <TouchableOpacity key={item} style={styles.optionItem} onPress={() => { handleProvinceSelect(item); setProvincePickerOpen(false); }}>
                      <Text style={styles.optionText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>

          <Modal visible={cityPickerOpen} transparent animationType="fade" onRequestClose={() => setCityPickerOpen(false)}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCityPickerOpen(false)}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Selecione a cidade</Text>
                <ScrollView style={styles.modalList}>
                  {(cityOptions.length ? cityOptions : ['Selecione primeiro a província']).map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={styles.optionItem}
                      onPress={() => {
                        if (item === 'Selecione primeiro a província') return;
                        setCity(item);
                        setCityPickerOpen(false);
                      }}
                    >
                      <Text style={styles.optionText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Horário</Text>
              <TouchableOpacity onPress={() => setOpen24h((prev) => !prev)}>
                <Text style={styles.sectionLink}>{open24h ? 'Desativar 24h' : 'Aberto 24 horas'}</Text>
              </TouchableOpacity>
            </View>
            {!open24h ? (
              <View style={styles.hoursInputs}>
                <View style={styles.hourInput}>
                  <CustomInput label="Hora de abertura" placeholder="08:00" value={openingTime} onChangeText={setOpeningTime} keyboardType="numbers-and-punctuation" />
                </View>
                <View style={styles.hourInput}>
                  <CustomInput label="Hora de encerramento" placeholder="18:00" value={closingTime} onChangeText={setClosingTime} keyboardType="numbers-and-punctuation" />
                </View>
              </View>
            ) : null}
            {defaultHours.map((item) => (
              <View key={item.day} style={styles.scheduleRow}>
                <Text style={styles.scheduleDay}>{item.day}</Text>
                <Text style={styles.scheduleTime}>{open24h ? '24 horas' : `${openingTime} - ${closingTime}`}</Text>
              </View>
            ))}
          </View>

          <View style={styles.statsCard}>
            <Text style={styles.sectionTitle}>Estatísticas</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{pharmacyStats.views}</Text>
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
        <CustomButton title={saving ? 'Salvando...' : isPharmacy ? (pharmacyId ? 'Salvar alterações' : 'Criar perfil da farmácia') : 'Atualizar perfil'} loading={saving} icon="save-outline" onPress={isPharmacy ? () => saveProfile() : savePatientProfile} />
        {isPharmacy && pharmacyId ? (
          <CustomButton
            title="Enviar ou actualizar documentos"
            variant="secondary"
            icon="document-text-outline"
            onPress={() => {
              const parentNavigation = navigation.getParent();
              if (parentNavigation) parentNavigation.navigate('PharmacyProfileDocs');
              else navigation.navigate('PharmacyProfileDocs');
            }}
          />
        ) : null}
        <CustomButton title="Sair" variant="dangerSecondary" icon="log-out-outline" style={styles.logoutButton} onPress={() => logout('Login')} />
      </View>

      <Modal visible={photoPreviewOpen} transparent animationType="fade" onRequestClose={() => setPhotoPreviewOpen(false)}>
        <TouchableOpacity style={styles.photoModal} activeOpacity={1} onPress={() => setPhotoPreviewOpen(false)}>
          <Image source={{ uri: logo }} style={styles.previewImage} resizeMode="contain" />
          <Text style={styles.photoHint}>Toque para fechar</Text>
        </TouchableOpacity>
      </Modal>
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
  planBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 20, borderRadius: 18, backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#A7E3B9' },
  planIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  planCopy: { flex: 1 },
  planEyebrow: { color: '#166534', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  planTitle: { color: '#10231A', fontSize: 15, fontWeight: '800', marginTop: 2 },
  planText: { color: '#62706A', fontSize: 12, marginTop: 3 },
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
  logoEditBadge: {
    position: 'absolute',
    right: -5,
    bottom: -5,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#2F9E5D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
  label: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 8 },
  selectField: { marginBottom: 14 },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#DDE7F0',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selectValue: { color: '#0F172A', fontSize: 14, fontWeight: '600', flex: 1 },
  placeholderText: { color: '#94A3B8' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    maxHeight: 420,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  modalList: { maxHeight: 300 },
  optionItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  optionText: { color: '#0F172A', fontSize: 15, fontWeight: '600' },
  scheduleRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  hoursInputs: { flexDirection: 'row', gap: 10, marginTop: 14 },
  hourInput: { flex: 1 },
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
  actionsContainer: { marginTop: 4, marginBottom: 24 },
  logoutButton: { borderWidth: 1, borderColor: '#FDA4AF', marginTop: 12 },
  photoModal: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  previewImage: {
    width: '100%',
    height: '70%',
  },
  photoHint: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 16,
  },
});
