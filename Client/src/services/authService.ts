import api from '@/lib/api';

export interface LoginRequest {
  email: string;
  password: string;
  mdaId: string;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      mda: {
        id: string;
        name: string;
        reportUrl: string;
      };
    };
  };
}

export interface AdminAuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    admin: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  };
}

export interface MDA {
  _id: string;
  name: string;
  reportUrl?: string;
  isActive: boolean;
}

export const authService = {
  // User login
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Admin login
  adminLogin: async (credentials: AdminLoginRequest): Promise<AdminAuthResponse> => {
    const response = await api.post('/auth/admin/login', credentials);
    return response.data;
  },

  // Get MDAs for dropdown
  getMDAs: async (): Promise<MDA[]> => {
    const response = await api.get('/auth/mdas');
    return response.data.data;
  },
};