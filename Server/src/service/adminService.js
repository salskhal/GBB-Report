import Admin from '../models/Admin.js';
import Activity from '../models/Activity.js';
import User from '../models/User.js';
import MDA from '../models/MDA.js';
import mongoose from 'mongoose';

/**
 * Admin Management Service
 * Provides CRUD operations for admin management with role-based access control
 * and comprehensive activity logging
 */

/**
 * Get all admins with optional filtering
 * @param {Object} filters - Optional filters for admin search
 * @param {Object} options - Pagination and sorting options
 * @returns {Object} - Paginated admin list
 */
export const getAllAdmins = async (filters = {}, options = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search = ''
    } = options;

    // Build query
    const query = { ...filters };
    
    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Execute query with population
    const admins = await Admin.find(query)
      .populate('createdBy', 'name email')
      .select('-password')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Admin.countDocuments(query);

    return {
      admins,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    };
  } catch (error) {
    throw new Error(`Failed to retrieve admins: ${error.message}`);
  }
};

/**
 * Get admin by ID
 * @param {string} adminId - Admin ID
 * @returns {Object} - Admin object
 */
export const getAdminById = async (adminId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      throw new Error('Invalid admin ID format');
    }

    const admin = await Admin.findById(adminId)
      .populate('createdBy', 'name email')
      .select('-password');

    if (!admin) {
      throw new Error('Admin not found');
    }

    return admin;
  } catch (error) {
    throw new Error(`Failed to retrieve admin: ${error.message}`);
  }
};

/**
 * Create new admin (super admin only)
 * @param {Object} adminData - Admin data
 * @param {Object} createdBy - Admin creating the new admin
 * @param {Object} requestInfo - Request information for activity logging
 * @returns {Object} - Created admin
 */
export const createAdmin = async (adminData, createdBy, requestInfo) => {
  try {
    // Validate that only super admin can create admins
    if (createdBy.role !== 'superadmin') {
      throw new Error('Only super admin can create new admins');
    }

    // Validate required fields
    const { name, email, password, role = 'admin' } = adminData;
    
    if (!name || !email || !password) {
      throw new Error('Name, email, and password are required');
    }

    // Validate role assignment
    if (role === 'superadmin') {
      throw new Error('Cannot create another super admin');
    }

    // Check if admin with email already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      throw new Error('Admin with this email already exists');
    }

    // Create new admin
    const newAdmin = new Admin({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      createdBy: createdBy.id,
      isActive: true
    });

    await newAdmin.save();

    // Log activity
    await Activity.logActivity({
      adminId: createdBy.id,
      adminName: createdBy.name,
      action: 'CREATE',
      resourceType: 'ADMIN',
      resourceId: newAdmin._id.toString(),
      resourceName: newAdmin.name,
      details: {
        email: newAdmin.email,
        role: newAdmin.role
      },
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent
    });

    // Return admin without password
    const createdAdmin = await Admin.findById(newAdmin._id)
      .populate('createdBy', 'name email')
      .select('-password');

    return createdAdmin;
  } catch (error) {
    throw new Error(`Failed to create admin: ${error.message}`);
  }
};

/**
 * Update admin (super admin only)
 * @param {string} adminId - Admin ID to update
 * @param {Object} updateData - Data to update
 * @param {Object} updatedBy - Admin performing the update
 * @param {Object} requestInfo - Request information for activity logging
 * @returns {Object} - Updated admin
 */
