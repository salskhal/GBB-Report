import { useState } from "react";
import {
  Search,
  Plus,
} from "lucide-react";
import { useUsers, useDeleteUser } from "@/hooks/useUsers";
import { useMDAs } from "@/hooks/useMDAs";
import { useLayoutPreference } from "@/hooks/useLayoutPreference";
import { usePagination } from "@/hooks/usePagination";
import CreateUserModal from "@/components/modals/CreateUserModal";
import UpdateUserModal from "@/components/modals/UpdateUserModal";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";
import { ResetPasswordModal } from "@/components/modals/ResetPasswordModal";
import UserCardView from "@/components/UserCardView";
import UserTableView from "@/components/UserTableView";
import LayoutToggle from "@/components/LayoutToggle";
import Pagination from "@/components/Pagination";
import type { AdminUser } from "@/services/adminService";

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMDA, setSelectedMDA] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentLayout, setCurrentLayout] = useLayoutPreference('users', 'card');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  // Fetch data from backend
  const {
    data: users = [],
    isLoading: usersLoading,
    error: usersError,
  } = useUsers();
  const { data: mdas = [], isLoading: mdasLoading } = useMDAs();
  const deleteUserMutation = useDeleteUser();

  const handleUpdateUser = (user: AdminUser) => {
    setSelectedUser(user);
    setIsUpdateModalOpen(true);
  };

  const handleDeleteUser = (user: AdminUser) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleResetPassword = (user: AdminUser) => {
    setSelectedUser(user);
    setIsResetPasswordModalOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await deleteUserMutation.mutateAsync(selectedUser._id);
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  console.log("Users:", users);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMDA = selectedMDA === "" || user.mdaId?._id === selectedMDA;
    const matchesStatus =
      selectedStatus === "" ||
      (selectedStatus === "Active" && user.isActive) ||
      (selectedStatus === "Inactive" && !user.isActive);

    return matchesSearch && matchesMDA && matchesStatus;
  });

  // Pagination
  const {
    currentPage,
    itemsPerPage,
    totalPages,
    totalItems,
    paginatedData: paginatedUsers,
    setCurrentPage,
    setItemsPerPage
  } = usePagination({
    data: filteredUsers,
    initialItemsPerPage: 10
  });

  if (usersLoading || mdasLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (usersError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">
          Error loading users. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">
            Manage system users and their access
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <LayoutToggle
            currentLayout={currentLayout}
            onLayoutChange={setCurrentLayout}
          />
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus size={16} />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search by name, username, or email..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={selectedMDA}
            onChange={(e) => setSelectedMDA(e.target.value)}
          >
            <option value="">All MDAs</option>
            {mdas.map((mda) => (
              <option key={mda._id} value={mda.name}>
                {mda.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-4">
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

      {/* Users Display */}
      {currentLayout === 'card' ? (
        <UserCardView
          users={paginatedUsers}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
          onResetPassword={handleResetPassword}
          isDeleting={deleteUserMutation.isPending}
        />
      ) : (
        <UserTableView
          users={paginatedUsers}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
          onResetPassword={handleResetPassword}
          isDeleting={deleteUserMutation.isPending}
        />
      )}

      {/* Pagination */}
      {totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          showItemsPerPage={true}
          itemsPerPageOptions={[5, 10, 25, 50, 100]}
        />
      )}

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Update User Modal */}
      <UpdateUserModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        user={selectedUser}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteUser}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        itemName={selectedUser?.name}
        isDeleting={deleteUserMutation.isPending}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        userId={selectedUser?._id || ''}
        userName={selectedUser?.name || ''}
      />
    </div>
  );
}
