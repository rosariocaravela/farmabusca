import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import PatientNavigator from './PatientNavigator';
import PharmacyNavigator from './PharmacyNavigator';
import AdminNavigator from './AdminNavigator';
import BrandMark from '../components/BrandMark';
import { colors } from '../theme';

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}><BrandMark /><ActivityIndicator style={{ marginTop: 24 }} size="small" color={colors.primary} /></View>;
  }

  if (!user) {
    return <AuthNavigator />;
  }

  if (user.role?.toLowerCase() === 'admin') {
    return <AdminNavigator />;
  }

  return user.role?.toLowerCase() === 'pharmacy' ? <PharmacyNavigator /> : <PatientNavigator />;
}
