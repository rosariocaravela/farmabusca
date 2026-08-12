import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/patient/HomeScreen';
import SearchMedicineScreen from '../screens/patient/SearchMedicineScreen';
import FavoritesScreen from '../screens/patient/FavoritesScreen';
import ProfileScreen from '../screens/patient/ProfileScreen';
import MedicineDetailsScreen from '../screens/patient/MedicineDetailsScreen';
import PharmacyDetailsScreen from '../screens/patient/PharmacyDetailsScreen';

const Tab = createBottomTabNavigator();

export default function PatientNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Pesquisar') iconName = focused ? 'search' : 'search-outline';
          else if (route.name === 'Favoritos') iconName = focused ? 'heart' : 'heart-outline';
          else if (route.name === 'Perfil') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2F9E5D',
        tabBarInactiveTintColor: '#8c95a4',
        tabBarStyle: { height: 64, paddingBottom: 8, borderTopWidth: 0, backgroundColor: '#FFFFFF' },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Pesquisar" component={SearchMedicineScreen} />
      <Tab.Screen name="Favoritos" component={FavoritesScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
      <Tab.Screen name="MedicineDetails" component={MedicineDetailsScreen} options={{ tabBarButton: () => null }} />
      <Tab.Screen name="PharmacyDetails" component={PharmacyDetailsScreen} options={{ tabBarButton: () => null }} />
    </Tab.Navigator>
  );
}
