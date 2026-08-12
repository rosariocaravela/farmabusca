import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from './Header';

export default function PharmacyHeader({
  name = 'Minha Farmácia',
  onEdit,
  onViewStore,
  onNotifications,
  onMenu,
  logo,
}) {
  const getInitials = (text) => {
    if (!text) return 'FR';
    const words = text.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  const initials = getInitials(name);
  const right = (
    <View style={styles.rightGroup}>
      <TouchableOpacity onPress={onNotifications} style={styles.iconBtn}>
        <Ionicons name="notifications-outline" size={20} color="#2F9E5D" />
      </TouchableOpacity>
      <TouchableOpacity onPress={onEdit} style={styles.avatarBtn}>
        {logo ? <Image source={{ uri: logo }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{initials}</Text>}
      </TouchableOpacity>
    </View>
  );

  return <Header title={name} subtitle="Gerencie seus medicamentos e informações da farmácia" onMenu={onMenu} right={right} />;
}

const styles = StyleSheet.create({
  rightGroup: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: {
    marginLeft: 8,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EAF8EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBtn: {
    marginLeft: 12,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#2F9E5D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#FFFFFF', fontWeight: '800' },
  avatarImage: { width: 44, height: 44, borderRadius: 14 },
});
