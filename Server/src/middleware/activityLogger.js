import Activity from '../models/Activity.js';

// Helper function to extract IP address
const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         '127.0.0.1';
};

// Helper function to extract user agent
const getUserAgent = (req) => {
  return req.get('User-Agent') || 'Unknown';
};

// Helper function to determine action type from HTTP method
const getActionFromMethod = (method) => {
  switch (method.toLowerCase()) {
    case 'post':
      return 'CREATE';
    case 'put':
    case 'patch':
      return 'UPDATE';
    case 'delete':
      return 'DELETE';
    default:
      return null; // Don't log GET requests
  }
};

// Helper function to determine resource type from URL
const getResourceTypeFromUrl = (url) => {
  if (url.includes('/users')) return 'USER';
  if (url.includes('/mdas')) return 'MDA';
  if (url.includes('/admins')) return 'ADMIN';
  return null;
};

// Helper function to extract resource ID from URL
const getResourceIdFromUrl = (url) => {
  // Extract ID from URLs like /admin/users/123 or /admin/mdas/456
  const matches = url.match(/\/([a-fA-F0-9]{24}|\d+)(?:\/|$)/);
  return matches ? matches[1] : null;
};

// Activity logging middleware
export const logActivity = (options = {}) => {
  return async (req, res, next) => {
    // Only log for admin operations and specific HTTP methods
    const action = getActionFromMethod(req.method);
    const resourceType = getResourceTypeFromUrl(req.originalUrl);
    
    console.log('Activity Logger Debug:', {
      method: req.method,
      url: req.originalUrl,
      action,
      resourceType,
      hasAdmin: !!req.admin,
      adminInfo: req.admin ? { id: req.admin.id, name: req.admin.name, role: req.admin.role } : null
    });
    
    // Skip logging if not a relevant operation
    if (!action || !resourceType) {
      console.log('Activity Logger: Skipping - no action or resource type');
      return next();
    }

    // Skip logging if admin info is not available
    if (!req.admin) {
      console.log('Activity Logger: No admin info available for', req.originalUrl);
      return next();
    }

    // Store original response methods to capture response data
    const originalSend = res.send;
    const originalJson = res.json;
    
    let responseData = null;
    let statusCode = null;

    // Override res.send to capture response
    res.send = function(data) {
      try {
        responseData = typeof data === 'string' ? JSON.parse(data) : data;
      } catch (e) {
        responseData = data;
      }
      statusCode = res.statusCode;
      
      // Log activity immediately after capturing response data
      setImmediate(async () => {
        await logActivityData();
      });
      
      return originalSend.call(this, data);
    };

    // Override res.json to capture response
    res.json = function(data) {
      responseData = data;
      statusCode = res.statusCode;
      
      // Log activity immediately after capturing response data
      setImmediate(async () => {
        await logActivityData();
      });
      
      return originalJson.call(this, data);
    };

    // Function to log activity data
    const logActivityData = async () => {
      try {
        console.log('Activity Logger: Processing response', {
          statusCode,
          responseData: responseData ? (typeof responseData === 'object' ? JSON.stringify(responseData).substring(0, 200) : responseData) : null
        });
        
        // Only log successful operations (2xx status codes)
        if (statusCode >= 200 && statusCode < 300) {
          const resourceId = getResourceIdFromUrl(req.originalUrl) || 
                           (responseData && typeof responseData === 'object' && responseData.data && (responseData.data._id || responseData.data.id));
          
          let resourceName = null;
          let details = {};

          // Extract resource name and details from request/response
          if (action === 'CREATE' && responseData && responseData.data) {
            resourceName = responseData.data.name || responseData.data.username || responseData.data.email || 'Unknown';
            details.created = responseData.data;
          } else if (action === 'UPDATE') {
            resourceName = req.body.name || req.body.username || req.body.email || 'Unknown';
            details.updated = req.body;
          } else if (action === 'DELETE') {
            resourceName = req.params.id || 'Unknown'; // Use ID as name for delete operations
            details.deleted = { id: req.params.id };
          }

          // Add request details
          details.method = req.method;
          details.url = req.originalUrl;
          details.timestamp = new Date();

          const activityData = {
            adminId: req.admin.id,
            adminName: req.admin.name,
            action,
            resourceType,
            resourceId: resourceId ? resourceId.toString() : null,
            resourceName,
            details,
            ipAddress: getClientIP(req),
            userAgent: getUserAgent(req)
          };

          console.log('Activity Logger: Attempting to log activity', activityData);

          // Log the activity
          const result = await Activity.logActivity(activityData);
          console.log('Activity Logger: Log result', result ? 'SUCCESS' : 'FAILED');
        } else {
          console.log('Activity Logger: Skipping - non-success status code:', statusCode);
        }
      } catch (error) {
        // Log error but don't affect the main request
        console.error('Activity logging failed:', error);
      }
    };

    // Continue with the request
    next();
  };
};

// Specific middleware for different resource types
export const logUserActivity = logActivity({ resourceType: 'USER' });
export const logMDAActivity = logActivity({ resourceType: 'MDA' });
export const logAdminActivity = logActivity({ resourceType: 'ADMIN' });

export default {
  logActivity,
  logUserActivity,
  logMDAActivity,
  logAdminActivity
};