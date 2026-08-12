import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Header({ title, subtitle, onBack, onMenu, right }) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.left}> 
          {onMenu ? (
            <TouchableOpacity onPress={onMenu} style={styles.menuButton}>
              <Ionicons name="menu" size={20} color="#2F9E5D" />
            </TouchableOpacity>
          ) : null}
          {onBack ? (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color="#2F9E5D" />
            </TouchableOpacity>
          ) : null}
          <View style={styles.textGroup}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>
        {right ? <View>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#F5FAF7',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EAF8EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EAF8EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textGroup: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800', color: '#233447' },
  subtitle: { color: '#6F7882', marginTop: 4, fontSize: 13 },
});
