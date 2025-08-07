import { useState, useMemo } from 'react';
import { Shield, Activity as ActivityIcon, User, Database, Settings, Clock, MapPin, Monitor } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import ActivityFilters, { type ActivityFilterState } from '@/components/ActivityFilters';
import ActivityPagination from '@/components/ActivityPagination';
import { useActivities, useExportActivities } from '@/hooks/useActivities';
import type { Activity } from '@/types';
import type { ActivityFilters as ActivityFiltersType } from '@/services/adminService';

export default function ActivityLog() {
  const { admin } = useAuthStore();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ActivityFilterState>({
    adminId: '',
    adminName: '',
    action: '',
    resourceType: '',
    dateFrom: '',
    dateTo: '',
    ipAddress: '',
  });

  // Prepare query parameters
  const queryParams = useMemo((): ActivityFiltersType => ({
    page: currentPage,
    limit: itemsPerPage,
    search: searchTerm || undefined,
    adminName: filters.adminName || undefined,
    action: filters.action || undefined,
    resourceType: filters.resourceType || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    ipAddress: filters.ipAddress || undefined,
  }), [currentPage, itemsPerPage, searchTerm, filters]);

  // Fetch activities using the hook
  const {
    data: activitiesData,
    isLoading: loading,
    error,
    refetch,
  } = useActivities(queryParams);

  // Export mutation
  const exportMutation = useExportActivities();

  // Check if current user is super admin
  const isSuperAdmin = admin?.role === 'superadmin';

  // Redirect if not super admin
  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            Access Denied
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Only super administrators can access activity logs.
          </p>
        </div>
      </div>
    );
  }

  // Extract data from the query result
  const activities = activitiesData?.activities || [];
  const totalActivities = activitiesData?.totalCount || 0;
  const totalPages = activitiesData?.totalPages || 0;

  const handleFilterChange = (newFilters: ActivityFilterState) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSearch = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handleExport = async () => {
    try {
      const exportParams = {
        search: searchTerm || undefined,
        adminName: filters.adminName || undefined,
        action: filters.action || undefined,
        resourceType: filters.resourceType || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        ipAddress: filters.ipAddress || undefined,
        format: 'csv' as const,
      };

      const blob = await exportMutation.mutateAsync(exportParams);
      
      // Download the file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const getActionIcon = (action: Activity['action']) => {
    switch (action) {
      case 'CREATE':
        return <div className="p-2 bg-green-100 rounded-full"><ActivityIcon size={16} className="text-green-600" /></div>;
      case 'UPDATE':
        return <div className="p-2 bg-blue-100 rounded-full"><Settings size={16} className="text-blue-600" /></div>;
      case 'DELETE':
        return <div className="p-2 bg-red-100 rounded-full"><ActivityIcon size={16} className="text-red-600" /></div>;
      case 'LOGIN':
        return <div className="p-2 bg-purple-100 rounded-full"><User size={16} className="text-purple-600" /></div>;
      case 'LOGOUT':
        return <div className="p-2 bg-gray-100 rounded-full"><User size={16} className="text-gray-600" /></div>;
      default:
        return <div className="p-2 bg-gray-100 rounded-full"><ActivityIcon size={16} className="text-gray-600" /></div>;
    }
  };

  const getResourceIcon = (resourceType: Activity['resourceType']) => {
    switch (resourceType) {
      case 'USER':
        return <User size={14} className="text-gray-500" />;
      case 'MDA':
        return <Database size={14} className="text-gray-500" />;
      case 'ADMIN':
        return <Shield size={14} className="text-gray-500" />;
      default:
        return <ActivityIcon size={14} className="text-gray-500" />;
    }
  };

  const getActionBadge = (action: Activity['action']) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (action) {
      case 'CREATE':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'UPDATE':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'DELETE':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'LOGIN':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'LOGOUT':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading activity logs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ActivityIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            Error Loading Activities
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {error instanceof Error ? error.message : 'An error occurred while loading activities'}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
          <p className="text-gray-600 mt-2">
            Monitor all administrative activities and system events
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Activities</p>
              <p className="text-2xl font-bold text-gray-900">{activities.length}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-500">
              <ActivityIcon size={24} className="text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Page</p>
              <p className="text-2xl font-bold text-gray-900">{currentPage}</p>
            </div>
            <div className="p-3 rounded-full bg-green-500">
              <Clock size={24} className="text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Items Per Page</p>
              <p className="text-2xl font-bold text-gray-900">{itemsPerPage}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-500">
              <User size={24} className="text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pages</p>
              <p className="text-2xl font-bold text-gray-900">{totalPages}</p>
            </div>
            <div className="p-3 rounded-full bg-red-500">
              <Shield size={24} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <ActivityFilters
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        onExport={handleExport}
        isExporting={exportMutation.isPending}
        totalActivities={totalActivities}
        filteredActivities={activities.length}
      />

      {/* Activity List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Activities (Page {currentPage} of {totalPages})
          </h2>
        </div>
        
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <ActivityIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">
              {activities.length === 0 ? 'No activities found' : 'No activities match your filters'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {activities.length === 0 
                ? 'Activity logs will appear here as admins perform actions.'
                : 'Try adjusting your search terms or filters.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {activities.map((activity) => {
              const { date, time } = formatTimestamp(activity.timestamp);
              
              return (
                <div key={activity._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-4">
                    {getActionIcon(activity.action)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.adminName}
                          </p>
                          <span className={getActionBadge(activity.action)}>
                            {activity.action}
                          </span>
                          <div className="flex items-center space-x-1 text-gray-500">
                            {getResourceIcon(activity.resourceType)}
                            <span className="text-xs font-medium">
                              {activity.resourceType}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-900">{date}</p>
                          <p className="text-xs text-gray-500">{time}</p>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          {activity.action.toLowerCase()} {activity.resourceType.toLowerCase()}: {' '}
                          <span className="font-medium">{activity.resourceName}</span>
                        </p>
                        
                        {activity.details && Object.keys(activity.details).length > 0 && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                            <strong>Details:</strong> {JSON.stringify(activity.details, null, 2)}
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <MapPin size={12} />
                          <span>IP: {activity.ipAddress}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Monitor size={12} />
                          <span title={activity.userAgent}>
                            {activity.userAgent.length > 50 
                              ? `${activity.userAgent.substring(0, 50)}...` 
                              : activity.userAgent
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalActivities > 0 && (
        <ActivityPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalActivities}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}
    </div>
  );
}