export const updateAdmin = async (adminId, updateData, updatedBy, requestInfo) => {
  try {
    // Validate that only super admin can update admins
    if (updatedBy.role !== 'superadmin') {
      throw new Error('Only super admin can update admins');
    }

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      throw new Error('Invalid admin ID format');
    }

    // Find the admin to update
    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    // Prevent updating super admin role or making another super admin
    if (admin.role === 'superadmin') {
      throw new Error('Cannot update super admin account');
    }

    if (updateData.role === 'superadmin') {
      throw new Error('Cannot promote admin to super admin');
    }

    // Validate email uniqueness if email is being updated
    if (updateData.email && updateData.email !== admin.email) {
      const existingAdmin = await Admin.findOne({ 
        email: updateData.email.toLowerCase().trim(),
        _id: { $ne: adminId }
      });
      if (existingAdmin) {
        throw new Error('Admin with this email already exists');
      }
    }

    // Prepare update data
    const allowedUpdates = ['name', 'email', 'isActive'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        updates[field] = field === 'email' ? 
          updateData[field].toLowerCase().trim() : 
          updateData[field];
      }
    });

    // Update admin
    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email').select('-password');

    // Log activity
    await Activity.logActivity({
      adminId: updatedBy.id,
      adminName: updatedBy.name,
      action: 'UPDATE',
      resourceType: 'ADMIN',
      resourceId: adminId,
      resourceName: updatedAdmin.name,
      details: {
        updatedFields: Object.keys(updates),
        changes: updates
      },
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent
    });

    return updatedAdmin;
  } catch (error) {
    throw new Error(`Failed to update admin: ${error.message}`);
  }
};

/**
 * Delete admin (super admin only)
 * @param {string} adminId - Admin ID to delete
 * @param {Object} deletedBy - Admin performing the deletion
 * @param {Object} requestInfo - Request information for activity logging
 * @returns {Object} - Deletion confirmation
 */
export const deleteAdmin = async (adminId, deletedBy, requestInfo) => {
  try {
    // Validate that only super admin can delete admins
    if (deletedBy.role !== 'superadmin') {
      throw new Error('Only super admin can delete admins');
    }

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      throw new Error('Invalid admin ID format');
    }

    // Find the admin to delete
    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    // Prevent deletion of super admin or non-deletable admins
    if (admin.role === 'superadmin' || !admin.canBeDeleted) {
      throw new Error('This admin account cannot be deleted');
    }

    // Prevent self-deletion
    if (adminId === deletedBy.id) {
      throw new Error('Cannot delete your own account');
    }

    // Store admin info for logging before deletion
    const adminInfo = {
      name: admin.name,
      email: admin.email,
      role: admin.role
    };

    // Delete the admin
    await Admin.findByIdAndDelete(adminId);

    // Log activity
    await Activity.logActivity({
      adminId: deletedBy.id,
      adminName: deletedBy.name,
      action: 'DELETE',
      resourceType: 'ADMIN',
      resourceId: adminId,
      resourceName: adminInfo.name,
      details: {
        deletedAdmin: adminInfo
      },
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent
    });

    return {
      message: 'Admin deleted successfully',
      deletedAdmin: adminInfo
    };
  } catch (error) {
    throw new Error(`Failed to delete admin: ${error.message}`);
  }
};

/**
 * Reset admin password (super admin only)
 * @param {string} adminId - Admin ID
 * @param {string} newPassword - New password
 * @param {Object} resetBy - Admin performing the reset
 * @param {Object} requestInfo - Request information for activity logging
 * @returns {Object} - Reset confirmation
 */
export const resetAdminPassword = async (adminId, newPassword, resetBy, requestInfo) => {
  try {
    // Validate that only super admin can reset passwords
    if (resetBy.role !== 'superadmin') {
      throw new Error('Only super admin can reset admin passwords');
    }

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      throw new Error('Invalid admin ID format');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Find the admin
    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }

    // Prevent resetting super admin password
    if (admin.role === 'superadmin') {
      throw new Error('Cannot reset super admin password');
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    // Log activity
    await Activity.logActivity({
      adminId: resetBy.id,
      adminName: resetBy.name,
      action: 'UPDATE',
      resourceType: 'ADMIN',
      resourceId: adminId,
      resourceName: admin.name,
      details: {
        action: 'password_reset'
      },
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent
    });

    return {
      message: 'Admin password reset successfully'
    };
  } catch (error) {
    throw new Error(`Failed to reset admin password: ${error.message}`);
  }
};

