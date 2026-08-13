import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';

export default function BrandMark({ compact = false, inverse = false }) {
  return <View style={styles.row} accessibilityLabel="FarmaBusca">
    <View style={[styles.mark, compact && styles.compact, inverse && styles.inverseMark]}>
      <Ionicons name="medical" size={compact ? 20 : 30} color={inverse ? colors.primary : colors.surface} />
    </View>
    {!compact && <Text style={[styles.name, inverse && styles.inverseText]}>Farma<Text style={styles.accent}>Busca</Text></Text>}
  </View>;
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  mark: { width: 58, height: 58, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  compact: { width: 40, height: 40, borderRadius: radius.md },
  inverseMark: { backgroundColor: colors.surface },
  name: { marginLeft: 12, color: colors.text, fontSize: 25, fontWeight: '800' },
  inverseText: { color: colors.surface }, accent: { color: colors.primary },
});
