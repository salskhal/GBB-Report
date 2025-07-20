import api from '@/lib/api';

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

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  mdaId: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  mdaId?: string;
  role?: string;
  isActive?: boolean;
}

export interface MDA {
  _id: string;
  name: string;
  reportUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMDARequest {
  name: string;
  reportUrl: string;
}

export interface UpdateMDARequest {
  name?: string;
  reportUrl?: string;
  isActive?: boolean;
}

export const adminService = {
  // User Management
  getAllUsers: async (): Promise<AdminUser[]> => {
    const response = await api.get('/admin/users');
    return response.data.data;
  },

  getUser: async (id: string): Promise<AdminUser> => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data.data;
  },

  createUser: async (userData: CreateUserRequest): Promise<AdminUser> => {
    const response = await api.post('/admin/users', userData);
    return response.data.data;
  },

  updateUser: async (id: string, userData: UpdateUserRequest): Promise<AdminUser> => {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/admin/users/${id}`);
  },

  // MDA Management
  getAllMDAs: async (): Promise<MDA[]> => {
    const response = await api.get('/admin/mdas');
    return response.data.data;
  },

  getMDA: async (id: string): Promise<MDA> => {
    const response = await api.get(`/admin/mdas/${id}`);
    return response.data.data;
  },

  createMDA: async (mdaData: CreateMDARequest): Promise<MDA> => {
    const response = await api.post('/admin/mdas', mdaData);
    return response.data.data;
  },

  updateMDA: async (id: string, mdaData: UpdateMDARequest): Promise<MDA> => {
    const response = await api.put(`/admin/mdas/${id}`, mdaData);
    return response.data.data;
  },

  deleteMDA: async (id: string): Promise<void> => {
    await api.delete(`/admin/mdas/${id}`);
  },

  // Password Management
  resetUserPassword: async (userId: string, newPassword: string): Promise<void> => {
    const response = await api.put(`/admin/users/${userId}/reset-password`, { newPassword });
    return response.data;
  },
};