import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StatisticsCard({ label, value }) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, marginRight: 8, alignItems: 'center' },
  value: { fontSize: 18, fontWeight: '800', color: '#233447' },
  label: { marginTop: 6, color: '#6F7882', fontSize: 12 },
});
