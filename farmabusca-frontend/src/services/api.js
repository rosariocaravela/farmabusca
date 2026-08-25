import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'farmabusca-auth';

const getExpoBackendUrl = () => {
  const extra = Constants.expoConfig?.extra || Constants.manifest?.extra;
  if (extra?.BACKEND_URL) return extra.BACKEND_URL;
  const backendPort = extra?.BACKEND_PORT || 5000;
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host) return `http://${host}:${backendPort}`;
  }
  return null;
};

// Ajuste este valor para o IP da sua máquina quando usar Expo Go.
const defaultBackend = 'http://192.168.43.163:5000'; // Substitua pelo IP da sua máquina
const base = (process.env.BACKEND_URL || getExpoBackendUrl() || defaultBackend).replace(/\/$/, '');

const api = axios.create({
  baseURL: `${base}/api`,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  config.headers = config.headers || {};
  const storedSession = await AsyncStorage.getItem(STORAGE_KEY);
  if (storedSession) {
    const session = JSON.parse(storedSession);
    if (session?.token) {
      config.headers.Authorization = `Bearer ${session.token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('API request unauthorized:', error.config?.method?.toUpperCase(), error.config?.url, error.response?.data?.message || error.response?.data);
    }
    return Promise.reject(error);
  }
);

export const setBaseUrl = (backendUrl) => {
  api.defaults.baseURL = `${backendUrl.replace(/\/$/, '')}/api`;
};

export const setAuthToken = (token) => {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
};

export const login = (credentials) => api.post('/auth/login', credentials).then((r) => r.data.data);
export const register = (payload) => api.post('/auth/register', payload).then((r) => r.data.data);
export const forgotPassword = (payload) => api.post('/auth/forgot-password', payload).then((r) => r.data);
export const resetPassword = (payload) => api.post('/auth/reset-password', payload).then((r) => r.data.data);
export const getProfile = () => api.get('/auth/profile').then((r) => r.data.data);
export const updateUserProfile = (payload, config = {}) => api.put('/users/me', payload, config).then((r) => r.data.data);

export const getMyPharmacy = () => api.get('/pharmacies/me').then((r) => r.data.data);
export const createPharmacyProfile = (payload, config = {}) => {
  // Do not set Content-Type manually; let axios/browser set the multipart boundary
  return api.post('/pharmacies/me', payload, config).then((r) => r.data.data);
};

export const updatePharmacyProfile = (payload, config = {}) => {
  return api.put('/pharmacies/me', payload, { timeout: 60000, ...config }).then((r) => r.data.data);
};

export const getPharmacies = () => api.get('/pharmacies').then((r) => r.data);
export const getPharmacyById = (id) => api.get(`/pharmacies/${id}`).then((r) => r.data?.data || r.data);
export const getPharmacyMedicines = (id) => api.get(`/pharmacies/${id}/medicines`).then((r) => r.data);
export const getMyPharmacyMedicines = () => api.get('/pharmacies/me/medicines').then((r) => r.data?.data || r.data);
export const getMyPharmacyMedicineById = (id) => api.get(`/pharmacies/me/medicines/${id}`).then((r) => r.data?.data || r.data);

export const getPendingPharmacies = () => api.get('/admin/pharmacies/pending').then((r) => r.data.data);
export const getAdminPharmacies = (params) => api.get('/admin/pharmacies', { params }).then((r) => r.data.data);
export const updateAdminPharmacyStatus = (id, action) => api.put(`/admin/pharmacies/${id}/status`, { action }).then((r) => r.data.data);
export const getAdminMedicines = (params) => api.get('/admin/medicines', { params }).then((r) => r.data.data);
export const getAdminSummary = () => api.get('/admin/analytics/summary').then((r) => r.data.data);
export const approvePharmacy = (id) => api.put(`/admin/pharmacies/${id}/approve`).then((r) => r.data.data);
export const getMedicines = () => api.get('/medicines').then((r) => r.data);
export const searchMedicines = (name) => api.get('/medicines/search', { params: { name } }).then((r) => r.data);
export const getMedicineById = (id) => api.get(`/medicines/${id}`).then((r) => r.data);
export const createMedicine = (data, config = {}) => api.post('/medicines', data, config).then((r) => r.data);
export const updateMedicine = (id, data, config = {}) => api.put(`/medicines/${id}`, data, config).then((r) => r.data);
export const getFavorites = () => api.get('/favorites').then((r) => r.data);
export const addFavorite = (medicineId) => api.post('/favorites', { medicineId }).then((r) => r.data);
export const removeFavorite = (medicineId) => api.delete(`/favorites/${medicineId}`).then((r) => r.data);
export const initiateReservationPayment = (medicineId, phone, requestId) => api.post('/payments', { medicineId, phone, requestId }).then((r) => r.data);
export const initiatePlanPayment = (plan, phone, requestId) => api.post('/payments/plans', { plan, phone, requestId }).then((r) => r.data);
export const getReservationPaymentStatus = (id) => api.get(`/payments/${id}`).then((r) => r.data);
export const askAssistant = (question, medicineId) => api.post('/assistant', { question, medicineId }).then((r) => r.data);

export default api;
