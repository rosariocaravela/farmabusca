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
import PaymentScreen from '../screens/patient/PaymentScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const HomeStack = createStackNavigator();
const SearchStack = createStackNavigator();
const FavoritesStack = createStackNavigator();

function PatientSection({ navigator: SectionStack, initialName, initialComponent }) {
  return (
    <SectionStack.Navigator screenOptions={{ headerShown: false }}>
      <SectionStack.Screen name={initialName} component={initialComponent} />
      <SectionStack.Screen name="MedicineDetails" component={MedicineDetailsScreen} />
      <SectionStack.Screen name="PharmacyDetails" component={PharmacyDetailsScreen} />
      <SectionStack.Screen name="Payment" component={PaymentScreen} />
    </SectionStack.Navigator>
  );
}

function HomeNavigator() {
  return <PatientSection navigator={HomeStack} initialName="HomeList" initialComponent={HomeScreen} />;
}

function SearchNavigator() {
  return <PatientSection navigator={SearchStack} initialName="SearchList" initialComponent={SearchMedicineScreen} />;
}

function FavoritesNavigator() {
  return <PatientSection navigator={FavoritesStack} initialName="FavoritesList" initialComponent={FavoritesScreen} />;
}

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
      <Tab.Screen name="Home" component={HomeNavigator} options={{ title: 'Início' }} />
      <Tab.Screen name="Pesquisar" component={SearchNavigator} />
      <Tab.Screen name="Favoritos" component={FavoritesNavigator} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function PatientNavigator() {
  return <Stack.Navigator screenOptions={{ headerShown: false }}><Stack.Screen name="PatientTabs" component={PatientTabs} /></Stack.Navigator>;
}
