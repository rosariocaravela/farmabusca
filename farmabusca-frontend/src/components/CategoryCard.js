import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CategoryCard({ title, icon, onPress, color }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: color || '#EAF8EE' }]}>
        <Ionicons name={icon} size={22} color={color ? '#FFFFFF' : '#2F9E5D'} />
      </View>
      <Text style={styles.title}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDF5EE',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  title: { fontWeight: '700', color: '#243447' },
});
