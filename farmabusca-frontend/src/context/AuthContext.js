import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken, login as apiLogin, register as apiRegister, forgotPassword as apiForgotPassword, resetPassword as apiResetPassword } from '../services/api';

const AuthContext = createContext();

const STORAGE_KEY = 'farmabusca-auth';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const storedSession = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedSession) {
          const session = JSON.parse(storedSession);
          setUser(session.user);
          setToken(session.token);
          setAuthToken(session.token);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  const saveSession = async ({ user: sessionUser, token: sessionToken }) => {
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
    const session = await apiRegister(payload);
    await saveSession(session);
    return session;
  };

  const forgotPassword = async (payload) => apiForgotPassword(payload);

  const resetPassword = async (payload) => {
    const session = await apiResetPassword(payload);
    await saveSession(session);
    return session;
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, forgotPassword, resetPassword, logout, updateSessionUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
