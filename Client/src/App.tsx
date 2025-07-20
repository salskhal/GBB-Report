import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage, Report, Overview, AdminLoginPage, Profile } from "./pages";
import DashboardLayout from "./layout/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";

import { useAuthStore } from "./store/authStore";
import { AdminOverview, UserManagement, MDAManagement } from "./pages/admin";
import { AdminProtectedRoute } from "./components/AdminProtectedRoute";
import AdminDashboardLayout from "./layout/AdminLayout";
import { AuthProvider } from "./components/AuthProvider";
// import { DualAuthDemo } from "./components/DualAuthDemo";

const App = () => {
  const { isAuthenticated, isAdminAuthenticated } = useAuthStore();
  
  // Check if we're in development mode to show auth status
  // const isDevelopment = import.meta.env.DEV;

  return (
    <AuthProvider>
      <div>
        <Routes>
          {/* Admin Login */}
          <Route
            path="/admin/login"
            element={
              isAdminAuthenticated ? (
                <Navigate to="/admin/dashboard" replace />
              ) : (
                <AdminLoginPage />
              )
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboardLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="mdas" element={<MDAManagement />} />
          </Route>

          {/* User dashboard */}
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LoginPage />
              )
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="report" element={<Report />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>

        {/* Show auth status in development mode */}
        {/* {isDevelopment && <AuthStatus showDetails={true} />} */}
      </div>
    </AuthProvider>
  );
};

export default App;
