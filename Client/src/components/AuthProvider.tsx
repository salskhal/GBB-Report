import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useTokenValidation } from '@/hooks/useTokenValidation';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component that wraps the entire app
 * Handles token validation and automatic logout/redirect
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { checkTokenValidity } = useAuthStore();
  
  // Initialize token validation
  useTokenValidation();

  // Check token validity on app startup
  useEffect(() => {
    checkTokenValidity();
  }, [checkTokenValidity]);

  // Handle page visibility changes (when user switches tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible, check token validity
        checkTokenValidity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkTokenValidity]);

  return <>{children}</>;
};