/**
 * Validate admin permissions for operations
 * @param {Object} admin - Admin performing the operation
 * @param {string} operation - Operation being performed
 * @returns {boolean} - Permission validation result
 */
export const validateAdminPermissions = (admin, operation) => {
  const superAdminOperations = [
    'create_admin',
    'update_admin', 
    'delete_admin',
    'reset_admin_password',
    'view_activity_logs'
  ];

  if (superAdminOperations.includes(operation)) {
    return admin.role === 'superadmin';
  }

  return true; // Regular admin operations
};

/**
 * Export user data with MDA associations
 * @param {Object} filters - Export filters
 * @param {string} format - Export format ('json' or 'csv')
 * @returns {Object} Export data with filename
 */
export const exportUserData = async (filters = {}, format = 'json') => {
  try {
    // Build query based on filters
    const query = {};
    
    if (filters.mdaId) {
      query.mdaId = filters.mdaId;
    }
    
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }
    
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.createdAt.$lte = new Date(filters.endDate);
      }
    }

    // Get users with MDA associations
    const users = await User.find(query)
      .populate('mdaId', 'name reports isActive createdAt updatedAt')
      .select('-password')
      .sort({ createdAt: -1 });

    // Transform data for export
    const exportData = users.map(user => ({
      userId: user._id,
      username: user.username,
      name: user.name,
      contactEmail: user.contactEmail,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      userCreatedAt: user.createdAt,
      userUpdatedAt: user.updatedAt,
      mdaId: user.mdaId?._id,
      mdaName: user.mdaId?.name,
      mdaIsActive: user.mdaId?.isActive,
      mdaCreatedAt: user.mdaId?.createdAt,
      mdaUpdatedAt: user.mdaId?.updatedAt,
      mdaReportsCount: user.mdaId?.reports?.length || 0,
      mdaActiveReportsCount: user.mdaId?.reports?.filter(r => r.isActive).length || 0,
      mdaReports: user.mdaId?.reports?.map(r => ({
        title: r.title,
        url: r.url,
        isActive: r.isActive
      })) || []
    }));

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `user-data-export-${timestamp}.${format}`;

    if (format.toLowerCase() === 'csv') {
      // Convert to CSV
      const csvHeaders = [
        'User ID', 'Username', 'Name', 'Contact Email', 'Role', 'Is Active', 
        'Last Login', 'User Created', 'User Updated', 'MDA ID', 'MDA Name', 
        'MDA Active', 'MDA Created', 'MDA Updated', 'Reports Count', 
        'Active Reports Count', 'Reports'
      ];

      const csvRows = exportData.map(user => [
        user.userId,
        user.username,
        user.name,
        user.contactEmail,
        user.role,
        user.isActive,
        user.lastLogin || '',
        user.userCreatedAt,
        user.userUpdatedAt,
        user.mdaId || '',
        user.mdaName || '',
        user.mdaIsActive || '',
        user.mdaCreatedAt || '',
        user.mdaUpdatedAt || '',
        user.mdaReportsCount,
        user.mdaActiveReportsCount,
        JSON.stringify(user.mdaReports)
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => 
          typeof field === 'string' && field.includes(',') 
            ? `"${field.replace(/"/g, '""')}"` 
            : field
        ).join(','))
      ].join('\n');

      return { data: csvContent, filename };
    }

    return { data: exportData, filename };
  } catch (error) {
    throw new Error(`Failed to export user data: ${error.message}`);
  }
};

/**
 * Export MDA data with user associations
 * @param {Object} filters - Export filters
 * @param {string} format - Export format ('json' or 'csv')
 * @returns {Object} Export data with filename
 */
