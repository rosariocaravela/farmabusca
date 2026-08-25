import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../../components/Header';
import { colors, radius, spacing, typography } from '../../theme';
import { initiatePlanPayment } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import CustomButton from '../../components/CustomButton';

const plans = [
  {
    id: 'free',
    name: 'Grátis',
    price: '0 MT',
    period: 'para sempre',
    description: 'O essencial para começar a encontrar cuidados perto de si.',
    features: ['Pesquisar medicamentos', 'Encontrar farmácias', 'Guardar favoritos'],
    icon: 'leaf-outline',
  },
  {
    id: 'essential',
    name: 'Essencial',
    price: '99 MT',
    period: 'por mês',
    description: 'Mais comodidade para acompanhar as suas necessidades.',
    features: ['Tudo do plano Grátis', 'Alertas de disponibilidade', 'Histórico de pesquisas'],
    icon: 'flash-outline',
    featured: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '199 MT',
    period: 'por mês',
    description: 'A experiência completa para cuidar de toda a família.',
    features: ['Tudo do plano Essencial', 'Assistente IA prioritário', 'Suporte personalizado'],
    icon: 'star-outline',
  },
];

export default function PlansScreen({ navigation }) {
  const { user, updateSessionUser } = useAuth();
  const [selected, setSelected] = useState('free');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState(null);

  const choosePlan = (plan) => {
    setSelected(plan.id);
  };

  const payForPlan = async () => {
    if (selected === 'free') {
      Alert.alert('Plano gratuito', 'O plano Grátis já está disponível para a sua conta.');
      return;
    }
    setLoading(true);
    try {
      const requestId = `PLAN-${selected}-${Date.now()}`;
      const response = await initiatePlanPayment(selected, phone.trim(), requestId);
      setPayment(response.data || null);
      if (response.data?.status === 'PAID') {
        await updateSessionUser({ ...user, subscriptionPlan: selected, subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() });
      }
      Alert.alert(response.data?.status === 'PAID' ? 'Plano ativado' : 'Pedido pendente', response.message || 'Confirme o pagamento no seu telemóvel M-Pesa.');
    } catch (error) {
      Alert.alert('Pagamento não iniciado', error.response?.data?.message || 'Verifique o número M-Pesa e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    <Header title="Planos" subtitle="Escolha a experiência ideal para si" onBack={() => navigation.goBack()} />
    <View style={styles.intro}>
      <Text style={styles.title}>Cuide melhor da sua saúde</Text>
      <Text style={styles.subtitle}>Comece com acesso gratuito e mude de plano quando precisar.</Text>
    </View>
    {plans.map((plan) => <TouchableOpacity key={plan.id} style={[styles.plan, plan.featured && styles.featuredPlan, selected === plan.id && styles.selectedPlan]} onPress={() => choosePlan(plan)} activeOpacity={0.88} accessibilityRole="radio" accessibilityState={{ selected: selected === plan.id }}>
      {plan.featured ? <View style={styles.featuredLabel}><Text style={styles.featuredText}>MAIS ESCOLHIDO</Text></View> : null}
      <View style={styles.planHeader}><View style={[styles.planIcon, plan.featured && styles.featuredIcon]}><Ionicons name={plan.icon} size={22} color={plan.featured ? colors.surface : colors.primaryDark} /></View><View style={styles.planNameWrap}><Text style={styles.planName}>{plan.name}</Text><Text style={styles.planDescription}>{plan.description}</Text></View>{selected === plan.id ? <Ionicons name="checkmark-circle" size={23} color={colors.primary} /> : null}</View>
      <View style={styles.priceRow}><Text style={styles.price}>{plan.price}</Text><Text style={styles.period}>{plan.period}</Text></View>
      <View style={styles.featureList}>{plan.features.map((feature) => <View key={feature} style={styles.feature}><Ionicons name="checkmark" size={16} color={colors.primary} /><Text style={styles.featureText}>{feature}</Text></View>)}</View>
      <View style={[styles.chooseButton, plan.featured && styles.featuredButton]}><Text style={[styles.chooseText, plan.featured && styles.featuredButtonText]}>{selected === plan.id ? 'Selecionado' : 'Escolher plano'}</Text></View>
    </TouchableOpacity>)}
    {selected !== 'free' ? <View style={styles.paymentBox}>
      <Text style={styles.paymentTitle}>Ativar plano {plans.find((plan) => plan.id === selected)?.name}</Text>
      <Text style={styles.paymentText}>Introduza o seu número M-Pesa. O pedido será protegido pela sua sessão autenticada.</Text>
      <TextInput style={styles.phoneInput} value={phone} onChangeText={setPhone} placeholder="84 123 4567" keyboardType="phone-pad" maxLength={16} editable={!loading} accessibilityLabel="Número M-Pesa" />
      <CustomButton title={loading ? 'A processar...' : 'Continuar com M-Pesa'} icon="card-outline" loading={loading} onPress={payForPlan} />
      {payment ? <View style={styles.paymentStatus}><Ionicons name="time-outline" size={20} color={colors.primaryDark} /><View style={styles.statusCopy}><Text style={styles.statusTitle}>{payment.status === 'PAID' ? 'Pagamento confirmado' : 'Aguardando confirmação'}</Text><Text style={styles.statusText}>Referência: {payment.reference}</Text><Text style={styles.statusText}>Confirme o pedido no canal oficial do M-Pesa. O FarmaBusca não solicita o seu PIN.</Text></View></View> : null}
    </View> : null}
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 36 },
  intro: { paddingHorizontal: spacing.xl, paddingBottom: spacing.lg },
  title: { ...typography.title, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 5 },
  plan: { marginHorizontal: spacing.xl, marginBottom: spacing.lg, padding: spacing.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg },
  selectedPlan: { borderColor: colors.primary, borderWidth: 2 },
  featuredPlan: { borderColor: colors.primary, backgroundColor: '#F7FFF9' },
  featuredLabel: { alignSelf: 'flex-start', marginBottom: 12, paddingHorizontal: 9, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.primary },
  featuredText: { color: colors.surface, fontSize: 10, fontWeight: '900' },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  planIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  featuredIcon: { backgroundColor: colors.primary },
  planNameWrap: { flex: 1 },
  planName: { ...typography.heading, color: colors.text },
  planDescription: { ...typography.caption, color: colors.textSecondary, marginTop: 3 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 18 },
  price: { fontSize: 26, fontWeight: '900', color: colors.primaryDark },
  period: { color: colors.textSecondary, fontSize: 13 },
  featureList: { gap: 9, marginTop: 16 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { color: colors.text, fontSize: 13 },
  chooseButton: { alignItems: 'center', marginTop: 18, paddingVertical: 11, borderRadius: radius.md, backgroundColor: colors.primaryLight },
  featuredButton: { backgroundColor: colors.primary },
  chooseText: { color: colors.primaryDark, fontWeight: '800' },
  featuredButtonText: { color: colors.surface },
  paymentBox: { marginHorizontal: spacing.xl, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  paymentTitle: { ...typography.heading, color: colors.text },
  paymentText: { ...typography.caption, color: colors.textSecondary, marginTop: 5 },
  phoneInput: { marginTop: 14, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, backgroundColor: colors.background },
  paymentStatus: { flexDirection: 'row', gap: 10, marginTop: 16, padding: 12, borderRadius: radius.md, backgroundColor: colors.primaryLight },
  statusCopy: { flex: 1 },
  statusTitle: { color: colors.primaryDark, fontWeight: '800' },
  statusText: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 3 },
});
