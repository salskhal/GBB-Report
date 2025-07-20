// User type for authenticated user (from auth response)
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  mda: {
    id: string;
    name: string;
    reportUrl: string;
  };
}

// User type for admin management (from admin API)
export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  mdaId: {
    _id: string;
    name: string;
    reportUrl?: string;
  };
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Admin {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MDA {
  _id: string;
  name: string;
  reportUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  admin: Admin | null;
  userToken: string | null;
  adminToken: string | null;
  isAuthenticated: boolean;
  isAdminAuthenticated: boolean;
  login: (email: string, password: string, mdaId: string) => Promise<boolean>;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  adminLogout: () => void;
  logoutAll: () => void; // Logout from both accounts
  setUserToken: (token: string) => void;
  setAdminToken: (token: string) => void;
  checkTokenValidity: () => void;
  initializeAuth: () => void;
}
