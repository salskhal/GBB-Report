import api from '@/lib/api';

export interface UserProfile {
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

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const profileService = {
  // Get user profile
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get('/profile');
    return response.data.data;
  },

  // Change user password
  changePassword: async (passwordData: ChangePasswordRequest): Promise<void> => {
    const response = await api.put('/profile/password', passwordData);
    return response.data;
  },
};