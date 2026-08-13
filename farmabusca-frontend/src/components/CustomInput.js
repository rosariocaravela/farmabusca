import React from 'react';
import { TextInput, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';

export default function CustomInput({ label, placeholder, value, onChangeText, secureTextEntry = false, keyboardType = 'default', error, icon, ...props }) {
  const [hidden, setHidden] = React.useState(secureTextEntry);
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.field, focused && styles.fieldFocused, error && styles.fieldError]}>{icon ? <Ionicons name={icon} size={19} color={focused ? colors.primary : colors.textSecondary} /> : null}<TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={hidden}
        keyboardType={keyboardType}
        style={styles.input} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} autoCapitalize={keyboardType === 'email-address' ? 'none' : undefined} {...props}
      />{secureTextEntry ? <TouchableOpacity onPress={() => setHidden(!hidden)} accessibilityLabel={hidden ? 'Mostrar palavra-passe' : 'Ocultar palavra-passe'}><Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={21} color={colors.textSecondary} /></TouchableOpacity> : null}</View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { marginBottom: 8, color: colors.text, fontWeight: '600' },
  field: { minHeight: 52, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14 },
  fieldFocused: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  fieldError: { borderColor: colors.error }, error: { color: colors.error, fontSize: 12, marginTop: 5 },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.text,
  },
});
