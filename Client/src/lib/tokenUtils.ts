// Token validation utilities
export interface DecodedToken {
  exp: number;
  iat: number;
  userId?: string;
  adminId?: string;
  role: string;
}

/**
 * Decode JWT token without verification (client-side only for expiration check)
 */
export const decodeToken = (token: string): DecodedToken | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded) return true;
  
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

/**
 * Get token expiration time in milliseconds
 */
export const getTokenExpirationTime = (token: string): number | null => {
  const decoded = decodeToken(token);
  if (!decoded) return null;
  
  return decoded.exp * 1000;
};

/**
 * Check if token expires within the next X minutes
 */
export const isTokenExpiringSoon = (token: string, minutesThreshold: number = 5): boolean => {
  const decoded = decodeToken(token);
  if (!decoded) return true;
  
  const currentTime = Date.now() / 1000;
  const thresholdTime = currentTime + (minutesThreshold * 60);
  
  return decoded.exp < thresholdTime;
};