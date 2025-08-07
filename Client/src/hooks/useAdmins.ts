import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, type CreateAdminRequest, type UpdateAdminRequest } from '@/services/adminService';

export const useAdmins = () => {
  return useQuery({
    queryKey: ['admins'],
    queryFn: adminService.getAllAdmins,
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
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
  });
};

export const useDeleteAdmin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => adminService.deleteAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
  });
};