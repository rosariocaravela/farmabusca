import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function EmptyState({ title, message, icon = 'information-circle-outline' }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <Ionicons name={icon} size={48} color="#1976D2" />
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#333', marginTop: 12 }}>{title}</Text>
      <Text style={{ textAlign: 'center', color: '#666', marginTop: 6 }}>{message}</Text>
    </View>
  );
}
