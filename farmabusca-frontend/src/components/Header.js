import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, typography } from '../theme';

export default function Header({ title, subtitle, onBack, onMenu, right }) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.left}> 
          {onMenu ? (
            <TouchableOpacity onPress={onMenu} style={styles.menuButton}>
              <Ionicons name="menu" size={20} color={colors.primaryDark} />
            </TouchableOpacity>
          ) : null}
          {onBack ? (
            <TouchableOpacity onPress={onBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color={colors.primaryDark} />
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
    backgroundColor: colors.background,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textGroup: { flex: 1 },
  title: { ...typography.heading, fontSize: 20, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
});
