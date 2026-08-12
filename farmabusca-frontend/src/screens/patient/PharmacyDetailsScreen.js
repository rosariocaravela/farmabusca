import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, Platform, Alert, Image, Modal, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Header from '../../components/Header';
import CustomButton from '../../components/CustomButton';
import { getPharmacyById } from '../../services/api';

const openMap = async (address) => {
  if (!address) return Alert.alert('Endereço não disponível', 'Não foi possível localizar a farmácia.');

  const query = encodeURIComponent(address);
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

const openWhatsApp = async (phone) => {
  if (!phone) return Alert.alert('Número não disponível', 'Não foi possível abrir o WhatsApp.');
  const cleaned = phone.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/${cleaned}`;

  try {
    if (Platform.OS === 'web') {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    const supported = await Linking.canOpenURL(whatsappUrl);
    if (supported) {
      await Linking.openURL(whatsappUrl);
    } else {
      await Linking.openURL(`https://api.whatsapp.com/send?phone=${cleaned}`);
    }
  } catch (error) {
    Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.');
  }
};

const getPharmacyOpenStatus = (openingHours) => {
  if (!openingHours) return false;
  const normalized = openingHours.trim().toLowerCase();
  if (normalized === '24h' || normalized === 'aberto 24 horas') return true;
  if (normalized === 'fechado') return false;

  const parts = openingHours.split('-').map((part) => part.trim());
  if (parts.length !== 2) return false;

  const [openStr, closeStr] = parts;
  const [openHour, openMinute] = openStr.split(':').map(Number);
  const [closeHour, closeMinute] = closeStr.split(':').map(Number);
  if (Number.isNaN(openHour) || Number.isNaN(openMinute) || Number.isNaN(closeHour) || Number.isNaN(closeMinute)) {
    return false;
  }

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openHour * 60 + openMinute;
  const closeMinutes = closeHour * 60 + closeMinute;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
};

export default function PharmacyDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { item } = route.params || {};
  const [details, setDetails] = useState(item || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    const pharmacyId = item?.id;
    if (!pharmacyId) {
      setLoading(false);
      setError('Dados da farmácia indisponíveis.');
      return () => {
        mounted = false;
      };
    }

    setLoading(true);
    setError(null);
    getPharmacyById(pharmacyId)
      .then((data) => {
        if (!mounted) return;
        setDetails(data);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.response?.data?.message || err.message || 'Erro ao carregar farmácia');
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [item]);

  const pharmacyData = details?.data || details;
  const pharmacyItem = pharmacyData?.Pharmacy || pharmacyData || item;
  const hasPharmacyData = Boolean(pharmacyItem && (pharmacyItem.name || pharmacyItem.address || pharmacyItem.location || pharmacyItem.phone));
  const name = pharmacyItem?.name || item?.name || 'Farmácia';
  const address = pharmacyItem?.address || pharmacyItem?.location || item?.address || item?.location || 'Endereço não disponível';
  const phone = pharmacyItem?.phone || item?.phone || '84 000 000';
  const openingHours = pharmacyItem?.openingHours || item?.openingHours || '08:00 - 20:00';
  const isOpen = getPharmacyOpenStatus(openingHours);
  const imageSource = pharmacyItem?.image || pharmacyItem?.imageUrl || item?.image || item?.imageUrl || item?.logo || null;
  const whatsapp = pharmacyItem?.whatsapp || item?.whatsapp || item?.phone || '';

  return (
    <ScrollView style={styles.container}>
      <Header title={name} subtitle="Detalhes da farmácia" onBack={() => navigation.goBack()} />
      <View style={styles.card}>
        {loading ? (
          <Text style={styles.loadingText}>Carregando dados da farmácia...</Text>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : !hasPharmacyData ? (
          <View style={styles.emptyState}>
            <Text style={styles.errorText}>Dados da farmácia não disponíveis.</Text>
            <Text style={styles.text}>Volte e selecione outra farmácia ou tente novamente mais tarde.</Text>
          </View>
        ) : (
          <>
            {imageSource ? (
              <TouchableOpacity style={styles.imageWrapper} onPress={() => setImageModalVisible(true)} activeOpacity={0.8}>
                <Image source={{ uri: imageSource }} style={styles.image} />
                <View style={styles.imageOverlay}>
                  <Text style={styles.imageOverlayText}>Ver foto</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.imageBox}><Text style={{ fontSize: 36 }}>🏥</Text></View>
            )}
            <Text style={styles.name}>{name}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusBadge, isOpen ? styles.statusOpen : styles.statusClosed]}>
                <Text style={[styles.statusText, isOpen ? styles.statusTextOpen : styles.statusTextClosed]}>
                  {isOpen ? '🟢 Aberta' : '🔴 Fechada'}
                </Text>
              </View>
            </View>
            <Text style={styles.availabilityText}>Disponibilidade: {isOpen ? 'Aberta agora' : 'Fechada no momento'}</Text>
            <Text style={styles.text}>Endereço: {address}</Text>
            <Text style={styles.text}>Telefone: {phone}</Text>
            <Text style={styles.text}>Horário: {openingHours}</Text>
            <View style={{ marginTop: 16 }}>
              <CustomButton title="Ligar" onPress={() => Linking.openURL(`tel:${phone.replace(/[^0-9]/g, '')}`)} />
              <CustomButton title="WhatsApp" variant="secondary" onPress={() => openWhatsApp(whatsapp)} />
              <CustomButton title="Mapa" variant="secondary" onPress={() => openMap(address)} />
            </View>
          </>
        )}
      </View>
      <Modal visible={imageModalVisible} transparent animationType="fade" onRequestClose={() => setImageModalVisible(false)}>
        <TouchableOpacity style={styles.modalBackground} activeOpacity={1} onPress={() => setImageModalVisible(false)}>
          <Image source={{ uri: imageSource }} style={styles.modalImage} />
          <Text style={styles.modalCloseText}>Toque para fechar</Text>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  card: { backgroundColor: '#FFF', margin: 16, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#E8EEF5' },
  imageBox: { width: 72, height: 72, borderRadius: 20, backgroundColor: '#EAF2FF', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  imageWrapper: { width: 96, height: 96, borderRadius: 20, overflow: 'hidden', marginBottom: 12, alignSelf: 'center' },
  image: { width: '100%', height: '100%' },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
  },
  imageOverlayText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '800', color: '#333' },
  text: { color: '#666', marginTop: 8 },
  statusRow: { flexDirection: 'row', marginTop: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  statusOpen: { backgroundColor: '#E6F4EA' },
  statusClosed: { backgroundColor: '#FDE7E7' },
  statusText: { fontSize: 13, fontWeight: '700' },
  statusTextOpen: { color: '#1F7A3E' },
  statusTextClosed: { color: '#B21C1C' },
  loadingText: { color: '#55606C', fontSize: 16, textAlign: 'center' },
  errorText: { color: '#B00020', fontSize: 16, textAlign: 'center' },
  availabilityText: { color: '#475569', fontSize: 14, marginTop: 8 },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '92%',
    height: '70%',
    resizeMode: 'contain',
  },
  modalCloseText: {
    color: '#FFF',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    paddingVertical: 36,
    alignItems: 'center',
  },
});
