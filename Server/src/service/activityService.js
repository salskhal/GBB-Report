import Activity from "../models/Activity.js";
import mongoose from "mongoose";

/**
 * Activity Service
 * Handles logging and retrieving admin activities for audit purposes
 */
class ActivityService {
  /**
   * Log an admin activity
   * @param {Object} activityData - Activity data to log
   * @param {string} activityData.adminId - Admin ID performing the action
   * @param {string} activityData.adminName - Admin name performing the action
   * @param {string} activityData.action - Action performed (CREATE, UPDATE, DELETE, LOGIN, LOGOUT)
   * @param {string} activityData.resourceType - Type of resource affected (USER, MDA, ADMIN)
   * @param {string} activityData.resourceId - ID of the affected resource (optional for LOGIN/LOGOUT)
   * @param {string} activityData.resourceName - Name of the affected resource (optional for LOGIN/LOGOUT)
   * @param {Object} activityData.details - Additional details about the action
   * @param {string} activityData.ipAddress - IP address of the admin
   * @param {string} activityData.userAgent - User agent of the admin's browser
   * @returns {Promise<Object|null>} Created activity or null if failed
   */
  async logActivity(activityData) {
    try {
      const activity = await Activity.logActivity(activityData);
      return activity;
    } catch (error) {
      console.error("ActivityService: Failed to log activity:", error);
      return null;
    }
  }

  /**
   * Retrieve activity logs with filtering and pagination
   * @param {Object} filters - Filter criteria
   * @param {string} filters.adminId - Filter by admin ID
   * @param {string} filters.action - Filter by action type
   * @param {string} filters.resourceType - Filter by resource type
   * @param {Date} filters.startDate - Filter by start date
   * @param {Date} filters.endDate - Filter by end date
   * @param {number} filters.page - Page number (default: 1)
   * @param {number} filters.limit - Items per page (default: 50, max: 100)
   * @returns {Promise<Object>} Paginated activity logs with metadata
   */
  async getActivityLogs(filters = {}) {
    try {
      const {
        adminId,
        action,
        resourceType,
        startDate,
        endDate,
        page = 1,
        limit = 50
      } = filters;

      // Validate and sanitize pagination parameters
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;

      // Build query filter
      const query = {};

      if (adminId) {
        // Validate ObjectId format
        if (mongoose.Types.ObjectId.isValid(adminId)) {
          query.adminId = new mongoose.Types.ObjectId(adminId);
        } else {
          throw new Error("Invalid admin ID format");
        }
      }

      if (action) {
        const validActions = ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT"];
        if (validActions.includes(action.toUpperCase())) {
          query.action = action.toUpperCase();
        } else {
          throw new Error("Invalid action type");
        }
      }

      if (resourceType) {
        const validResourceTypes = ["USER", "MDA", "ADMIN"];
        if (validResourceTypes.includes(resourceType.toUpperCase())) {
          query.resourceType = resourceType.toUpperCase();
        } else {
          throw new Error("Invalid resource type");
        }
      }

      // Date range filtering
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) {
          query.timestamp.$gte = new Date(startDate);
        }
        if (endDate) {
          query.timestamp.$lte = new Date(endDate);
        }
      }