export const exportMDAData = async (filters = {}, format = 'json') => {
  try {
    // Build query based on filters
    const query = {};
    
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }
    
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.createdAt.$lte = new Date(filters.endDate);
      }
    }

    // Get MDAs
    const mdas = await MDA.find(query).sort({ createdAt: -1 });

    // Get user counts for each MDA
    const exportData = await Promise.all(mdas.map(async (mda) => {
      const users = await User.find({ mdaId: mda._id })
        .select('_id username name contactEmail isActive lastLogin createdAt')
        .sort({ createdAt: -1 });

      const activeUsers = users.filter(user => user.isActive);
      const inactiveUsers = users.filter(user => !user.isActive);

      return {
        mdaId: mda._id,
        mdaName: mda.name,
        mdaIsActive: mda.isActive,
        mdaCreatedAt: mda.createdAt,
        mdaUpdatedAt: mda.updatedAt,
        reportsCount: mda.reports.length,
        activeReportsCount: mda.reports.filter(r => r.isActive).length,
        inactiveReportsCount: mda.reports.filter(r => !r.isActive).length,
        reports: mda.reports.map(r => ({
          title: r.title,
          url: r.url,
          isActive: r.isActive
        })),
        totalUsersCount: users.length,
        activeUsersCount: activeUsers.length,
        inactiveUsersCount: inactiveUsers.length,
        users: users.map(user => ({
          userId: user._id,
          username: user.username,
          name: user.name,
          contactEmail: user.contactEmail,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }))
      };
    }));

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `mda-data-export-${timestamp}.${format}`;

    if (format.toLowerCase() === 'csv') {
      // Convert to CSV
      const csvHeaders = [
        'MDA ID', 'MDA Name', 'MDA Active', 'MDA Created', 'MDA Updated',
        'Reports Count', 'Active Reports', 'Inactive Reports', 'Reports',
        'Total Users', 'Active Users', 'Inactive Users', 'Users'
      ];

      const csvRows = exportData.map(mda => [
        mda.mdaId,
        mda.mdaName,
        mda.mdaIsActive,
        mda.mdaCreatedAt,
        mda.mdaUpdatedAt,
        mda.reportsCount,
        mda.activeReportsCount,
        mda.inactiveReportsCount,
        JSON.stringify(mda.reports),
        mda.totalUsersCount,
        mda.activeUsersCount,
        mda.inactiveUsersCount,
        JSON.stringify(mda.users)
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => 
          typeof field === 'string' && field.includes(',') 
            ? `"${field.replace(/"/g, '""')}"` 
            : field
        ).join(','))
      ].join('\n');

      return { data: csvContent, filename };
    }

    return { data: exportData, filename };
  } catch (error) {
    throw new Error(`Failed to export MDA data: ${error.message}`);
  }
};

/**
 * Export combined user and MDA data
 * @param {Object} filters - Export filters
 * @param {string} format - Export format ('json' or 'csv')
 * @returns {Object} Export data with filename
 */
export const exportCombinedData = async (filters = {}, format = 'json') => {
  try {
    const [userData, mdaData] = await Promise.all([
      exportUserData(filters, 'json'),
      exportMDAData(filters, 'json')
    ]);

    const combinedData = {
      exportInfo: {
        timestamp: new Date().toISOString(),
        filters: filters,
        totalUsers: userData.data.length,
        totalMDAs: mdaData.data.length
      },
      users: userData.data,
      mdas: mdaData.data
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `combined-data-export-${timestamp}.${format}`;

    if (format.toLowerCase() === 'csv') {
      // For CSV, create separate sections
      const userCsv = await exportUserData(filters, 'csv');
      const mdaCsv = await exportMDAData(filters, 'csv');
      
      const csvContent = [
        '=== USER DATA ===',
        userCsv.data,
        '',
        '=== MDA DATA ===',
        mdaCsv.data
      ].join('\n');

      return { data: csvContent, filename };
    }

    return { data: combinedData, filename };
  } catch (error) {
    throw new Error(`Failed to export combined data: ${error.message}`);
  }
};

// Default export for backward compatibility
export default {
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  resetAdminPassword,
  validateAdminPermissions,
  exportUserData,
  exportMDAData,
  exportCombinedData
};