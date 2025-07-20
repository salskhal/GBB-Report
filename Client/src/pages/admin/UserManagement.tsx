// import { useState } from 'react';
// import { Search, Plus, Edit, Trash2, Eye, Building2, Calendar, User } from 'lucide-react';
// import { useUsers, useDeleteUser } from '@/hooks/useUsers';
// import { useMDAs } from '@/hooks/useMDAs';
// import CreateUserModal from '@/components/modals/CreateUserModal';

// export default function UserManagement() {
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedMDA, setSelectedMDA] = useState('');
//   const [selectedStatus, setSelectedStatus] = useState('');
//   const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

//   // Fetch data from backend
//   const { data: users = [], isLoading: usersLoading, error: usersError } = useUsers();
//   const { data: mdas = [], isLoading: mdasLoading } = useMDAs();
//   const deleteUserMutation = useDeleteUser();

//   const getStatusBadge = (isActive: boolean) => {
//     const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
//     return isActive
//       ? `${baseClasses} bg-green-100 text-green-800`
//       : `${baseClasses} bg-red-100 text-red-800`;
//   };

//   const handleDeleteUser = async (userId: string) => {
//     if (window.confirm('Are you sure you want to delete this user?')) {
//       try {
//         await deleteUserMutation.mutateAsync(userId);
//       } catch (error) {
//         console.error('Failed to delete user:', error);
//       }
//     }
//   };

//   const filteredUsers = users.filter(user => {
//     const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesMDA = selectedMDA === '' || user.mda._id === selectedMDA;
//     const matchesStatus = selectedStatus === '' ||
//                          (selectedStatus === 'Active' && user.isActive) ||
//                          (selectedStatus === 'Inactive' && !user.isActive);

//     return matchesSearch && matchesMDA && matchesStatus;
//   });

//   if (usersLoading || mdasLoading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="text-gray-500">Loading...</div>
//       </div>
//     );
//   }

//   if (usersError) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="text-red-500">Error loading users. Please try again.</div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
//           <p className="text-gray-600 mt-2">Manage system users and their access</p>
//         </div>
//         <button
//           onClick={() => setIsCreateModalOpen(true)}
//           className="mt-4 sm:mt-0 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
//         >
//           <Plus size={16} />
//           <span>Add User</span>
//         </button>
//       </div>

//       {/* Filters */}
//       <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
//             <input
//               type="text"
//               placeholder="Search users..."
//               className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//             />
//           </div>
//           <select
//             className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             value={selectedMDA}
//             onChange={(e) => setSelectedMDA(e.target.value)}
//           >
//             <option value="">All MDAs</option>
//             {mdas.map(mda => (
//               <option key={mda._id} value={mda._id}>{mda.name}</option>
//             ))}
//           </select>
//         </div>
//         <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-4">
//           <select
//             className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             value={selectedStatus}
//             onChange={(e) => setSelectedStatus(e.target.value)}
//           >
//             <option value="">All Statuses</option>
//             <option value="Active">Active</option>
//             <option value="Inactive">Inactive</option>
//           </select>
//         </div>
//       </div>

//       {/* Users Cards */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {filteredUsers.map((user) => (
//           <div key={user._id} className="bg-white rounded-lg shadow-sm border border-gray-200">
//             <div className="p-6">
//               <div className="flex items-start justify-between">
//                 <div className="flex-1">
//                   <div className="flex items-center space-x-2">
//                     <User size={20} className="text-gray-500" />
//                     <h3 className="text-lg font-semibold text-gray-900">
//                       {user.name}
//                     </h3>
//                     <span className={getStatusBadge(user.isActive)}>
//                       {user.isActive ? 'Active' : 'Inactive'}
//                     </span>
//                   </div>
//                   <p className="text-sm text-gray-500 mt-1">{user.email}</p>
//                   <p className="text-sm text-gray-600 mt-2">
//                     <span className="flex items-center">
//                       <Building2 size={16} className="text-gray-400 mr-2" />
//                       {user.mda.name}

