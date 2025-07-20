import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useTokenValidation } from '@/hooks/useTokenValidation';
import { User, Shield, LogOut, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * Demo component to showcase dual authentication functionality
 * This component allows you to test simultaneous user and admin login
 */
export const DualAuthDemo = () => {
  const [showDemo, setShowDemo] = useState(false);
  const {
    user,
    admin,
    isAuthenticated,
    isAdminAuthenticated,
    login,
    adminLogin,
    logout,
    adminLogout,
    logoutAll
  } = useAuthStore();

  const {
    isUserTokenValid,
    isAdminTokenValid,
    isUserTokenExpiringSoon,
    isAdminTokenExpiringSoon
  } = useTokenValidation();

  // Demo credentials (you can customize these)
  const [userCredentials, setUserCredentials] = useState({
    email: 'user@example.com',
    password: 'password123',
    mdaId: '' // This should be filled with actual MDA ID
  });

  const [adminCredentials, setAdminCredentials] = useState({
    email: 'admin@example.com',
    password: 'admin123'
  });

  const handleUserLogin = async () => {
    const success = await login(
      userCredentials.email,
      userCredentials.password,
      userCredentials.mdaId
    );
    if (success) {
      console.log('User login successful');
    } else {
      console.log('User login failed');
    }
  };

  const handleAdminLogin = async () => {
    const success = await adminLogin(
      adminCredentials.email,
      adminCredentials.password
    );
    if (success) {
      console.log('Admin login successful');
    } else {
      console.log('Admin login failed');
    }
  };

  if (!showDemo) {
    return (
      <button
        onClick={() => setShowDemo(true)}
        className="fixed top-4 left-4 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-indigo-700 z-50"
      >
        Show Dual Auth Demo
      </button>
    );
  }

  return (
    <div className="fixed top-4 left-4 bg-white border border-gray-300 rounded-lg shadow-xl p-6 max-w-lg z-50 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Dual Authentication Demo</h2>
        <button
          onClick={() => setShowDemo(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {/* Current Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-3">Current Authentication Status</h3>
        
        {/* User Status */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <User size={16} className="text-blue-600" />
            <span className="text-sm">User:</span>
          </div>
          <div className="flex items-center space-x-2">
            {isAuthenticated && isUserTokenValid ? (
              <CheckCircle size={16} className="text-green-600" />
            ) : null}
            <span className={`text-sm font-medium ${isAuthenticated && isUserTokenValid ? 'text-green-600' : 'text-red-600'}`}>
              {isAuthenticated && isUserTokenValid ? 'Authenticated' : 'Not Authenticated'}
            </span>
            {isUserTokenExpiringSoon && (
              <AlertTriangle size={14} className="text-orange-500" />
            )}
          </div>
        </div>

        {/* Admin Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield size={16} className="text-purple-600" />
            <span className="text-sm">Admin:</span>
          </div>
          <div className="flex items-center space-x-2">
            {isAdminAuthenticated && isAdminTokenValid ? (
              <CheckCircle size={16} className="text-green-600" />
            ) : null}
            <span className={`text-sm font-medium ${isAdminAuthenticated && isAdminTokenValid ? 'text-green-600' : 'text-red-600'}`}>
              {isAdminAuthenticated && isAdminTokenValid ? 'Authenticated' : 'Not Authenticated'}
            </span>
            {isAdminTokenExpiringSoon && (
              <AlertTriangle size={14} className="text-orange-500" />
            )}
          </div>
        </div>
      </div>

      {/* User Authentication Section */}
      <div className="mb-6">
        <h3 className="font-semibold text-blue-600 mb-3 flex items-center">
          <User size={18} className="mr-2" />
          User Authentication
        </h3>
        
        {user ? (
          <div className="bg-blue-50 p-3 rounded-lg mb-3">
            <p className="text-sm"><strong>Name:</strong> {user.name}</p>
            <p className="text-sm"><strong>Email:</strong> {user.email}</p>
            <p className="text-sm"><strong>MDA:</strong> {user.mda.name}</p>
            <button
              onClick={logout}
              className="mt-2 flex items-center space-x-1 text-red-600 hover:text-red-800 text-sm"
            >
              <LogOut size={14} />
              <span>Logout User</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="email"
              placeholder="User Email"
              value={userCredentials.email}
              onChange={(e) => setUserCredentials(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <input
              type="password"
              placeholder="User Password"
              value={userCredentials.password}
              onChange={(e) => setUserCredentials(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <input
              type="text"
              placeholder="MDA ID"
              value={userCredentials.mdaId}
              onChange={(e) => setUserCredentials(prev => ({ ...prev, mdaId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <button
              onClick={handleUserLogin}
              className="w-full bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700"
            >
              Login as User
            </button>
          </div>
        )}
      </div>

      {/* Admin Authentication Section */}
      <div className="mb-6">
        <h3 className="font-semibold text-purple-600 mb-3 flex items-center">
          <Shield size={18} className="mr-2" />
          Admin Authentication
        </h3>
        
        {admin ? (
          <div className="bg-purple-50 p-3 rounded-lg mb-3">
            <p className="text-sm"><strong>Name:</strong> {admin.name}</p>
            <p className="text-sm"><strong>Email:</strong> {admin.email}</p>
            <p className="text-sm"><strong>Role:</strong> {admin.role}</p>
            <button
              onClick={adminLogout}
              className="mt-2 flex items-center space-x-1 text-red-600 hover:text-red-800 text-sm"
            >
              <LogOut size={14} />
              <span>Logout Admin</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="email"
              placeholder="Admin Email"
              value={adminCredentials.email}
              onChange={(e) => setAdminCredentials(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <input
              type="password"
              placeholder="Admin Password"
              value={adminCredentials.password}
              onChange={(e) => setAdminCredentials(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
            <button
              onClick={handleAdminLogin}
              className="w-full bg-purple-600 text-white py-2 rounded text-sm hover:bg-purple-700"
            >
              Login as Admin
            </button>
          </div>
        )}
      </div>

      {/* Logout All Button */}
      {(user || admin) && (
        <div className="mb-4">
          <button
            onClick={logoutAll}
            className="w-full bg-red-600 text-white py-2 rounded text-sm hover:bg-red-700 flex items-center justify-center space-x-2"
          >
            <LogOut size={16} />
            <span>Logout All Sessions</span>
          </button>
        </div>
      )}

      {/* Navigation Links */}
      <div className="border-t pt-4">
        <h4 className="font-semibold mb-2 text-sm">Quick Navigation</h4>
        <div className="grid grid-cols-2 gap-2">
          <a
            href="/dashboard"
            className="text-center bg-blue-100 text-blue-700 py-2 px-3 rounded text-sm hover:bg-blue-200"
          >
            User Dashboard
          </a>
          <a
            href="/admin/dashboard"
            className="text-center bg-purple-100 text-purple-700 py-2 px-3 rounded text-sm hover:bg-purple-200"
          >
            Admin Dashboard
          </a>
        </div>
      </div>

      {/* Token Expiration Warning */}
      {(isUserTokenExpiringSoon || isAdminTokenExpiringSoon) && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center space-x-2 text-orange-700">
            <Clock size={16} />
            <span className="text-sm font-medium">Token Expiration Warning</span>
          </div>
          <p className="text-sm text-orange-600 mt-1">
            {isUserTokenExpiringSoon && 'User token expires soon. '}
            {isAdminTokenExpiringSoon && 'Admin token expires soon. '}
            You may be automatically logged out.
          </p>
        </div>
      )}

      {/* Simultaneous Login Status */}
      {user && admin && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2 text-green-700">
            <CheckCircle size={16} />
            <span className="text-sm font-medium">Dual Authentication Active</span>
          </div>
          <p className="text-sm text-green-600 mt-1">
            You are simultaneously logged in as both user and admin! 🎉
          </p>
        </div>
      )}
    </div>
  );
};