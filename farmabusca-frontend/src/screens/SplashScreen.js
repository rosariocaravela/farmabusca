import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function SplashScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => navigation.replace('Onboarding'), 1800);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.logoBox}>
        <Text style={styles.logo}>💊</Text>
      </View>
      <Text style={styles.title}>FarmaBusca</Text>
      <Text style={styles.subtitle}>Encontre medicamentos perto de si</Text>
      <Text style={styles.loading}>A carregar...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1976D2' },
  logoBox: { width: 100, height: 100, borderRadius: 24, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  logo: { fontSize: 48 },
  title: { fontSize: 32, color: '#FFF', fontWeight: '800' },
  subtitle: { fontSize: 16, color: '#EAF2FF', marginTop: 8 },
  loading: { marginTop: 20, color: '#FFF', opacity: 0.9 },
});
