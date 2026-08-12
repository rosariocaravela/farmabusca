import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import PharmacyDashboardScreen from '../screens/pharmacy/PharmacyDashboardScreen';
import MedicinesScreen from '../screens/pharmacy/MedicinesScreen';
import AddMedicineScreen from '../screens/pharmacy/AddMedicineScreen';
import ProfileScreen from '../screens/patient/ProfileScreen';
import EditMedicineScreen from '../screens/pharmacy/EditMedicineScreen';
import PharmacyProfileSetup from '../screens/pharmacy/PharmacyProfileSetup';
import PharmacyProfileDocs from '../screens/pharmacy/PharmacyProfileDocs';
import { getMyPharmacy } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function PharmacyTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'Medicamentos') iconName = focused ? 'medkit' : 'medkit-outline';
          else if (route.name === 'Adicionar') iconName = focused ? 'add-circle' : 'add-circle-outline';
          else if (route.name === 'Perfil') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#43A047',
        tabBarInactiveTintColor: '#8e8e93',
        tabBarStyle: { height: 64, paddingBottom: 8 },
      })}
    >
      <Tab.Screen name="Dashboard" component={PharmacyDashboardScreen} />
      <Tab.Screen name="Medicamentos" component={MedicinesScreen} />
      <Tab.Screen name="Adicionar" component={AddMedicineScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function EntryScreen({ navigation }) {
  const { user } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await getMyPharmacy();
        if (!mounted) return;
        if (!res) {
          navigation.replace('PharmacyProfileSetup');
        } else {
          navigation.replace('PharmacyTabs');
        }
      } catch (err) {
        if (!mounted) return;
        // if error, assume no profile
        navigation.replace('PharmacyProfileSetup');
      } finally {
        if (mounted) setChecking(false);
      }
    };
    check();
    return () => { mounted = false; };
  }, [navigation, user]);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }
  return null;
}

export default function PharmacyNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Entry" component={EntryScreen} />
      <Stack.Screen name="PharmacyTabs" component={PharmacyTabs} />
      <Stack.Screen name="PharmacyProfileSetup" component={PharmacyProfileSetup} />
      <Stack.Screen name="PharmacyProfileDocs" component={PharmacyProfileDocs} />
      <Stack.Screen name="EditMedicine" component={EditMedicineScreen} />
    </Stack.Navigator>
  );
}
