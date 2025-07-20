import { isTokenExpired } from './tokenUtils';

/**
 * Utility functions for authentication management
 */

/**
 * Check if user is currently logged in with valid token
 */
export const isUserLoggedIn = (): boolean => {
  const userToken = localStorage.getItem('user-token');
  return userToken ? !isTokenExpired(userToken) : false;
};

/**
 * Check if admin is currently logged in with valid token
 */
export const isAdminLoggedIn = (): boolean => {
  const adminToken = localStorage.getItem('admin-token');
  return adminToken ? !isTokenExpired(adminToken) : false;
};

/**
 * Get current user token if valid
 */
export const getUserToken = (): string | null => {
  const userToken = localStorage.getItem('user-token');
  return userToken && !isTokenExpired(userToken) ? userToken : null;
};

/**
 * Get current admin token if valid
 */
export const getAdminToken = (): string | null => {
  const adminToken = localStorage.getItem('admin-token');
  return adminToken && !isTokenExpired(adminToken) ? adminToken : null;
};

/**
 * Force logout user (clear user session only)
 */
export const forceUserLogout = (): void => {
  localStorage.removeItem('user-token');
  
  // Update auth store
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    const parsed = JSON.parse(authStorage);
    parsed.state.user = null;
    parsed.state.userToken = null;
    parsed.state.isAuthenticated = false;
    localStorage.setItem('auth-storage', JSON.stringify(parsed));
  }
  
  // Redirect to user login
  if (window.location.pathname.startsWith('/dashboard')) {
    window.location.href = '/login';
  }
};

/**
 * Force logout admin (clear admin session only)
 */
export const forceAdminLogout = (): void => {
  localStorage.removeItem('admin-token');
  
  // Update auth store
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    const parsed = JSON.parse(authStorage);
    parsed.state.admin = null;
    parsed.state.adminToken = null;
    parsed.state.isAdminAuthenticated = false;
    localStorage.setItem('auth-storage', JSON.stringify(parsed));
  }
  
  // Redirect to admin login
  if (window.location.pathname.startsWith('/admin')) {
    window.location.href = '/admin/login';
  }
};

/**
 * Get authentication status for both user and admin
 */
export const getAuthStatus = () => {
  return {
    user: {
      isLoggedIn: isUserLoggedIn(),
      token: getUserToken(),
    },
    admin: {
      isLoggedIn: isAdminLoggedIn(),
      token: getAdminToken(),
    },
  };
};

/**
 * Clear all authentication data (both user and admin)
 */
export const clearAllAuth = (): void => {
  localStorage.removeItem('user-token');
  localStorage.removeItem('admin-token');
  localStorage.removeItem('auth-storage');
  
  // Redirect based on current location
  if (window.location.pathname.startsWith('/admin')) {
    window.location.href = '/admin/login';
  } else {
    window.location.href = '/login';
  }
};