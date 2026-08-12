import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PharmacyCard({ item, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  const handleIn = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
  const handleOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={handleIn} onPressOut={handleOut} style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.location}>{item.location}</Text>
            <Text style={styles.phone}>{item.phone}</Text>
          </View>
          <View style={styles.iconWrap}>
            <Ionicons name="storefront-outline" size={20} color="#2F9E5D" />
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
  location: { marginTop: 4, color: '#6F7882', fontSize: 13 },
  phone: { marginTop: 6, color: '#2F9E5D', fontWeight: '700' },
  iconWrap: { marginLeft: 10, backgroundColor: '#EAF8EE', borderRadius: 999, padding: 10 },
});
