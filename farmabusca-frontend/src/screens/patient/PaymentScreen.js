import React, { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import CustomButton from '../../components/CustomButton';
import { initiateReservationPayment } from '../../services/api';
import { colors, radius, shadows, spacing, typography } from '../../theme';

export default function PaymentScreen({ route, navigation }) {
  const medicine = route.params?.medicine;
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState(null);
  const requestId = useRef(`MOBILE-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`).current;

  const pay = async () => {
    if (!/^(?:\+?258)?(?:84|85)\d{7}$/.test(phone.replace(/\s/g, ''))) {
      Alert.alert('Número inválido', 'Introduza um número M-Pesa válido: 84 ou 85 seguido de 7 dígitos.');
      return;
    }
    setLoading(true);
    try {
      const response = await initiateReservationPayment(medicine.id, phone, requestId);
      setPayment(response.data);
      Alert.alert('Pedido enviado', 'Confirme no seu telemóvel. Introduza o PIN apenas no pedido oficial do M-Pesa.');
    } catch (error) {
      Alert.alert('Pagamento não iniciado', error.response?.data?.message || 'Verifique a ligação e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Header title="Reservar medicamento" subtitle="Pagamento seguro por M-Pesa" onBack={() => navigation.goBack()} />
        <View style={styles.card}>
          <View style={styles.icon}><Ionicons name="phone-portrait-outline" size={34} color={colors.primary} /></View>
          <Text style={styles.medicine}>{medicine?.name || 'Medicamento'}</Text>
          <Text style={styles.label}>Taxa fixa de reserva</Text>
          <Text style={styles.amount}>25 MT</Text>
          <View style={styles.divider} />
          <Text style={styles.fieldLabel}>Número M-Pesa</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="84 123 4567" keyboardType="phone-pad" maxLength={16} editable={!loading && !payment} accessibilityLabel="Número M-Pesa" />
          <View style={styles.securityBox}>
            <Ionicons name="shield-checkmark-outline" size={22} color={colors.primaryDark} />
            <Text style={styles.securityText}>O FarmaBusca nunca pede nem guarda o seu PIN. Digite-o somente na solicitação oficial do M-Pesa no telemóvel.</Text>
          </View>
          {payment ? (
            <View style={styles.status}>
              <Text style={styles.statusTitle}>Pedido enviado</Text>
              <Text style={styles.statusText}>Referência: {payment.reference}</Text>
              <Text style={styles.statusText}>Estado: {payment.status === 'PAID' ? 'Pago' : 'Aguardando confirmação'}</Text>
            </View>
          ) : <CustomButton title="Pagar 25 MT" icon="lock-closed-outline" onPress={pay} loading={loading} />}
          <CustomButton title={payment ? 'Concluir' : 'Cancelar'} variant="secondary" onPress={() => navigation.goBack()} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background }, content: { paddingBottom: 40 },
  card: { margin: spacing.xl, padding: spacing.xl, backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  icon: { width: 64, height: 64, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', borderRadius: 32, backgroundColor: colors.primaryLight },
  medicine: { ...typography.heading, color: colors.text, textAlign: 'center', marginTop: spacing.md }, label: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
  amount: { fontSize: 34, fontWeight: '800', color: colors.primaryDark, textAlign: 'center', marginTop: 2 }, divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xl },
  fieldLabel: { ...typography.body, color: colors.text, fontWeight: '700', marginBottom: spacing.sm }, input: { minHeight: 54, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.lg, fontSize: 17, color: colors.text, backgroundColor: colors.background },
  securityBox: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.primaryMuted, marginTop: spacing.lg }, securityText: { ...typography.caption, color: colors.primaryDark, flex: 1 },
  status: { padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.successLight, marginTop: spacing.lg }, statusTitle: { ...typography.heading, color: colors.primaryDark }, statusText: { ...typography.caption, color: colors.primaryDark, marginTop: spacing.xs },
});
