// User type for authenticated user (from auth response)
export interface User {
  id: string;
  name: string;
  username: string;
  contactEmail: string;
  role: string;
  mda: {
    id: string;
    name: string;
    reports: Array<{
      title: string;
      url: string;
      isActive: boolean;
    }>;
  };
}

// User type for admin management (from admin API)
export interface AdminUser {
  _id: string;
  name: string;
  username: string;
  contactEmail: string;
  role: string;
  mdaReference: string;
  mda?: {
    _id: string;
    name: string;
    reports?: Array<{
      title: string;
      url: string;
      isActive: boolean;
    }>;
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
  role: "admin" | "superadmin";
  canBeDeleted: boolean;
  createdBy?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MDA {
  _id: string;
  name: string;
  reports: Array<{
    title: string;
    url: string;
    isActive: boolean;
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  _id: string;
  adminId: string;
  adminName: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT";
  resourceType: "USER" | "MDA" | "ADMIN";
  resourceId: string;
  resourceName: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface AuthState {
  user: User | null;
  admin: Admin | null;
  userToken: string | null;
  adminToken: string | null;
  isAuthenticated: boolean;
  isAdminAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  adminLogout: () => void;
  logoutAll: () => void; // Logout from both accounts
  setUserToken: (token: string) => void;
  setAdminToken: (token: string) => void;
  checkTokenValidity: () => void;
  initializeAuth: () => void;
}
