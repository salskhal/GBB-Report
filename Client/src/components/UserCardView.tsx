import React from 'react';
import { Edit, Trash2, Building2, Calendar, User, Shield } from 'lucide-react';
import type { AdminUser } from '@/services/adminService';

interface UserCardViewProps {
  users: AdminUser[];
  onUpdateUser: (user: AdminUser) => void;
  onDeleteUser: (user: AdminUser) => void;
  onResetPassword: (user: AdminUser) => void;
  isDeleting?: boolean;
}

const UserCardView: React.FC<UserCardViewProps> = ({
  users,
  onUpdateUser,
  onDeleteUser,
  onResetPassword,
  isDeleting = false
}) => {
  const getStatusBadge = (isActive: boolean) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    return isActive
      ? `${baseClasses} bg-green-100 text-green-800`
      : `${baseClasses} bg-red-100 text-red-800`;
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">
          No users found
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Try adjusting your filters or add a new user
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {users.map((user) => (
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
                <div className="mt-1 space-y-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Username:</span> {user.username}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">Contact:</span> {user.contactEmail}
                  </p>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  <span className="flex items-center">
                    <Building2 size={16} className="text-gray-400 mr-2" />
                    {user.mdaId?.name || "No MDA assigned"}
                  </span>
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="text-gray-500 hover:text-gray-700 p-1 rounded"
                  onClick={() => onUpdateUser(user)}
                  title="Edit User"
                >
                  <Edit size={16} />
                </button>
                <button
                  className="text-orange-500 hover:text-orange-700 p-1 rounded"
                  onClick={() => onResetPassword(user)}
                  title="Reset Password"
                >
                  <Shield size={16} />
                </button>
                <button
                  className="text-red-500 hover:text-red-700 p-1 rounded"
                  onClick={() => onDeleteUser(user)}
                  disabled={isDeleting}
                  title="Delete User"
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
  );
};

export default UserCardView;