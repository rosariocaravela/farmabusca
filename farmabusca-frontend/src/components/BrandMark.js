import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';

export default function BrandMark({ compact = false, inverse = false }) {
  return <View style={styles.row} accessibilityLabel="FarmaBusca">
    <View style={[styles.mark, compact && styles.compact, inverse && styles.inverseMark]}>
      <Ionicons name="sparkles" size={compact ? 20 : 30} color={inverse ? colors.primary : colors.surface} />
    </View>
    {!compact && <View style={styles.copy}><Text style={[styles.name, inverse && styles.inverseText]}>Farma<Text style={styles.accent}>Busca</Text></Text></View>}
  </View>;
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  mark: { width: 64, height: 64, borderRadius: 19, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  compact: { width: 40, height: 40, borderRadius: 13 },
  inverseMark: { backgroundColor: colors.surface },
  copy: { marginLeft: 12 },
  name: { color: colors.text, fontSize: 28, fontWeight: '800' },
  inverseText: { color: colors.surface },
  accent: { color: colors.primary },
});
