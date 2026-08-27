import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { addPharmacyFavorite, askAssistant } from '../../services/api';
import { colors, radius, shadows, spacing, typography } from '../../theme';

const welcome = { id: 'welcome', from: 'assistant', text: 'Olá! Sou o Assistente Farmabusca. Diga o medicamento que procura ou peça uma farmácia próxima.' };

export default function AssistantScreen({ navigation, route }) {
  const medicineName = route.params?.medicineName;
  const [messages, setMessages] = useState([welcome, ...(medicineName ? [{ id: 'context', from: 'assistant', text: `Posso ajudar a localizar ${medicineName} e comparar as opções reais cadastradas.` }] : [])]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null);
  const [locationAction, setLocationAction] = useState(null);
  const listRef = useRef(null);
  const suggestions = medicineName
    ? [`Encontrar ${medicineName}`, `Comparar preços de ${medicineName}`, 'Farmácia mais próxima', 'Pesquisar por bairro']
    : ['Encontrar medicamento perto', 'Farmácia mais próxima', 'Comparar preços', 'Pesquisar por bairro'];

  useEffect(() => { const timer = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60); return () => clearTimeout(timer); }, [messages, loading]);

  const appendResponse = (data) => {
    setMessages((current) => [...current, { id: `assistant-${Date.now()}`, from: 'assistant', text: data.answer, results: data.results || [] }]);
    setLocationAction(data.action === 'REQUEST_LOCATION' || data.action === 'REQUEST_TEXT_LOCATION' ? data.action : null);
    if (data.intent) setPending((current) => ({ ...(current || {}), context: data.intent }));
  };

  const send = async (value = question, extra = {}, showUser = true) => {
    const text = String(value || '').trim();
    if (!text || loading) return;
    setQuestion(''); setError(''); setLocationAction(null);
    if (showUser) setMessages((current) => [...current, { id: `user-${Date.now()}`, from: 'user', text }]);
    const request = { message: text, context: pending?.context || null, ...extra };
    setPending(request); setLoading(true);
    try { const response = await askAssistant(request); appendResponse(response.data); }
    catch (requestError) {
      const message = requestError.response?.data?.data?.answer || requestError.response?.data?.message || 'Não foi possível contactar o assistente. Pode continuar na pesquisa normal.';
      setError(message);
    } finally { setLoading(false); }
  };

  const allowLocation = async () => {
    if (!pending) return;
    setLoading(true); setError('A obter a sua localização...');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') { setError('Permissão recusada. Indique um bairro ou continue pela pesquisa normal.'); setLocationAction('REQUEST_LOCATION'); return; }
      if (!await Location.hasServicesEnabledAsync()) { setError('O GPS está desactivado. Active-o ou indique um bairro.'); setLocationAction('REQUEST_LOCATION'); return; }
      const position = await Promise.race([Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }), new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000))]);
      setError('');
      setLoading(false);
      await send(pending.message, { context: pending.context, location: { latitude: position.coords.latitude, longitude: position.coords.longitude } }, false);
    } catch (locationError) { setError(locationError.message === 'timeout' ? 'O GPS demorou demasiado. Tente novamente ou indique um bairro.' : 'Não foi possível obter a localização. Indique um bairro.'); setLocationAction('REQUEST_LOCATION'); }
    finally { setLoading(false); }
  };

  const openMap = (pharmacy) => pharmacy.latitude != null && pharmacy.longitude != null
    ? Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${pharmacy.latitude},${pharmacy.longitude}`)
    : Alert.alert('Mapa indisponível', 'Esta farmácia não possui coordenadas registadas.');
  const favorite = async (pharmacy) => { try { await addPharmacyFavorite(pharmacy.id); Alert.alert('Favoritos', 'Farmácia guardada nos favoritos.'); } catch (requestError) { Alert.alert('Favoritos', requestError.response?.data?.message || 'Não foi possível guardar a farmácia.'); } };

  const resultCard = (result, index) => <View key={`${result.pharmacy.id}-${result.medicine?.id || index}`} style={styles.resultCard}>
    <Text style={styles.resultName}>{result.pharmacy.name}</Text>
    {result.medicine ? <Text style={styles.resultMeta}>{result.medicine.name} · {Number(result.medicine.price).toLocaleString('pt-MZ')} MT</Text> : null}
    {result.distanceMeters != null ? <Text style={styles.distance}>{result.distanceMeters < 1000 ? `${result.distanceMeters} m` : `${Number(result.distanceKm).toLocaleString('pt-MZ')} km`}</Text> : null}
    <Text style={styles.resultMeta}>{[result.pharmacy.neighborhood, result.pharmacy.address].filter(Boolean).join(' · ')}</Text>
    <View style={styles.cardActions}><TouchableOpacity onPress={() => navigation.navigate(result.medicine ? 'MedicineDetails' : 'PharmacyMedicines', { item: result.medicine ? { ...result.medicine, Pharmacy: result.pharmacy } : undefined, pharmacy: result.pharmacy })}><Text style={styles.actionText}>Ver detalhes</Text></TouchableOpacity><TouchableOpacity onPress={() => openMap(result.pharmacy)}><Text style={styles.actionText}>Como chegar</Text></TouchableOpacity><TouchableOpacity onPress={() => favorite(result.pharmacy)}><Text style={styles.actionText}>Guardar</Text></TouchableOpacity></View>
  </View>;

  return <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={styles.header}><View style={styles.avatar}><Ionicons name="sparkles-outline" size={22} color={colors.surface} /></View><View style={styles.headerCopy}><Text style={styles.title}>Assistente Farmabusca</Text><Text style={styles.subtitle}>Pesquisa inteligente na base do FarmaBusca</Text></View></View>
    <FlatList ref={listRef} data={messages} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} renderItem={({ item }) => <View style={[styles.messageRow, item.from === 'user' && styles.userRow]}><View style={[styles.bubble, item.from === 'user' ? styles.userBubble : styles.assistantBubble]}><Text style={[styles.messageText, item.from === 'user' && styles.userText]}>{item.text}</Text>{item.results?.map(resultCard)}</View></View>} ListFooterComponent={loading ? <Text style={styles.typing}>A processar o pedido...</Text> : null} />
    {locationAction ? <View style={styles.locationBox}><Text style={styles.locationTitle}>Como deseja pesquisar?</Text><View style={styles.locationButtons}><TouchableOpacity style={styles.primarySmall} onPress={allowLocation} disabled={loading}><Text style={styles.primarySmallText}>Permitir localização</Text></TouchableOpacity><TouchableOpacity style={styles.secondarySmall} onPress={() => { setLocationAction(null); setQuestion('Procure no bairro ou cidade de '); }}><Text style={styles.secondarySmallText}>Indicar bairro ou cidade</Text></TouchableOpacity><TouchableOpacity style={styles.secondarySmall} onPress={() => { setLocationAction(null); setPending(null); }}><Text style={styles.secondarySmallText}>Agora não</Text></TouchableOpacity></View></View> : null}
    <View style={styles.suggestions}>{suggestions.map((item) => <TouchableOpacity key={item} style={styles.suggestion} onPress={() => item === 'Pesquisar por bairro' ? setQuestion('Procure no bairro ou cidade de ') : send(item)} disabled={loading}><Text style={styles.suggestionText}>{item}</Text></TouchableOpacity>)}</View>
    {error ? <View style={styles.errorRow}><Text style={styles.error}>{error}</Text><TouchableOpacity onPress={() => pending && send(pending.message, { context: pending.context, location: pending.location }, false)}><Text style={styles.retry}>Tentar novamente</Text></TouchableOpacity><TouchableOpacity onPress={() => navigation.navigate('Pesquisar')}><Text style={styles.retry}>Pesquisa normal</Text></TouchableOpacity></View> : null}
    <View style={styles.composer}><TextInput value={question} onChangeText={setQuestion} placeholder="Escreva a sua mensagem..." placeholderTextColor={colors.textSecondary} style={styles.input} multiline maxLength={500} editable={!loading} /><TouchableOpacity style={[styles.send, (!question.trim() || loading) && styles.sendDisabled]} onPress={() => send()} disabled={!question.trim() || loading}><Ionicons name="arrow-forward" size={21} color={colors.surface} /></TouchableOpacity></View>
    <Text style={styles.disclaimer}>O assistente ajuda a localizar medicamentos e farmácias. Não substitui a orientação de um médico ou farmacêutico.</Text>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }, avatar: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, headerCopy: { marginLeft: spacing.md, flex: 1 }, title: { ...typography.heading, color: colors.text }, subtitle: { ...typography.caption, color: colors.textSecondary }, list: { padding: spacing.xl, paddingBottom: spacing.md, flexGrow: 1 }, messageRow: { alignItems: 'flex-start', marginBottom: spacing.md }, userRow: { alignItems: 'flex-end' }, bubble: { maxWidth: '94%', padding: spacing.md, borderRadius: radius.lg }, assistantBubble: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, ...shadows.card }, userBubble: { backgroundColor: colors.primary }, messageText: { ...typography.body, color: colors.text }, userText: { color: colors.surface }, typing: { color: colors.textSecondary, paddingHorizontal: spacing.xl }, resultCard: { marginTop: 12, padding: 12, backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border }, resultName: { ...typography.heading, color: colors.text }, resultMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 4 }, distance: { color: colors.primaryDark, fontWeight: '800', marginTop: 5 }, cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 10 }, actionText: { color: colors.primaryDark, fontWeight: '800', fontSize: 12 }, locationBox: { marginHorizontal: spacing.xl, marginBottom: 10, padding: 12, borderRadius: radius.md, backgroundColor: colors.primaryLight }, locationTitle: { fontWeight: '800', color: colors.text, marginBottom: 9 }, locationButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, primarySmall: { backgroundColor: colors.primary, padding: 9, borderRadius: radius.md }, primarySmallText: { color: colors.surface, fontWeight: '800', fontSize: 12 }, secondarySmall: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: 9, borderRadius: radius.md }, secondarySmallText: { color: colors.primaryDark, fontWeight: '800', fontSize: 12 }, suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.xl, paddingBottom: spacing.sm }, suggestion: { backgroundColor: colors.primaryLight, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }, suggestionText: { fontSize: 12, fontWeight: '700', color: colors.primaryDark }, errorRow: { paddingHorizontal: spacing.xl, paddingBottom: 8 }, error: { color: colors.error }, retry: { color: colors.primaryDark, fontWeight: '800', marginTop: 5 }, composer: { flexDirection: 'row', alignItems: 'flex-end', marginHorizontal: spacing.xl, padding: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border }, input: { flex: 1, minHeight: 42, maxHeight: 100, paddingHorizontal: spacing.sm, paddingTop: spacing.sm, color: colors.text, fontSize: 15 }, send: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }, sendDisabled: { backgroundColor: colors.disabled }, disclaimer: { textAlign: 'center', color: colors.textSecondary, fontSize: 11, padding: spacing.md },
});
