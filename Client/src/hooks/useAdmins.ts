import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, type CreateAdminRequest, type UpdateAdminRequest } from '@/services/adminService';

export const useAdmins = (params?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
  search?: string;
  role?: string;
  isActive?: string;
}) => {
  return useQuery({
    queryKey: ['admins', params],
    queryFn: () => adminService.getAllAdmins(params),
  });
};

export const useAdmin = (id: string) => {
  return useQuery({
    queryKey: ['admin', id],
    queryFn: () => adminService.getAdmin(id),
    enabled: !!id,
  });
};

export const useCreateAdmin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (adminData: CreateAdminRequest) => adminService.createAdmin(adminData),
    onSuccess: () => {
      // Invalidate all admin queries to refresh pagination and data
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
  });
};

export const useUpdateAdmin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, adminData }: { id: string; adminData: UpdateAdminRequest }) => 
      adminService.updateAdmin(id, adminData),
    onSuccess: () => {
      // Invalidate all admin queries to refresh pagination and data
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
  });
};

export const useDeleteAdmin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => adminService.deleteAdmin(id),
    onSuccess: () => {
      // Invalidate all admin queries to refresh pagination and data
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
  });
};