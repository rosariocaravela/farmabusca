import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function MedicineCard({ item, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handleIn = () => {
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
  };

  const handleOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handleIn}
        onPressOut={handleOut}
        style={styles.card}
      >
        <View style={styles.row}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.thumb} />
          ) : (
            <View style={styles.iconWrap}>
              <Ionicons name="medkit-outline" size={22} color="#2F9E5D" />
            </View>
          )}
          <View style={[{ flex: 1 }, item.image ? { marginLeft: 12 } : null]}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.price}>{item.price ? `${item.price} MT` : 'Consulte preço'}</Text>
          </View>
        </View>
        <View style={styles.footer}>
          <Text style={styles.pharmacy}>{item.pharmacy}</Text>
          <View style={[styles.badge, item.stock === 'Disponível' ? styles.badgeSuccess : styles.badgeWarning]}>
            <Text style={styles.badgeText}>{item.stock}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDF5EE',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: '#233447' },
  description: { marginTop: 4, color: '#6F7882', fontSize: 13 },
  price: { marginTop: 8, color: '#2F9E5D', fontWeight: '700' },
  thumb: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#F2F7F2' },
  iconWrap: { marginLeft: 10, backgroundColor: '#EAF8EE', borderRadius: 999, padding: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  pharmacy: { color: '#5E6572', fontWeight: '600', fontSize: 12 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeSuccess: { backgroundColor: '#EAF8EE' },
  badgeWarning: { backgroundColor: '#FFF5E8' },
  badgeText: { color: '#2F9E5D', fontSize: 11, fontWeight: '700' },
});
