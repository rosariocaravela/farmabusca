import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import BrandMark from '../components/BrandMark';
import { colors, typography } from '../theme';

export default function SplashScreen() {
  const navigation = useNavigation(); const opacity = useRef(new Animated.Value(0)).current; const scale = useRef(new Animated.Value(.9)).current;
  useEffect(() => { Animated.parallel([Animated.timing(opacity,{toValue:1,duration:600,useNativeDriver:true}),Animated.spring(scale,{toValue:1,useNativeDriver:true})]).start(); const timer=setTimeout(()=>navigation.replace('Onboarding'),1600); return()=>clearTimeout(timer); }, [navigation, opacity, scale]);
  return <View style={styles.container}><Animated.View style={{ alignItems:'center', opacity, transform:[{scale}] }}><BrandMark inverse /></Animated.View><Text style={styles.footer}>Saúde • confiança • proximidade</Text></View>;
}
const styles=StyleSheet.create({container:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:colors.primaryDark},subtitle:{...typography.body,color:'#DCFCE7',marginTop:16},footer:{position:'absolute',bottom:48,color:'#BBF7D0',fontSize:13}});
