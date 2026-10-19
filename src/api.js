import axios from 'axios';

const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const defaultBaseUrl = isLocalhost 
  ? 'http://localhost:5000/api' 
  : 'https://musical-app-backend.onrender.com/api';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultBaseUrl,
  withCredentials: true
});

// Attache automatiquement le jeton d'authentification pour garantir le bon fonctionnement
// même sur les navigateurs qui bloquent les cookies cross-site (Safari ITP / Chrome)
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('musical_app_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // LocalStorage indisponible ou restreint
  }
  return config;
});

export default api;