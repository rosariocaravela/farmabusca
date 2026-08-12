import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

export default function Loading({ message = 'A carregar...' }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <ActivityIndicator size="large" color="#1976D2" />
      <Text style={{ marginTop: 12, color: '#666' }}>{message}</Text>
    </View>
  );
}
