import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { askAssistant } from '../../services/api';
import { colors, radius, shadows, spacing, typography } from '../../theme';

const suggestions = ['Para que serve este medicamento?', 'Onde encontro paracetamol?', 'Farmácias abertas agora'];
const initialMessage = { id: 'welcome', from: 'assistant', text: 'Olá! Sou a assistente Farmabusca. Diga o nome de um medicamento ou pergunte quais farmácias estão abertas perto de si.' };

export default function AssistantScreen({ route }) {
  const medicineId = route.params?.medicineId;
  const medicineName = route.params?.medicineName;
  const [messages, setMessages] = useState([initialMessage, ...(medicineName ? [{ id: 'medicine-context', from: 'assistant', text: `Estou pronto para responder sobre ${medicineName}. Pode perguntar sobre disponibilidade, preço ou informação geral.` }] : [])]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(timer);
  }, [messages, loading]);

  const submit = async (value = question) => {
    const text = value.trim();
    if (!text || loading) return;
    setQuestion('');
    setError('');
    setMessages((current) => [...current, { id: `user-${Date.now()}`, from: 'user', text }]);
    setLoading(true);
    try {
      const response = await askAssistant(text, medicineId);
      setMessages((current) => [...current, { id: `assistant-${Date.now()}`, from: 'assistant', text: response.data?.answer || 'Não consegui responder agora.' }]);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível contactar a assistente.');
    } finally {
      setLoading(false);
    }
  };

  return <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={styles.header}>
      <View style={styles.avatar}><Ionicons name="sparkles-outline" size={22} color={colors.surface} /></View>
      <View style={styles.headerCopy}><Text style={styles.title}>Assistente IA</Text><View style={styles.status}><View style={styles.statusDot} /><Text style={styles.subtitle}>Online para ajudar</Text></View></View>
    </View>
    <FlatList
      ref={listRef}
      data={messages}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      renderItem={({ item }) => <View style={[styles.messageRow, item.from === 'user' && styles.userRow]}><View style={[styles.bubble, item.from === 'user' ? styles.userBubble : styles.assistantBubble]}><Text style={[styles.messageText, item.from === 'user' && styles.userText]}>{item.text}</Text></View></View>}
      ListFooterComponent={loading ? <View style={styles.typing}><Text style={styles.typingText}>A assistente está a responder...</Text></View> : null}
    />
    <View style={styles.suggestions}>{suggestions.map((item) => <TouchableOpacity key={item} style={styles.suggestion} onPress={() => submit(item)} disabled={loading}><Text style={styles.suggestionText}>{item}</Text></TouchableOpacity>)}</View>
    {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
    <View style={styles.composer}><TextInput ref={inputRef} value={question} onChangeText={setQuestion} placeholder="Escreva a sua pergunta..." placeholderTextColor={colors.textSecondary} style={styles.input} multiline maxLength={500} editable={!loading} onSubmitEditing={() => submit()} /><TouchableOpacity style={[styles.send, (!question.trim() || loading) && styles.sendDisabled]} onPress={() => submit()} disabled={!question.trim() || loading} accessibilityLabel="Enviar pergunta"><Ionicons name="arrow-forward" size={21} color={colors.surface} /></TouchableOpacity></View>
    <Text style={styles.disclaimer}><Ionicons name="shield-checkmark-outline" size={14} color={colors.textSecondary} /> A assistente não substitui aconselhamento médico ou farmacêutico.</Text>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { marginLeft: spacing.md, flex: 1 },
  title: { ...typography.heading, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textSecondary },
  status: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  list: { padding: spacing.xl, paddingBottom: spacing.md, flexGrow: 1, justifyContent: 'flex-end' },
  messageRow: { alignItems: 'flex-start', marginBottom: spacing.md },
  userRow: { alignItems: 'flex-end' },
  bubble: { maxWidth: '86%', padding: spacing.md, borderRadius: radius.lg },
  assistantBubble: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  userBubble: { backgroundColor: colors.primary, borderBottomRightRadius: radius.sm },
  messageText: { ...typography.body, color: colors.text },
  userText: { color: colors.surface },
  typing: { paddingVertical: spacing.sm },
  typingText: { ...typography.caption, color: colors.textSecondary },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  suggestion: { backgroundColor: colors.primaryLight, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  suggestionText: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
  error: { color: colors.error, paddingHorizontal: spacing.xl, paddingBottom: spacing.sm },
  composer: { flexDirection: 'row', alignItems: 'flex-end', marginHorizontal: spacing.xl, padding: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  input: { flex: 1, minHeight: 42, maxHeight: 100, paddingHorizontal: spacing.sm, paddingTop: spacing.sm, color: colors.text, fontSize: 15 },
  send: { width: 42, height: 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  sendDisabled: { backgroundColor: colors.disabled },
  disclaimer: { textAlign: 'center', color: colors.textSecondary, fontSize: 11, padding: spacing.md },
});
