import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function DashboardCard({ title, value, color = '#fff' }) {
  return (
    <View style={[styles.card, { backgroundColor: color }]}> 
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, padding: 16, borderRadius: 12, margin: 6, minWidth: 120, alignItems: 'flex-start' },
  value: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  title: { marginTop: 6, color: '#6b7280', fontSize: 13 }
});
