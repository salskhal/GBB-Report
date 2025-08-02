import api from '@/lib/api';

export interface UserProfile {
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