      // Execute query with pagination
      const [activities, totalCount] = await Promise.all([
        Activity.find(query)
          .populate("adminId", "name email role")
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Activity.countDocuments(query)
      ]);

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limitNum);
      const hasNextPage = pageNum < totalPages;
      const hasPrevPage = pageNum > 1;

      return {
        activities,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          limit: limitNum,
          hasNextPage,
          hasPrevPage
        }
      };
    } catch (error) {
      console.error("ActivityService: Failed to retrieve activity logs:", error);
      throw error;
    }
  }

  /**
   * Export activity logs in various formats
   * @param {Object} filters - Filter criteria (same as getActivityLogs)
   * @param {string} format - Export format ('json' or 'csv')
   * @returns {Promise<Object>} Export data with format and content
   */
  async exportActivityLogs(filters = {}, format = 'json') {
    try {
      // Remove pagination for export (get all matching records)
      const { page, limit, ...exportFilters } = filters;
      
      // Get all activities without pagination
      const result = await this.getActivityLogs({
        ...exportFilters,
        page: 1,
        limit: 10000 // Large limit for export
      });

      const activities = result.activities;

      if (format.toLowerCase() === 'csv') {
        return this._formatAsCSV(activities);
      } else {
        return this._formatAsJSON(activities);
      }
    } catch (error) {
      console.error("ActivityService: Failed to export activity logs:", error);
      throw error;
    }
  }

  /**
   * Get activity statistics for dashboard
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Object>} Activity statistics
   */
  async getActivityStats(filters = {}) {
    try {
      const { startDate, endDate } = filters;
      
      // Build base query
      const query = {};
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) {
          query.timestamp.$gte = new Date(startDate);
        }
        if (endDate) {
          query.timestamp.$lte = new Date(endDate);
        }
      }

      // Aggregate statistics
      const [
        totalActivities,
        actionStats,
        resourceStats,
        adminStats
      ] = await Promise.all([
        Activity.countDocuments(query),
        Activity.aggregate([
          { $match: query },
          { $group: { _id: "$action", count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        Activity.aggregate([
          { $match: query },
          { $group: { _id: "$resourceType", count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        Activity.aggregate([
          { $match: query },
          { $group: { _id: { adminId: "$adminId", adminName: "$adminName" }, count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ])
      ]);

      return {
        totalActivities,
        actionBreakdown: actionStats,
        resourceBreakdown: resourceStats,
        topAdmins: adminStats.map(stat => ({
          adminId: stat._id.adminId,
          adminName: stat._id.adminName,
          activityCount: stat.count
        }))
      };
    } catch (error) {
      console.error("ActivityService: Failed to get activity stats:", error);
      throw error;
    }
  }

  /**
   * Format activities as JSON for export
   * @private
   */
  _formatAsJSON(activities) {
    return {
      format: 'json',
      filename: `activity_logs_${new Date().toISOString().split('T')[0]}.json`,
      data: activities.map(activity => ({
        timestamp: activity.timestamp,
        adminName: activity.adminName,
        adminEmail: activity.adminId?.email || 'N/A',
        action: activity.action,
        resourceType: activity.resourceType,
        resourceName: activity.resourceName || 'N/A',
        details: activity.details,
        ipAddress: activity.ipAddress,
        userAgent: activity.userAgent
      }))
    };
  }

  /**
   * Format activities as CSV for export
   * @private
   */
  _formatAsCSV(activities) {
    const headers = [
      'Timestamp',
      'Admin Name',
      'Admin Email',
      'Action',
      'Resource Type',
      'Resource Name',
      'Details',
      'IP Address',
      'User Agent'
    ];

    const csvRows = [headers.join(',')];

    activities.forEach(activity => {
      const row = [
        activity.timestamp,
        activity.adminName,
        activity.adminId?.email || 'N/A',
        activity.action,
        activity.resourceType,
        activity.resourceName || 'N/A',
        JSON.stringify(activity.details || {}),
        activity.ipAddress,
        `"${activity.userAgent}"` // Wrap in quotes to handle commas
      ];
      csvRows.push(row.join(','));
    });

    return {
      format: 'csv',
      filename: `activity_logs_${new Date().toISOString().split('T')[0]}.csv`,
      data: csvRows.join('\n')
    };
  }

  /**
   * Delete old activity logs (for maintenance)
   * @param {number} daysToKeep - Number of days to keep logs (default: 365)
   * @returns {Promise<Object>} Deletion result
   */
  async cleanupOldLogs(daysToKeep = 365) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await Activity.deleteMany({
        timestamp: { $lt: cutoffDate }
      });

      return {
        deletedCount: result.deletedCount,
        cutoffDate
      };
    } catch (error) {
      console.error("ActivityService: Failed to cleanup old logs:", error);
      throw error;
    }
  }
}

export default new ActivityService();