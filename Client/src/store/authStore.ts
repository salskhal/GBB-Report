import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService } from "@/services/authService";
import { isTokenExpired } from "@/lib/tokenUtils";
import type { AuthState, Admin } from "@/types";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      admin: null,
      userToken: null,
      adminToken: null,
      isAuthenticated: false,
      isAdminAuthenticated: false,

      // Initialize tokens from localStorage on app start
      initializeAuth: () => {
        const userToken = localStorage.getItem('user-token');
        const adminToken = localStorage.getItem('admin-token');
        
        // Validate and set user token
        if (userToken && !isTokenExpired(userToken)) {
          set({ userToken, isAuthenticated: true });
        } else if (userToken) {
          // Remove expired user token
          localStorage.removeItem('user-token');
          set({ user: null, userToken: null, isAuthenticated: false });
        }
        
        // Validate and set admin token
        if (adminToken && !isTokenExpired(adminToken)) {
          set({ adminToken, isAdminAuthenticated: true });
        } else if (adminToken) {
          // Remove expired admin token
          localStorage.removeItem('admin-token');
          set({ admin: null, adminToken: null, isAdminAuthenticated: false });
        }
      },
      
      setUserToken: (token: string) => {
        localStorage.setItem('user-token', token);
        set({ userToken: token });
      },

      setAdminToken: (token: string) => {
        localStorage.setItem('admin-token', token);
        set({ adminToken: token });
      },

      checkTokenValidity: () => {
        const state = get();
        
        // Check user token
        if (state.userToken && isTokenExpired(state.userToken)) {
          console.log('User token expired, logging out user');
          localStorage.removeItem('user-token');
          set({ 
            user: null, 
            userToken: null,
            isAuthenticated: false 
          });
          
          // Redirect to user login if currently on user pages
          if (window.location.pathname.startsWith('/dashboard')) {
            window.location.href = '/login';
          }
        }
        
        // Check admin token
        if (state.adminToken && isTokenExpired(state.adminToken)) {
          console.log('Admin token expired, logging out admin');
          localStorage.removeItem('admin-token');
          set({ 
            admin: null, 
            adminToken: null,
            isAdminAuthenticated: false 
          });
          
          // Redirect to admin login if currently on admin pages
          if (window.location.pathname.startsWith('/admin')) {
            window.location.href = '/admin/login';
          }
        }
      },

      login: async (
        username: string,
        password: string
      ): Promise<boolean> => {
        try {
          const response = await authService.login({ username, password });
          
          if (response.success) {
            const { token, user } = response.data;
            
            // Store user token separately
            localStorage.setItem('user-token', token);
            
            set({
              user,
              userToken: token,
              isAuthenticated: true,
            });
            
            return true;
          }
          return false;
        } catch (error) {
          console.error("Login error:", error);
          return false;
        }
      },

      adminLogin: async (
        email: string,
        password: string
      ): Promise<boolean> => {
        try {
          const response = await authService.adminLogin({ email, password });
          
          if (response.success) {
            const { token, admin } = response.data;
            
            // Create proper Admin object from response
            const adminData: Admin = {
              _id: admin.id,
              name: admin.name,
              email: admin.email,
              role: admin.role as 'admin' | 'superadmin',
              canBeDeleted: true, // Default value
              isActive: true, // Assume active if login successful
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            // Store admin token separately
            localStorage.setItem('admin-token', token);
            
            set({
              admin: adminData,
              adminToken: token,
              isAdminAuthenticated: true,
            });
            
            return true;
          }
          return false;
        } catch (error) {
          console.error("Admin login error:", error);
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem('user-token');
        set({ 
          user: null, 
          userToken: null,
          isAuthenticated: false 
        });
      },

      adminLogout: () => {
        localStorage.removeItem('admin-token');
        set({ 
          admin: null, 
          adminToken: null,
          isAdminAuthenticated: false 
        });
      },

      logoutAll: () => {
        localStorage.removeItem('user-token');
        localStorage.removeItem('admin-token');
        set({ 
          user: null, 
          admin: null,
          userToken: null,
          adminToken: null,
          isAuthenticated: false,
          isAdminAuthenticated: false 
        });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        admin: state.admin,
        userToken: state.userToken,
        adminToken: state.adminToken,
        isAuthenticated: state.isAuthenticated,
        isAdminAuthenticated: state.isAdminAuthenticated,
      }),
    }
  )
);