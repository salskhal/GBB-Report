import { useState } from "react";
import { Search, Plus, Edit, Trash2, Shield, Crown, User, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import CreateAdminModal from "@/components/modals/CreateAdminModal";
import UpdateAdminModal from "@/components/modals/UpdateAdminModal";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";
import { useAdmins, useDeleteAdmin } from "@/hooks/useAdmins";
import type { Admin } from "@/services/adminService";

export default function AdminManagement() {
  const { admin } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

  // Fetch data from backend with pagination
  const {
    data: adminData,
    isLoading: adminsLoading,
    error: adminsError,
  } = useAdmins({
    page: currentPage,
    limit: itemsPerPage,
    sortBy,
    sortOrder,
    search: searchTerm,
    role: selectedRole,
    isActive: selectedStatus,
  });
  
  const deleteAdminMutation = useDeleteAdmin();

  const admins = adminData?.admins || [];
  const pagination = adminData?.pagination || {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  };

  console.log("Admins data:", adminData);

  // Check if current user is super admin
  const isSuperAdmin = admin?.role === "superadmin";

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
            Only super administrators can access admin management.
          </p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (isActive: boolean) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    return isActive
      ? `${baseClasses} bg-green-100 text-green-800`
      : `${baseClasses} bg-red-100 text-red-800`;
  };

  const getRoleBadge = (role: string) => {
    const baseClasses =
      "px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1";
    return role === "superadmin"
      ? `${baseClasses} bg-purple-100 text-purple-800`
      : `${baseClasses} bg-blue-100 text-blue-800`;
  };

  const getRoleIcon = (role: string) => {
    return role === "superadmin" ? <Crown size={12} /> : <Shield size={12} />;
  };

  const handleUpdateAdmin = (adminToUpdate: Admin) => {
    setSelectedAdmin(adminToUpdate);
    setIsUpdateModalOpen(true);
  };

  const handleDeleteAdmin = (adminToDelete: Admin) => {
    setSelectedAdmin(adminToDelete);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteAdmin = async () => {
    if (!selectedAdmin) return;

    try {
      await deleteAdminMutation.mutateAsync(selectedAdmin._id);
      setIsDeleteModalOpen(false);
      setSelectedAdmin(null);
    } catch (error) {
      console.error("Failed to delete admin:", error);
    }
  };

  // Since filtering is now done on the backend, we use admins directly
  const filteredAdmins = admins;

  // Calculate summary stats from current page data
  const totalAdmins = pagination.totalItems;
  const activeAdmins = admins.filter((a) => a.isActive).length;
  const superAdmins = admins.filter((a) => a.role === "superadmin").length;
  const regularAdmins = admins.filter((a) => a.role === "admin").length;

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setCurrentPage(1); // Reset to first page
  };

  // Reset page when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleRoleChange = (value: string) => {
    setSelectedRole(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  };

  if (adminsLoading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
            <p className="text-gray-600 mt-2">
              Manage administrator accounts and permissions
            </p>
          </div>
        </div>
        
        {/* Loading State */}
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <div className="text-gray-500 mt-4">Loading admins...</div>
          </div>
        </div>
      </div>
    );
  }

  if (adminsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">
          Error loading admins. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
          <p className="text-gray-600 mt-2">
            Manage administrator accounts and permissions
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="mt-4 sm:mt-0 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={16} />
          <span>Add Admin</span>
        </button>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Admins</p>
              <p className="text-2xl font-bold text-gray-900">{totalAdmins}</p>
              <p className="text-xs text-gray-500 mt-1">
                {searchTerm || selectedRole || selectedStatus ? 'Filtered results' : 'All admins'}
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-500">
              <User size={24} className="text-white" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Page Stats</p>
              <p className="text-2xl font-bold text-gray-900">{filteredAdmins.length}</p>
              <p className="text-xs text-gray-500 mt-1">
                {activeAdmins} active, {filteredAdmins.length - activeAdmins} inactive
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-500">
              <Shield size={24} className="text-white" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Active: {((activeAdmins / Math.max(filteredAdmins.length, 1)) * 100).toFixed(0)}%</span>
              <span>Showing: {filteredAdmins.length}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Super Admins</p>
              <p className="text-2xl font-bold text-gray-900">{superAdmins}</p>
              <p className="text-xs text-gray-500 mt-1">
                {((superAdmins / Math.max(filteredAdmins.length, 1)) * 100).toFixed(0)}% of current page
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-500">
              <Crown size={24} className="text-white" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Protected accounts
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Regular Admins</p>
              <p className="text-2xl font-bold text-gray-900">{regularAdmins}</p>
              <p className="text-xs text-gray-500 mt-1">
                {((regularAdmins / Math.max(filteredAdmins.length, 1)) * 100).toFixed(0)}% of current page
              </p>
            </div>
            <div className="p-3 rounded-full bg-indigo-500">
              <Shield size={24} className="text-white" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              Can be managed
            </div>
          </div>
        </div>
      </div>

      {/* Additional Summary Bar */}
      {(searchTerm || selectedRole || selectedStatus) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm text-blue-800">
                <span className="font-medium">Active Filters:</span>
                {searchTerm && <span className="ml-2 px-2 py-1 bg-blue-100 rounded text-xs">Search: "{searchTerm}"</span>}
                {selectedRole && <span className="ml-2 px-2 py-1 bg-blue-100 rounded text-xs">Role: {selectedRole}</span>}
                {selectedStatus && <span className="ml-2 px-2 py-1 bg-blue-100 rounded text-xs">Status: {selectedStatus === 'true' ? 'Active' : 'Inactive'}</span>}
              </div>
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedRole('');
                setSelectedStatus('');
                setCurrentPage(1);
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={selectedRole}
            onChange={(e) => handleRoleChange(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="superadmin">Super Admin</option>
            <option value="admin">Admin</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={selectedStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
        
        {/* Sort Controls */}
        <div className="mt-4 flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-600">Sort by:</span>
          <button
            onClick={() => handleSortChange("name")}
            className={`px-3 py-1 rounded text-sm ${
              sortBy === "name" 
                ? "bg-blue-100 text-blue-800" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
          <button
            onClick={() => handleSortChange("email")}
            className={`px-3 py-1 rounded text-sm ${
              sortBy === "email" 
                ? "bg-blue-100 text-blue-800" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Email {sortBy === "email" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
          <button
            onClick={() => handleSortChange("role")}
            className={`px-3 py-1 rounded text-sm ${
              sortBy === "role" 
                ? "bg-blue-100 text-blue-800" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Role {sortBy === "role" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
          <button
            onClick={() => handleSortChange("createdAt")}
            className={`px-3 py-1 rounded text-sm ${
              sortBy === "createdAt" 
                ? "bg-blue-100 text-blue-800" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Created {sortBy === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
        </div>
      </div>

      {/* Admin Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAdmins.map((adminItem) => (
          <div
            key={adminItem._id}
            className="bg-white rounded-lg shadow-sm border border-gray-200"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <User size={20} className="text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {adminItem.name}
                    </h3>
                    <span className={getStatusBadge(adminItem.isActive)}>
                      {adminItem.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="mt-1 space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Email:</span> {adminItem.email}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600">Role:</span>
                      <span className={getRoleBadge(adminItem.role)}>
                        {getRoleIcon(adminItem.role)}
                        <span className="capitalize">{adminItem.role}</span>
                      </span>
                    </div>
                  </div>
                  {adminItem.lastLogin && (
                    <p className="text-sm text-gray-500 mt-2">
                      Last login: {new Date(adminItem.lastLogin).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    className="text-gray-500 hover:text-gray-700 p-1 rounded"
                    onClick={() => handleUpdateAdmin(adminItem)}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className={`p-1 rounded ${
                      !adminItem.canBeDeleted
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-red-500 hover:text-red-700'
                    }`}
                    onClick={() => adminItem.canBeDeleted && handleDeleteAdmin(adminItem)}
                    disabled={!adminItem.canBeDeleted || deleteAdminMutation.isPending}
                    title={!adminItem.canBeDeleted ? 'Super admin cannot be deleted' : 'Delete admin'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>
                      Created: {new Date(adminItem.createdAt).toLocaleDateString()}
                    </span>
                    {adminItem.createdBy && (
                      <span>
                        Created by: {adminItem.createdBy.name}
                      </span>
                    )}
                  </div>
                  {!adminItem.canBeDeleted && (
                    <span className="text-purple-600 font-medium">Protected</span>
                  )}
                </div>
              </div>
            </div>
          
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAdmins.length === 0 && !adminsLoading && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            No admins found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || selectedRole || selectedStatus
              ? "Try adjusting your filters"
              : "Get started by adding a new admin"}
          </p>
        </div>
      )}

      {/* Enhanced Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            {/* Results Summary */}
            <div className="text-sm text-gray-700">
              Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
              {pagination.totalItems} admins
            </div>
            
            {/* Pagination Controls */}
            <div className="flex items-center space-x-2">
              {/* Previous Button */}
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  pagination.currentPage === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                <ChevronLeft size={16} className="mr-1" />
                Previous
              </button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNumber;
                  if (pagination.totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (pagination.currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    pageNumber = pagination.totalPages - 4 + i;
                  } else {
                    pageNumber = pagination.currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        pageNumber === pagination.currentPage
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              {/* Next Button */}
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  pagination.currentPage === pagination.totalPages
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                Next
                <ChevronRight size={16} className="ml-1" />
              </button>
            </div>
          </div>

          {/* Quick Jump */}
          {pagination.totalPages > 5 && (
            <div className="mt-4 flex items-center justify-center space-x-2">
              <span className="text-sm text-gray-600">Go to page:</span>
              <input
                type="number"
                min={1}
                max={pagination.totalPages}
                value={pagination.currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= pagination.totalPages) {
                    handlePageChange(page);
                  }
                }}
                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-600">of {pagination.totalPages}</span>
            </div>
          )}
        </div>
      )}

      {/* Create Admin Modal */}
      <CreateAdminModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Update Admin Modal */}
      <UpdateAdminModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        admin={selectedAdmin}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteAdmin}
        title="Delete Admin"
        message="Are you sure you want to delete this admin? This action cannot be undone."
        itemName={selectedAdmin?.name}
        isDeleting={deleteAdminMutation.isPending}
      />
    </div>
  );
}
