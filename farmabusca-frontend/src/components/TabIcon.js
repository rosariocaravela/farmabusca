import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
export default function TabIcon({ name, focused, color }) { return <View style={[styles.wrap, focused && styles.active]}><Ionicons name={name} size={21} color={focused ? colors.primaryDark : color}/></View>; }
const styles=StyleSheet.create({wrap:{width:42,height:30,borderRadius:11,alignItems:'center',justifyContent:'center'},active:{backgroundColor:colors.primaryLight}});
