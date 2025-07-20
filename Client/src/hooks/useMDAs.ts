import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, type CreateMDARequest, type UpdateMDARequest } from '@/services/adminService';

export const useMDAs = () => {
  return useQuery({
    queryKey: ['mdas'],
    queryFn: adminService.getAllMDAs,
  });
};

export const useMDA = (id: string) => {
  return useQuery({
    queryKey: ['mda', id],
    queryFn: () => adminService.getMDA(id),
    enabled: !!id,
  });
};

export const useCreateMDA = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (mdaData: CreateMDARequest) => adminService.createMDA(mdaData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mdas'] });
    },
  });
};

export const useUpdateMDA = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, mdaData }: { id: string; mdaData: UpdateMDARequest }) => 
      adminService.updateMDA(id, mdaData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mdas'] });
    },
  });
};

export const useDeleteMDA = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => adminService.deleteMDA(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mdas'] });
    },
  });
};