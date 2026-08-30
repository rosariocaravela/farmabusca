import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken, login as apiLogin, register as apiRegister, getProfile, forgotPassword as apiForgotPassword, resetPassword as apiResetPassword } from '../services/api';

const AuthContext = createContext();

const STORAGE_KEY = 'farmabusca-auth';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authInitialRoute, setAuthInitialRoute] = useState('Login');

  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedSession = await AsyncStorage.getItem(STORAGE_KEY);
        if (!storedSession) return;

        const session = JSON.parse(storedSession);
        if (!session?.user || !session?.token) {
          await AsyncStorage.removeItem(STORAGE_KEY);
          return;
        }

        setToken(session.token);
        setAuthToken(session.token);
        try {
          const profile = await getProfile();
          const validatedUser = profile || session.user;
          setUser(validatedUser);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ user: validatedUser, token: session.token }));
        } catch (profileError) {
          if (profileError.response?.status === 401) {
            await AsyncStorage.removeItem(STORAGE_KEY);
            setUser(null);
            setToken(null);
            setAuthToken(null);
            return;
          }
          setUser(session.user);
        }
        setAuthInitialRoute('Splash');
      } catch (error) {
        console.log('Não foi possível restaurar a sessão:', error);
        await AsyncStorage.removeItem(STORAGE_KEY);
        setUser(null);
        setToken(null);
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  const saveSession = async ({ user: sessionUser, token: sessionToken }) => {
    setAuthInitialRoute('Splash');
    setUser(sessionUser);
    setToken(sessionToken);
    setAuthToken(sessionToken);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ user: sessionUser, token: sessionToken }));
  };

  const updateSessionUser = async (updatedUser) => {
    setUser(updatedUser);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ user: updatedUser, token }));
  };

  const login = async (credentials) => {
    const session = await apiLogin(credentials);
    await saveSession(session);
    return session;
  };

  const register = async (payload) => {
    let session;
    try {
      session = await apiRegister(payload);
    } catch (error) {
      const message = String(error.response?.data?.message || '').toLowerCase();
      const isExistingPharmacy =
        String(payload.role || '').toUpperCase() === 'PHARMACY' &&
        error.response?.status === 400 &&
        message.includes('email');

      if (!isExistingPharmacy) throw error;

      // The account was already created before the pharmacy returned from
      // step 1 to this screen. Authenticate it and resume the onboarding.
      session = await apiLogin({ email: payload.email, password: payload.password });
    }
    await saveSession(session);
    return session;
  };

  const forgotPassword = async (payload) => apiForgotPassword(payload);

  const resetPassword = async (payload) => {
    const session = await apiResetPassword(payload);
    await saveSession(session);
    return session;
  };

  const logout = async (returnTo = 'Login') => {
    setAuthInitialRoute(typeof returnTo === 'string' ? returnTo : 'Splash');
    setUser(null);
    setToken(null);
    setAuthToken(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, authInitialRoute, login, register, forgotPassword, resetPassword, logout, updateSessionUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
