import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import TabIcon from '../components/TabIcon';
import PharmacyDashboardScreen from '../screens/pharmacy/PharmacyDashboardScreen';
import MedicinesScreen from '../screens/pharmacy/MedicinesScreen';
import AddMedicineScreen from '../screens/pharmacy/AddMedicineScreen';
import ProfileScreen from '../screens/patient/ProfileScreen';
import EditMedicineScreen from '../screens/pharmacy/EditMedicineScreen';
import PharmacyProfileSetup from '../screens/pharmacy/PharmacyProfileSetup';
import PharmacyProfileDocs from '../screens/pharmacy/PharmacyProfileDocs';
import { colors } from '../theme';

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
          return <TabIcon name={iconName} focused={focused} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 1 },
        tabBarStyle: { height: 72, paddingBottom: 8, paddingTop: 7, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
      })}
    >
      <Tab.Screen name="Dashboard" component={PharmacyDashboardScreen} options={{ title: 'Painel' }} />
      <Tab.Screen name="Medicamentos" component={MedicinesScreen} />
      <Tab.Screen name="Adicionar" component={AddMedicineScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function PharmacyNavigator() {
  return (
    <Stack.Navigator initialRouteName="PharmacyTabs" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PharmacyTabs" component={PharmacyTabs} />
      <Stack.Screen name="PharmacyProfileSetup" component={PharmacyProfileSetup} />
      <Stack.Screen name="PharmacyProfileDocs" component={PharmacyProfileDocs} />
      <Stack.Screen name="EditMedicine" component={EditMedicineScreen} />
    </Stack.Navigator>
  );
}
