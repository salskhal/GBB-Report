import { useQuery, useMutation } from '@tanstack/react-query';
import { adminService, type ActivityFilters, type ActivitiesResponse } from '@/services/adminService';

export const useActivities = (params?: ActivityFilters) => {
  return useQuery<ActivitiesResponse>({
    queryKey: ['activities', params],
    queryFn: () => adminService.getActivities(params),
    placeholderData: (previousData) => previousData, // Keep previous data while loading new data
  });
};

export const useExportActivities = () => {
  return useMutation({
    mutationFn: (params?: {
      adminId?: string;
      adminName?: string;
      action?: string;
      resourceType?: string;
      dateFrom?: string;
      dateTo?: string;
      ipAddress?: string;
      search?: string;
      format?: 'csv' | 'json';
    }) => adminService.exportActivities(params),
  });
};