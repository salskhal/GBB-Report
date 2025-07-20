import { useAuthStore } from '@/store/authStore';
import { useTokenValidation } from '@/hooks/useTokenValidation';
import { getTokenExpirationTime } from '@/lib/tokenUtils';

interface AuthStatusProps {
  showDetails?: boolean;
}

export const AuthStatus = ({ showDetails = false }: AuthStatusProps) => {
  const { 
    user, 
    admin, 
    userToken, 
    adminToken, 
    isAuthenticated, 
    isAdminAuthenticated,
    logout,
    adminLogout
  } = useAuthStore();

  const {
    isUserTokenValid,
    isAdminTokenValid,
    isUserTokenExpiringSoon,
    isAdminTokenExpiringSoon
  } = useTokenValidation();

  if (!showDetails) return null;

  const formatExpirationTime = (token: string | null) => {
    if (!token) return 'N/A';
    const expTime = getTokenExpirationTime(token);
    if (!expTime) return 'Invalid';
    return new Date(expTime).toLocaleString();
  };

  // const getTokenInfo = (token: string | null) => {
  //   if (!token) return null;
  //   return decodeToken(token);
  // };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md z-50">
      <h3 className="font-semibold text-gray-800 mb-3">Authentication Status</h3>
      
      {/* User Authentication */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-blue-600">User Authentication</h4>
          {user && (
            <button
              onClick={logout}
              className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200"
            >
              Logout User
            </button>
          )}
        </div>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={`font-medium ${isAuthenticated && isUserTokenValid ? 'text-green-600' : 'text-red-600'}`}>
              {isAuthenticated && isUserTokenValid ? 'Authenticated' : 'Not Authenticated'}
            </span>
          </div>
          {user && (
            <>
              <div className="flex justify-between">
                <span>User:</span>
                <span className="font-medium">{user.name}</span>
              </div>
              <div className="flex justify-between">
                <span>MDA:</span>
                <span className="font-medium">{user.mda.name}</span>
              </div>
            </>
          )}
          {userToken && (
            <>
              <div className="flex justify-between">
                <span>Token Valid:</span>
                <span className={`font-medium ${isUserTokenValid ? 'text-green-600' : 'text-red-600'}`}>
                  {isUserTokenValid ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Expires:</span>
                <span className={`text-xs ${isUserTokenExpiringSoon ? 'text-orange-600' : 'text-gray-600'}`}>
                  {formatExpirationTime(userToken)}
                </span>
              </div>
              {isUserTokenExpiringSoon && (
                <div className="text-xs text-orange-600 font-medium">
                  ⚠️ Token expiring soon!
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Admin Authentication */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-purple-600">Admin Authentication</h4>
          {admin && (
            <button
              onClick={adminLogout}
              className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200"
            >
              Logout Admin
            </button>
          )}
        </div>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span>Status:</span>
            <span className={`font-medium ${isAdminAuthenticated && isAdminTokenValid ? 'text-green-600' : 'text-red-600'}`}>
              {isAdminAuthenticated && isAdminTokenValid ? 'Authenticated' : 'Not Authenticated'}
            </span>
          </div>
          {admin && (
            <>
              <div className="flex justify-between">
                <span>Admin:</span>
                <span className="font-medium">{admin.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Role:</span>
                <span className="font-medium">{admin.role}</span>
              </div>
            </>
          )}
          {adminToken && (
            <>
              <div className="flex justify-between">
                <span>Token Valid:</span>
                <span className={`font-medium ${isAdminTokenValid ? 'text-green-600' : 'text-red-600'}`}>
                  {isAdminTokenValid ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Expires:</span>
                <span className={`text-xs ${isAdminTokenExpiringSoon ? 'text-orange-600' : 'text-gray-600'}`}>
                  {formatExpirationTime(adminToken)}
                </span>
              </div>
              {isAdminTokenExpiringSoon && (
                <div className="text-xs text-orange-600 font-medium">
                  ⚠️ Token expiring soon!
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-t pt-3">
        <div className="text-xs text-gray-500 mb-2">Quick Actions:</div>
        <div className="flex space-x-2">
          <a 
            href="/login" 
            className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200"
          >
            User Login
          </a>
          <a 
            href="/admin/login" 
            className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded hover:bg-purple-200"
          >
            Admin Login
          </a>
        </div>
      </div>
    </div>
  );
};