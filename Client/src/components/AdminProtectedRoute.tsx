import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useTokenValidation } from "@/hooks/useTokenValidation";
import { useEffect } from "react";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
  const { isAdminAuthenticated, adminToken, checkTokenValidity } = useAuthStore();
  const { isAdminTokenValid } = useTokenValidation();

  // Check token validity on component mount and when token changes
  useEffect(() => {
    if (adminToken) {
      checkTokenValidity();
    }
  }, [adminToken, checkTokenValidity]);

  // If not authenticated or token is invalid, redirect to admin login
  if (!isAdminAuthenticated || !isAdminTokenValid) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};