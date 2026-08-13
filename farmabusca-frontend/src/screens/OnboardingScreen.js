import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CustomButton from '../components/CustomButton';
import BrandMark from '../components/BrandMark';
import { colors, spacing, radius, typography } from '../theme';
const slides=[
 {icon:'search',title:'Encontre com rapidez',description:'Pesquise medicamentos e consulte a disponibilidade antes de sair de casa.'},
 {icon:'location',title:'Farmácias perto de si',description:'Compare opções, contactos e localização de farmácias em Moçambique.'},
 {icon:'shield-checkmark',title:'Informação de confiança',description:'Consulte dados atualizados pelas farmácias numa experiência simples e segura.'},
];
export default function OnboardingScreen({navigation}){const[index,setIndex]=useState(0);const slide=slides[index];const next=()=>index<2?setIndex(index+1):navigation.replace('Login');return <SafeAreaView style={styles.safe}><View style={styles.top}><BrandMark compact/><TouchableOpacity onPress={()=>navigation.replace('Login')}><Text style={styles.skip}>Saltar</Text></TouchableOpacity></View><View style={styles.content}><View style={styles.visual}><Ionicons name={slide.icon} size={64} color={colors.primary}/></View><View style={styles.dots}>{slides.map((_,i)=><View key={i} style={[styles.dot,i===index&&styles.activeDot]}/>)}</View><Text style={styles.title}>{slide.title}</Text><Text style={styles.description}>{slide.description}</Text></View><View><CustomButton title={index===2?'Começar agora':'Continuar'} onPress={next}/><Text style={styles.note}>Consulte um profissional de saúde antes de utilizar qualquer medicamento.</Text></View></SafeAreaView>}
const styles=StyleSheet.create({safe:{flex:1,backgroundColor:colors.background,paddingHorizontal:spacing.xxl,paddingBottom:spacing.xl},top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingTop:spacing.md},skip:{color:colors.primaryDark,fontWeight:'700'},content:{flex:1,justifyContent:'center'},visual:{height:220,borderRadius:radius.xl,backgroundColor:colors.primaryLight,alignItems:'center',justifyContent:'center'},dots:{flexDirection:'row',marginTop:24,gap:7},dot:{width:8,height:8,borderRadius:4,backgroundColor:colors.border},activeDot:{width:28,backgroundColor:colors.primary},title:{...typography.display,color:colors.text,marginTop:20},description:{...typography.body,color:colors.textSecondary,marginTop:10},note:{...typography.caption,color:colors.textSecondary,textAlign:'center',marginTop:14}});
