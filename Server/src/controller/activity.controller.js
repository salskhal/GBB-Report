import activityService from "../service/activityService.js";

/**
 * Activity Controller
 * Handles HTTP requests for activity logging and retrieval
 * All endpoints require super admin access
 */

/**
 * Get activity logs with filtering and pagination
 * GET /admin/activities
 * Query parameters:
 * - adminId: Filter by admin ID
 * - action: Filter by action type (CREATE, UPDATE, DELETE, LOGIN, LOGOUT)
 * - resourceType: Filter by resource type (USER, MDA, ADMIN)
 * - startDate: Filter by start date (ISO string)
 * - endDate: Filter by end date (ISO string)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 100)
 */
export const getActivityLogs = async (req, res) => {
  try {
    const {
      adminId,
      action,
      resourceType,
      startDate,
      endDate,
      page,
      limit
    } = req.query;

    // Validate date parameters
    if (startDate && isNaN(Date.parse(startDate))) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date format. Use ISO date string."
      });
    }

    if (endDate && isNaN(Date.parse(endDate))) {
      return res.status(400).json({
        success: false,
        message: "Invalid end date format. Use ISO date string."
      });
    }

    // Validate date range
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: "Start date cannot be after end date."
      });
    }

    const filters = {
      adminId,
      action,
      resourceType,
      startDate,
      endDate,
      page,
      limit
    };

    const result = await activityService.getActivityLogs(filters);

    res.status(200).json({
      success: true,
      message: "Activity logs retrieved successfully",
      data: result
    });
  } catch (error) {
    console.error("ActivityController: Error retrieving activity logs:", error);
    
    if (error.message.includes("Invalid")) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to retrieve activity logs"
    });
  }
};

/**
 * Export activity logs
 * GET /admin/activities/export
 * Query parameters: Same as getActivityLogs plus:
 * - format: Export format ('json' or 'csv', default: 'json')
 */
export const exportActivityLogs = async (req, res) => {
  try {
    const {
      adminId,
      action,
      resourceType,
      startDate,
      endDate,
      format = 'json'
    } = req.query;

    // Validate format parameter
    if (!['json', 'csv'].includes(format.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid format. Supported formats: json, csv"
      });
    }

    // Validate date parameters
    if (startDate && isNaN(Date.parse(startDate))) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date format. Use ISO date string."
      });
    }

    if (endDate && isNaN(Date.parse(endDate))) {
      return res.status(400).json({
        success: false,
        message: "Invalid end date format. Use ISO date string."
      });
    }

    const filters = {
      adminId,
      action,
      resourceType,
      startDate,
      endDate
    };

    const exportData = await activityService.exportActivityLogs(filters, format);

    // Set appropriate headers for file download
    const contentType = format.toLowerCase() === 'csv' 
      ? 'text/csv' 
      : 'application/json';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);

    if (format.toLowerCase() === 'csv') {
      res.status(200).send(exportData.data);
    } else {
      res.status(200).json({
        success: true,
        message: "Activity logs exported successfully",
        filename: exportData.filename,
        data: exportData.data
      });
    }
  } catch (error) {
    console.error("ActivityController: Error exporting activity logs:", error);
    
    if (error.message.includes("Invalid")) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to export activity logs"
    });
  }
};

/**
 * Get activity statistics
 * GET /admin/activities/stats
 * Query parameters:
 * - startDate: Filter by start date (ISO string)
 * - endDate: Filter by end date (ISO string)
 */
export const getActivityStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate date parameters
    if (startDate && isNaN(Date.parse(startDate))) {
      return res.status(400).json({
        success: false,
        message: "Invalid start date format. Use ISO date string."
      });
    }

    if (endDate && isNaN(Date.parse(endDate))) {
      return res.status(400).json({
        success: false,
        message: "Invalid end date format. Use ISO date string."
      });
    }

    const filters = { startDate, endDate };
    const stats = await activityService.getActivityStats(filters);

    res.status(200).json({
      success: true,
      message: "Activity statistics retrieved successfully",
      data: stats
    });
  } catch (error) {
    console.error("ActivityController: Error retrieving activity stats:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to retrieve activity statistics"
    });
  }
};

/**
 * Clean up old activity logs (maintenance endpoint)
 * DELETE /admin/activities/cleanup
 * Body parameters:
 * - daysToKeep: Number of days to keep logs (default: 365)
 */
export const cleanupOldLogs = async (req, res) => {
  try {
    const { daysToKeep = 365 } = req.body;

    // Validate daysToKeep parameter
    if (isNaN(daysToKeep) || daysToKeep < 1) {
      return res.status(400).json({
        success: false,
        message: "daysToKeep must be a positive number"
      });
    }

    // Prevent accidental deletion of recent logs
    if (daysToKeep < 30) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete logs newer than 30 days for safety"
      });
    }

    const result = await activityService.cleanupOldLogs(daysToKeep);

    res.status(200).json({
      success: true,
      message: `Successfully cleaned up old activity logs`,
      data: {
        deletedCount: result.deletedCount,
        cutoffDate: result.cutoffDate,
        daysKept: daysToKeep
      }
    });
  } catch (error) {
    console.error("ActivityController: Error cleaning up old logs:", error);
    
    res.status(500).json({
      success: false,
      message: "Failed to cleanup old activity logs"
    });
  }
};

/**
 * Middleware to extract client information for activity logging
 * This middleware should be used on routes that need to log activities
 */
export const extractClientInfo = (req, res, next) => {
  try {
    // Extract IP address (handle proxy scenarios)
    const ipAddress = req.ip || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress ||
                     (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                     req.headers['x-forwarded-for']?.split(',')[0] ||
                     req.headers['x-real-ip'] ||
                     '127.0.0.1';

    // Extract user agent
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // Add to request object for use in controllers
    req.clientInfo = {
      ipAddress: ipAddress.replace('::ffff:', ''), // Clean IPv4-mapped IPv6 addresses
      userAgent
    };

    next();
  } catch (error) {
    console.error("ActivityController: Error extracting client info:", error);
    // Don't fail the request, just set defaults
    req.clientInfo = {
      ipAddress: '127.0.0.1',
      userAgent: 'Unknown'
    };
    next();
  }
};

/**
 * Helper function to log activity from controllers
 * This can be called from other controllers to log activities
 */
export const logActivity = async (req, action, resourceType, resourceId, resourceName, details = {}) => {
  try {
    if (!req.admin) {
      console.warn("ActivityController: No admin information available for activity logging");
      return null;
    }

    if (!req.clientInfo) {
      console.warn("ActivityController: No client information available for activity logging");
      return null;
    }

    const activityData = {
      adminId: req.admin.id,
      adminName: req.admin.name,
      action: action.toUpperCase(),
      resourceType: resourceType.toUpperCase(),
      resourceId,
      resourceName,
      details,
      ipAddress: req.clientInfo.ipAddress,
      userAgent: req.clientInfo.userAgent
    };

    return await activityService.logActivity(activityData);
  } catch (error) {
    console.error("ActivityController: Error logging activity:", error);
    return null;
  }
};

export default {
  getActivityLogs,
  exportActivityLogs,
  getActivityStats,
  cleanupOldLogs,
  extractClientInfo,
  logActivity
};