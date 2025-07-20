import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService, type ChangePasswordRequest } from '@/services/profileService';

// Hook for fetching user profile
export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: profileService.getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for changing password
export const useChangePassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => profileService.changePassword(data),
    onSuccess: () => {
      // Optionally invalidate profile data or show success message
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};