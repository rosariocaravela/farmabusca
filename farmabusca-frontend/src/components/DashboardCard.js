import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardCard({ title, value, color = '#fff', accentColor = '#0F766E', icon }) {
  return (
    <View style={[styles.card, { backgroundColor: color, borderColor: `${accentColor}20` }]}> 
      <View style={styles.cardHeader}>
        <Text style={styles.value}>{value}</Text>
        {icon ? (
          <View style={[styles.iconContainer, { backgroundColor: `${accentColor}18` }]}>
            <Ionicons name={icon} size={20} color={accentColor} />
          </View>
        ) : null}
      </View>
      <Text style={styles.title}>{title}</Text>
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, padding: 18, borderRadius: 18, minWidth: 120, minHeight: 126, alignItems: 'flex-start', borderWidth: 1, overflow: 'hidden' },
  cardHeader: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconContainer: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 28, lineHeight: 34, fontWeight: '900', color: '#0F172A' },
  title: { marginTop: 12, color: '#475569', fontSize: 14, lineHeight: 19, fontWeight: '600' },
  accent: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 4 }
});
