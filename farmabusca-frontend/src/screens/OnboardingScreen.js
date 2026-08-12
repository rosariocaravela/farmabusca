import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import CustomButton from '../components/CustomButton';

const slides = [
  { title: 'Encontre medicamentos rapidamente', description: 'Pesquise medicamentos disponíveis nas farmácias próximas.' },
  { title: 'Consulte farmácias', description: 'Veja preços, localização e contactos.' },
  { title: 'Cuide melhor da sua saúde', description: 'Tenha informação antes de sair de casa.' },
];

export default function OnboardingScreen() {
  const navigation = useNavigation();
  const [index, setIndex] = React.useState(0);

  const nextSlide = () => {
    if (index < slides.length - 1) {
      setIndex(index + 1);
    } else {
      navigation.replace('Login');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.step}>{index + 1}/3</Text>
        <Text style={styles.title}>{slides[index].title}</Text>
        <Text style={styles.description}>{slides[index].description}</Text>
        <CustomButton title="Começar" onPress={nextSlide} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F7F9FC' },
  card: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 14, elevation: 4 },
  step: { color: '#1976D2', fontWeight: '700', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#333', marginBottom: 8 },
  description: { fontSize: 16, color: '#666', marginBottom: 18, lineHeight: 24 },
});
