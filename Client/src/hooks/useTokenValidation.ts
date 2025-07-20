import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { isTokenExpired, isTokenExpiringSoon } from '@/lib/tokenUtils';

/**
 * Hook to handle automatic token validation and cleanup
 * Checks tokens every minute and redirects if expired
 */
export const useTokenValidation = () => {
  const { 
    userToken, 
    adminToken, 
    logout, 
    adminLogout
  } = useAuthStore();

  const validateTokens = useCallback(() => {
    // Check user token
    if (userToken) {
      if (isTokenExpired(userToken)) {
        console.log('User token expired, logging out...');
        logout();
        
        // Redirect to user login if on user pages
        if (window.location.pathname.startsWith('/dashboard')) {
          window.location.href = '/login';
        }
      } else if (isTokenExpiringSoon(userToken, 5)) {
        console.log('User token expiring soon (within 5 minutes)');
        // You could implement token refresh here if your backend supports it
      }
    }

    // Check admin token
    if (adminToken) {
      if (isTokenExpired(adminToken)) {
        console.log('Admin token expired, logging out...');
        adminLogout();
        
        // Redirect to admin login if on admin pages
        if (window.location.pathname.startsWith('/admin')) {
          window.location.href = '/admin/login';
        }
      } else if (isTokenExpiringSoon(adminToken, 5)) {
        console.log('Admin token expiring soon (within 5 minutes)');
        // You could implement token refresh here if your backend supports it
      }
    }
  }, [userToken, adminToken, logout, adminLogout]);

  // Set up periodic token validation
  useEffect(() => {
    // Validate tokens immediately
    validateTokens();

    // Set up interval to check tokens every minute
    const interval = setInterval(validateTokens, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [validateTokens]);

  // Also validate on page focus (when user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      validateTokens();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [validateTokens]);

  // Validate tokens on route changes
  useEffect(() => {
    validateTokens();
  }, [window.location.pathname, validateTokens]);

  return {
    validateTokens,
    isUserTokenValid: userToken ? !isTokenExpired(userToken) : false,
    isAdminTokenValid: adminToken ? !isTokenExpired(adminToken) : false,
    isUserTokenExpiringSoon: userToken ? isTokenExpiringSoon(userToken, 5) : false,
    isAdminTokenExpiringSoon: adminToken ? isTokenExpiringSoon(adminToken, 5) : false,
  };
};