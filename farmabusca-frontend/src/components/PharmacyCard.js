import React, { useState } from 'react';
import { Image, Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, typography } from '../theme';
import ResilientImage from './ResilientImage';

const pharmacyPlaceholder = require('../../assets/images/interface/pharmacy-hero.png');

export default function PharmacyCard({ item, onPress, onViewMedicines }) {
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const location = item.address || item.location || [item.city, item.province].filter(Boolean).join(', ') || 'Localização não informada';
  const approved = item.approved !== false;
  const imageSource = item.image || item.imageUrl;
  return (
    <>
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82} accessibilityRole="button" accessibilityLabel={`${item.name}, ${location}`}>
      <View style={styles.row}><TouchableOpacity style={styles.imageButton} onPress={(event) => { event.stopPropagation?.(); setImagePreviewVisible(true); }} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={`Ver imagem de ${item.name || 'farmácia'}`}><ResilientImage uri={imageSource} fallback={pharmacyPlaceholder} style={styles.image} /></TouchableOpacity><View style={styles.content}><View style={styles.titleRow}><Text style={styles.title} numberOfLines={1}>{item.name || 'Farmácia'}</Text><View style={[styles.badge, !approved && styles.pending]}><Ionicons name={approved ? 'shield-checkmark' : 'time-outline'} size={12} color={approved ? colors.primaryDark : '#92400E'} /><Text style={[styles.badgeText, !approved && styles.pendingText]}>{approved ? 'Verificada' : 'Em análise'}</Text></View></View>{item.rating || item.averageRating ? <Text style={styles.rating}>★ {item.rating || item.averageRating}</Text> : null}
        <View style={styles.info}><Ionicons name="location-outline" size={18} color={colors.textSecondary} /><Text style={styles.infoText} numberOfLines={1}>{location}</Text></View>
        {item.openingHours ? <View style={styles.info}><Ionicons name="time-outline" size={18} color={colors.textSecondary} /><Text style={styles.infoText}>{item.openingHours}</Text></View> : null}
      </View></View>
      <View style={styles.footer}><Text style={styles.distance}>{item.distance ? `${item.distance} de si` : 'Consulte a localização'}</Text>{onViewMedicines ? <TouchableOpacity style={styles.actionRow} onPress={(event) => { event.stopPropagation?.(); onViewMedicines(); }}><Text style={styles.action}>Ver medicamentos</Text><Ionicons name="arrow-forward" size={18} color={colors.primary} /></TouchableOpacity> : null}</View>
      </TouchableOpacity>
      <Modal visible={imagePreviewVisible} transparent animationType="fade" onRequestClose={() => setImagePreviewVisible(false)}>
        <TouchableOpacity style={styles.previewBackdrop} activeOpacity={1} onPress={() => setImagePreviewVisible(false)}>
          <Image source={imageSource ? { uri: imageSource } : pharmacyPlaceholder} style={styles.previewImage} resizeMode="contain" />
          <Text style={styles.previewHint}>Toque para fechar</Text>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
const styles = StyleSheet.create({card:{backgroundColor:colors.surface,borderRadius:radius.lg,padding:12,marginBottom:12,borderWidth:1,borderColor:colors.border,...shadows.card},row:{flexDirection:'row',minWidth:0},imageButton:{width:72,height:72},image:{width:72,height:72,borderRadius:radius.md,backgroundColor:colors.primaryLight},content:{flex:1,minWidth:0,marginLeft:12},titleRow:{flexDirection:'row',alignItems:'center',gap:6},title:{...typography.heading,fontSize:18,color:colors.text,flex:1},badge:{flexDirection:'row',alignItems:'center',gap:3,backgroundColor:colors.successLight,borderRadius:radius.pill,paddingHorizontal:7,paddingVertical:4},pending:{backgroundColor:colors.warningLight},badgeText:{fontSize:9,fontWeight:'800',color:colors.primaryDark},pendingText:{color:'#92400E'},rating:{color:'#B7791F',fontSize:13,fontWeight:'700',marginTop:3},info:{flexDirection:'row',alignItems:'center',gap:6,marginTop:6},infoText:{...typography.caption,color:colors.textSecondary,flexShrink:1},footer:{borderTopWidth:1,borderTopColor:colors.border,marginTop:10,paddingTop:9,flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:8},distance:{...typography.caption,color:colors.textSecondary},actionRow:{flexDirection:'row',alignItems:'center',gap:5},action:{color:colors.primary,fontWeight:'800',fontSize:13},previewBackdrop:{flex:1,backgroundColor:'rgba(15,23,42,0.9)',justifyContent:'center',alignItems:'center',padding:24},previewImage:{width:'100%',height:'72%'},previewHint:{color:colors.surface,fontSize:14,marginTop:16}});
