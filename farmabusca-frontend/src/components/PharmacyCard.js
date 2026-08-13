import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, typography } from '../theme';

export default function PharmacyCard({ item, onPress }) {
  const location = item.address || item.location || [item.city, item.province].filter(Boolean).join(', ') || 'Localização não informada';
  const approved = item.approved !== false;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82} accessibilityRole="button" accessibilityLabel={`${item.name}, ${location}`}>
      <View style={styles.row}>
        {item.image || item.imageUrl ? <Image source={{ uri: item.image || item.imageUrl }} style={styles.image} /> : <View style={styles.imageEmpty}><Ionicons name="storefront-outline" size={25} color={colors.primary} /></View>}
        <View style={styles.body}>
          <View style={styles.titleRow}><Text style={styles.title} numberOfLines={1}>{item.name || 'Farmácia'}</Text><View style={[styles.badge, !approved && styles.pending]}><Ionicons name={approved ? 'shield-checkmark' : 'time-outline'} size={12} color={approved ? colors.primaryDark : '#92400E'} /><Text style={[styles.badgeText, !approved && styles.pendingText]}>{approved ? 'Verificada' : 'Em análise'}</Text></View></View>
          <View style={styles.info}><Ionicons name="location-outline" size={15} color={colors.textSecondary} /><Text style={styles.infoText} numberOfLines={1}>{location}</Text></View>
          {item.openingHours ? <View style={styles.info}><Ionicons name="time-outline" size={15} color={colors.textSecondary} /><Text style={styles.infoText}>{item.openingHours}</Text></View> : null}
          {item.phone ? <View style={styles.info}><Ionicons name="call-outline" size={15} color={colors.textSecondary} /><Text style={styles.infoText}>{item.phone}</Text></View> : null}
        </View>
      </View>
      <View style={styles.footer}><Text style={styles.action}>Ver detalhes</Text><Ionicons name="arrow-forward" size={16} color={colors.primary} /></View>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({card:{backgroundColor:colors.surface,borderRadius:radius.lg,padding:14,marginBottom:12,borderWidth:1,borderColor:colors.border,...shadows.card},row:{flexDirection:'row'},image:{width:66,height:66,borderRadius:radius.md,backgroundColor:colors.background},imageEmpty:{width:66,height:66,borderRadius:radius.md,backgroundColor:colors.primaryLight,alignItems:'center',justifyContent:'center'},body:{flex:1,marginLeft:12},titleRow:{flexDirection:'row',alignItems:'center',gap:6},title:{...typography.heading,color:colors.text,flex:1},badge:{flexDirection:'row',alignItems:'center',gap:3,backgroundColor:colors.successLight,borderRadius:radius.pill,paddingHorizontal:7,paddingVertical:4},pending:{backgroundColor:colors.warningLight},badgeText:{fontSize:9,fontWeight:'800',color:colors.primaryDark},pendingText:{color:'#92400E'},info:{flexDirection:'row',alignItems:'center',gap:5,marginTop:5},infoText:{...typography.caption,color:colors.textSecondary,flexShrink:1},footer:{borderTopWidth:1,borderTopColor:colors.border,marginTop:12,paddingTop:10,flexDirection:'row',justifyContent:'flex-end',alignItems:'center',gap:5},action:{color:colors.primary,fontWeight:'700',fontSize:13}});
