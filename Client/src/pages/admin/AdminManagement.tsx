import { useState } from "react";
import { Search, Plus, Edit, Trash2, Shield, Crown, User } from "lucide-react";
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

  // Fetch data from backend
  const {
    data: admins = [],
    isLoading: adminsLoading,
    error: adminsError,
  } = useAdmins();
  const deleteAdminMutation = useDeleteAdmin();

  console.log("Admins data:", admins);

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

  const filteredAdmins = admins.filter((adminItem) => {
    const matchesSearch =
      adminItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adminItem.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "" || adminItem.role === selectedRole;
    const matchesStatus =
      selectedStatus === "" ||
      (selectedStatus === "Active" && adminItem.isActive) ||
      (selectedStatus === "Inactive" && !adminItem.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalAdmins = admins.length;
  const activeAdmins = admins.filter((a) => a.isActive).length;
  const superAdmins = admins.filter((a) => a.role === "superadmin").length;
  const regularAdmins = admins.filter((a) => a.role === "admin").length;

  if (adminsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading admins...</div>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Admins</p>
              <p className="text-2xl font-bold text-gray-900">{totalAdmins}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-500">
              <User size={24} className="text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Admins</p>
              <p className="text-2xl font-bold text-gray-900">{activeAdmins}</p>
            </div>
            <div className="p-3 rounded-full bg-green-500">
              <Shield size={24} className="text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Super Admins</p>
              <p className="text-2xl font-bold text-gray-900">{superAdmins}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-500">
              <Crown size={24} className="text-white" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Regular Admins
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {regularAdmins}
              </p>
            </div>
            <div className="p-3 rounded-full bg-indigo-500">
              <Shield size={24} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="superadmin">Super Admin</option>
            <option value="admin">Admin</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
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
      {filteredAdmins.length === 0 && (
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

      {/* Pagination */}
      <div className="flex items-center justify-between bg-white px-6 py-3 border border-gray-200 rounded-lg">
        <div className="text-sm text-gray-700">
          Showing {filteredAdmins.length} of {admins.length} admins
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
            Previous
          </button>
          <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm">
            1
          </button>
          <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
            Next
          </button>
        </div>
      </div>

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
