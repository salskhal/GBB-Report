import api from '@/lib/api';
import type { Activity } from '@/types';

export interface AdminUser {
  _id: string;
  name: string;
  username: string;
  contactEmail: string;
  role: string;
  mdaId?: {
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

export interface CreateUserRequest {
  name: string;
  username: string;
  contactEmail: string;
  password: string;
  mdaId: string;
}

export interface UpdateUserRequest {
  name?: string;
  username?: string;
  contactEmail?: string;
  mdaId?: string;
  role?: string;
  isActive?: boolean;
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

export interface CreateMDARequest {
  name: string;
  reports: Array<{
    title: string;
    url: string;
    isActive?: boolean;
  }>;
}

export interface UpdateMDARequest {
  name?: string;
  reports?: Array<{
    title: string;
    url: string;
    isActive?: boolean;
  }>;
  isActive?: boolean;
}


export interface CreatedBy {
  _id: string;
  name: string;
  email: string;
}

export interface Admin {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'superadmin';
  canBeDeleted: boolean;
  createdBy?: CreatedBy;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdminRequest {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'superadmin';
}

export interface UpdateAdminRequest {
  name?: string;
  email?: string;
  role?: 'admin' | 'superadmin';
  isActive?: boolean;
}

export interface ActivitiesResponse {
  activities: Activity[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface ActivityFilters {
  page?: number;
  limit?: number;
  adminId?: string;
  adminName?: string;
  action?: string;
  resourceType?: string;
  dateFrom?: string;
  dateTo?: string;
  ipAddress?: string;
  search?: string;
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

  // Admin Management
  getAllAdmins: async (): Promise<Admin[]> => {
    const response = await api.get('/admin/admins');
    return response.data.data;
  },

  getAdmin: async (id: string): Promise<Admin> => {
    const response = await api.get(`/admin/admins/${id}`);
    return response.data.data;
  },

  createAdmin: async (adminData: CreateAdminRequest): Promise<Admin> => {
    const response = await api.post('/admin/admins', adminData);
    return response.data.data;
  },

  updateAdmin: async (id: string, adminData: UpdateAdminRequest): Promise<Admin> => {
    const response = await api.put(`/admin/admins/${id}`, adminData);
    return response.data.data;
  },

  deleteAdmin: async (id: string): Promise<void> => {
    await api.delete(`/admin/admins/${id}`);
  },

  // Activity Management
  getActivities: async (params?: ActivityFilters): Promise<ActivitiesResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.adminId) queryParams.append('adminId', params.adminId);
    if (params?.adminName) queryParams.append('adminName', params.adminName);
    if (params?.action) queryParams.append('action', params.action);
    if (params?.resourceType) queryParams.append('resourceType', params.resourceType);
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params?.ipAddress) queryParams.append('ipAddress', params.ipAddress);
    if (params?.search) queryParams.append('search', params.search);

    const response = await api.get(`/admin/activities?${queryParams.toString()}`);
    return response.data.data; // Extract the data property from the response
  },

  exportActivities: async (params?: {
    adminId?: string;
    adminName?: string;
    action?: string;
    resourceType?: string;
    dateFrom?: string;
    dateTo?: string;
    ipAddress?: string;
    search?: string;
    format?: 'csv' | 'json';
  }): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    
    if (params?.adminId) queryParams.append('adminId', params.adminId);
    if (params?.adminName) queryParams.append('adminName', params.adminName);
    if (params?.action) queryParams.append('action', params.action);
    if (params?.resourceType) queryParams.append('resourceType', params.resourceType);
    if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
    if (params?.ipAddress) queryParams.append('ipAddress', params.ipAddress);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.format) queryParams.append('format', params.format);

    const response = await api.get(`/admin/activities/export?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Data Export Methods
  exportUserData: async (params?: {
    mdaId?: string;
    isActive?: boolean;
    startDate?: string;
    endDate?: string;
    format?: 'csv' | 'json';
  }): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    
    if (params?.mdaId) queryParams.append('mdaId', params.mdaId);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.format) queryParams.append('format', params.format);

    const response = await api.get(`/admin/export/users?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportMDAData: async (params?: {
    isActive?: boolean;
    startDate?: string;
    endDate?: string;
    format?: 'csv' | 'json';
  }): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.format) queryParams.append('format', params.format);

    const response = await api.get(`/admin/export/mdas?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  exportCombinedData: async (params?: {
    mdaId?: string;
    isActive?: boolean;
    startDate?: string;
    endDate?: string;
    format?: 'csv' | 'json';
  }): Promise<Blob> => {
    const queryParams = new URLSearchParams();
    
    if (params?.mdaId) queryParams.append('mdaId', params.mdaId);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.format) queryParams.append('format', params.format);

    const response = await api.get(`/admin/export/combined?${queryParams.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};