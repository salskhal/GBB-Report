import Admin from '../models/Admin.js';
import Activity from '../models/Activity.js';
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

// Default export for backward compatibility
export default {
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  resetAdminPassword,
  validateAdminPermissions
};