import axios from 'axios';
import { isTokenExpired } from './tokenUtils';

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to determine which token to use based on the request URL
const getAppropriateToken = (url: string): string | null => {
  // Admin routes should use admin token
  if (url.includes('/admin/') || url.includes('/auth/admin/')) {
    const adminToken = localStorage.getItem('admin-token');
    return adminToken && !isTokenExpired(adminToken) ? adminToken : null;
  }
  
  // User routes should use user token
  const userToken = localStorage.getItem('user-token');
  return userToken && !isTokenExpired(userToken) ? userToken : null;
};

// Request interceptor to add appropriate auth token
api.interceptors.request.use(
  (config) => {
    const token = getAppropriateToken(config.url || '');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      
      // Handle admin token expiration
      if (requestUrl.includes('/admin/') || requestUrl.includes('/auth/admin/')) {
        console.log('Admin token expired or invalid - clearing admin session');
        handleAdminTokenExpiration();
      } else {
        // Handle user token expiration
        console.log('User token expired or invalid - clearing user session');
        handleUserTokenExpiration();
      }
    }
    return Promise.reject(error);
  }
);

// Helper function to handle admin token expiration
const handleAdminTokenExpiration = () => {
  localStorage.removeItem('admin-token');
  
  // Update auth store to clear admin state
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    try {
      const parsed = JSON.parse(authStorage);
      parsed.state.admin = null;
      parsed.state.adminToken = null;
      parsed.state.isAdminAuthenticated = false;
      localStorage.setItem('auth-storage', JSON.stringify(parsed));
    } catch (e) {
      console.error('Error updating auth storage:', e);
    }
  }
  
  // Redirect to admin login if on admin pages
  if (window.location.pathname.startsWith('/admin') && !window.location.pathname.includes('/login')) {
    window.location.href = '/admin/login';
  }
};

// Helper function to handle user token expiration
const handleUserTokenExpiration = () => {
  localStorage.removeItem('user-token');
  
  // Update auth store to clear user state
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    try {
      const parsed = JSON.parse(authStorage);
      parsed.state.user = null;
      parsed.state.userToken = null;
      parsed.state.isAuthenticated = false;
      localStorage.setItem('auth-storage', JSON.stringify(parsed));
    } catch (e) {
      console.error('Error updating auth storage:', e);
    }
  }
  
  // Redirect to user login if on user pages
  if (window.location.pathname.startsWith('/dashboard')) {
    window.location.href = '/login';
  }
};

export default api;