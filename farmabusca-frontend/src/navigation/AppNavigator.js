import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import PatientNavigator from './PatientNavigator';
import PharmacyNavigator from './PharmacyNavigator';
import AdminNavigator from './AdminNavigator';

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F9FC' }}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  if (!user) {
    return <AuthNavigator />;
  }

  if (user.role?.toLowerCase() === 'admin') {
    return <AdminNavigator />;
  }

  return user.role?.toLowerCase() === 'pharmacy' ? <PharmacyNavigator /> : <PatientNavigator />;
}
