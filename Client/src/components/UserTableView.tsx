import React from 'react';
import { Edit, Trash2, Shield } from 'lucide-react';
import type { AdminUser } from '@/services/adminService';

interface UserTableViewProps {
  users: AdminUser[];
  onUpdateUser: (user: AdminUser) => void;
  onDeleteUser: (user: AdminUser) => void;
  onResetPassword: (user: AdminUser) => void;
  isDeleting?: boolean;
}

const UserTableView: React.FC<UserTableViewProps> = ({
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-semibold text-gray-900">
            No users found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your filters or add a new user
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                MDA
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      @{user.username}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {user.contactEmail}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {user.mdaId?.name || "No MDA assigned"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={getStatusBadge(user.isActive)}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserTableView;