import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import TabIcon from '../components/TabIcon';
import HomeScreen from '../screens/patient/HomeScreen';
import SearchMedicineScreen from '../screens/patient/SearchMedicineScreen';
import FavoritesScreen from '../screens/patient/FavoritesScreen';
import ProfileScreen from '../screens/patient/ProfileScreen';
import MedicineDetailsScreen from '../screens/patient/MedicineDetailsScreen';
import PharmacyDetailsScreen from '../screens/patient/PharmacyDetailsScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function PatientTabs() {
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
          return <TabIcon name={iconName} focused={focused} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 1 },
        tabBarStyle: { height: 72, paddingBottom: 8, paddingTop: 7, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Início' }} />
      <Tab.Screen name="Pesquisar" component={SearchMedicineScreen} />
      <Tab.Screen name="Favoritos" component={FavoritesScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function PatientNavigator() {
  return <Stack.Navigator screenOptions={{ headerShown: false }}><Stack.Screen name="PatientTabs" component={PatientTabs} /><Stack.Screen name="MedicineDetails" component={MedicineDetailsScreen} /><Stack.Screen name="PharmacyDetails" component={PharmacyDetailsScreen} /></Stack.Navigator>;
}