//                     </span>
//                   </p>
//                 </div>
//                 <div className="flex items-center space-x-2">
//                   <button className="text-blue-500 hover:text-blue-700 p-1 rounded">
//                     <Eye size={16} />
//                   </button>
//                   <button className="text-gray-500 hover:text-gray-700 p-1 rounded">
//                     <Edit size={16} />
//                   </button>
//                   <button
//                     className="text-red-500 hover:text-red-700 p-1 rounded"
//                     onClick={() => handleDeleteUser(user._id)}
//                     disabled={deleteUserMutation.isPending}
//                   >
//                     <Trash2 size={16} />
//                   </button>
//                 </div>
//               </div>

//               <div className="mt-4 pt-4 border-t border-gray-200">
//                 <div className="flex items-center justify-between text-sm text-gray-500">
//                   <div className="flex items-center space-x-2">
//                     <Calendar size={14} />
//                     <span>Created: {new Date(user.createdAt).toLocaleDateString()}</span>
//                   </div>
//                   <span>Role: {user.role}</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Pagination */}
//       <div className="flex items-center justify-between bg-white px-6 py-3 border border-gray-200 rounded-lg">
//         <div className="text-sm text-gray-700">
//           Showing {filteredUsers.length} of {users.length} users
//         </div>
//         <div className="flex items-center space-x-2">
//           <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
//             Previous
//           </button>
//           <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm">
//             1
//           </button>
//           <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
//             Next
//           </button>
//         </div>
//       </div>

//       {/* Create User Modal */}
//       <CreateUserModal
//         isOpen={isCreateModalOpen}
//         onClose={() => setIsCreateModalOpen(false)}
//       />
//     </div>
//   );
// }

import { useState } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Building2,
  Calendar,
  User,
  Shield,
} from "lucide-react";
import { useUsers, useDeleteUser } from "@/hooks/useUsers";
import { useMDAs } from "@/hooks/useMDAs";
import CreateUserModal from "@/components/modals/CreateUserModal";
import UpdateUserModal from "@/components/modals/UpdateUserModal";
import DeleteConfirmationModal from "@/components/modals/DeleteConfirmationModal";
import { ResetPasswordModal } from "@/components/modals/ResetPasswordModal";
import type { AdminUser } from "@/services/adminService";

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMDA, setSelectedMDA] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
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

  const getStatusBadge = (isActive: boolean) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    return isActive
      ? `${baseClasses} bg-green-100 text-green-800`
      : `${baseClasses} bg-red-100 text-red-800`;
  };

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

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMDA = selectedMDA === "" || user.mdaId?._id === selectedMDA;
    const matchesStatus =
      selectedStatus === "" ||
      (selectedStatus === "Active" && user.isActive) ||
      (selectedStatus === "Inactive" && !user.isActive);

    return matchesSearch && matchesMDA && matchesStatus;
  });

  console.log(filteredUsers);

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
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="mt-4 sm:mt-0 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus size={16} />
          <span>Add User</span>
        </button>
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
              placeholder="Search users..."
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
              <option key={mda._id} value={mda._id}>
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

      {/* Users Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredUsers.map((user) => (
          <div
            key={user._id}
            className="bg-white rounded-lg shadow-sm border border-gray-200"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <User size={20} className="text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {user.name}
                    </h3>
                    <span className={getStatusBadge(user.isActive)}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{user.email}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="flex items-center">
                      <Building2 size={16} className="text-gray-400 mr-2" />
                      {user.mdaId?.name || "No MDA assigned"}
                    </span>
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="text-blue-500 hover:text-blue-700 p-1 rounded">
                    <Eye size={16} />
                  </button>
                  <button
                    className="text-gray-500 hover:text-gray-700 p-1 rounded"
                    onClick={() => handleUpdateUser(user)}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    className="text-orange-500 hover:text-orange-700 p-1 rounded"
                    onClick={() => handleResetPassword(user)}
                    title="Reset Password"
                  >
                    <Shield size={16} />
                  </button>
                  <button
                    className="text-red-500 hover:text-red-700 p-1 rounded"
                    onClick={() => handleDeleteUser(user)}
                    disabled={deleteUserMutation.isPending}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <Calendar size={14} />
                    <span>
                      Created: {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span>Role: {user.role}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            No users found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || selectedMDA || selectedStatus
              ? "Try adjusting your filters"
              : "Get started by adding a new user"}
          </p>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between bg-white px-6 py-3 border border-gray-200 rounded-lg">
        <div className="text-sm text-gray-700">
          Showing {filteredUsers.length} of {users.length} users
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
