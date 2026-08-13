import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import TabIcon from '../components/TabIcon';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminPharmaciesScreen from '../screens/admin/AdminPharmaciesScreen';
import AdminMedicinesScreen from '../screens/admin/AdminMedicinesScreen';
import AdminMapScreen from '../screens/admin/AdminMapScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Farmácias') iconName = focused ? 'business' : 'business-outline';
          else if (route.name === 'Medicamentos') iconName = focused ? 'medkit' : 'medkit-outline';
          else if (route.name === 'Mapa') iconName = focused ? 'map' : 'map-outline';
          else if (route.name === 'Perfil') iconName = focused ? 'person' : 'person-outline';
          return <TabIcon name={iconName} focused={focused} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 1 },
        tabBarStyle: { height: 72, paddingBottom: 8, paddingTop: 7, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} options={{ title: 'Visão geral' }} />
      <Tab.Screen name="Farmácias" component={AdminPharmaciesScreen} />
      <Tab.Screen name="Medicamentos" component={AdminMedicinesScreen} />
      <Tab.Screen name="Mapa" component={AdminMapScreen} />
      <Tab.Screen name="Perfil" component={AdminProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
    </Stack.Navigator>
  );
}
