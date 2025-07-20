import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useTokenValidation } from "@/hooks/useTokenValidation";
import { type ReactNode, useEffect } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, userToken, checkTokenValidity } = useAuthStore();
  const { isUserTokenValid } = useTokenValidation();

  // Check token validity on component mount and when token changes
  useEffect(() => {
    if (userToken) {
      checkTokenValidity();
    }
  }, [userToken, checkTokenValidity]);

  // If not authenticated or token is invalid, redirect to login
  if (!isAuthenticated || !isUserTokenValid) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
