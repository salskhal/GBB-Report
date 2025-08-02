import adminService from '../service/adminService.js';

/**
 * Admin Management Controller
 * Handles HTTP requests for admin CRUD operations
 * Restricted to super admin access only
 */

/**
 * Get all admins with optional filtering and pagination
 * @route GET /api/admin/admins
 * @access Private (Super Admin only)
 */
export const getAllAdmins = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search = '',
      role = '',
      isActive = ''
    } = req.query;

    // Build filters
    const filters = {};
    if (role) filters.role = role;
    if (isActive !== '') filters.isActive = isActive === 'true';

    // Build options
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
      search
    };

    const result = await adminService.getAllAdmins(filters, options);

    res.status(200).json({
      success: true,
      message: 'Admins retrieved successfully',
      data: result.admins,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admins',
      error: error.message
    });
  }
};

/**
 * Get admin by ID
 * @route GET /api/admin/admins/:id
 * @access Private (Super Admin only)
 */
export const getAdminById = async (req, res) => {
  try {
    const admin = await adminService.getAdminById(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Admin retrieved successfully',
      data: admin
    });
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('Invalid admin ID')) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin',
      error: error.message
    });
  }
};

/**
 * Create new admin
 * @route POST /api/admin/admins
 * @access Private (Super Admin only)
 */
export const createAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Validate role if provided
    if (role && !['admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Only "admin" role can be assigned'
      });
    }

    // Get request info for activity logging
    const requestInfo = {
      ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
      userAgent: req.get('User-Agent') || 'Unknown'
    };

    const admin = await adminService.createAdmin(
      { name, email, password, role },
      req.admin,
      requestInfo
    );

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: admin
    });
  } catch (error) {
    // Handle specific error cases
    if (error.message.includes('Only super admin can create')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only super admin can create new admins'
      });
    }

    if (error.message.includes('already exists')) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    if (error.message.includes('Cannot create another super admin')) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create another super admin account'
      });
    }

    if (error.message.includes('required')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create admin',
      error: error.message
    });
  }
};

/**
 * Update admin
 * @route PUT /api/admin/admins/:id
 * @access Private (Super Admin only)
 */
export const updateAdmin = async (req, res) => {
  try {
    const { name, email, isActive } = req.body;
    const adminId = req.params.id;

    // Validate at least one field is provided
    if (!name && !email && isActive === undefined) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (name, email, or isActive) must be provided'
      });
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
      }
    }

    // Get request info for activity logging
    const requestInfo = {
      ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
      userAgent: req.get('User-Agent') || 'Unknown'
    };

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (isActive !== undefined) updateData.isActive = isActive;

    const admin = await adminService.updateAdmin(
      adminId,
      updateData,
      req.admin,
      requestInfo
    );

    res.status(200).json({
      success: true,
      message: 'Admin updated successfully',
      data: admin
    });
  } catch (error) {
    // Handle specific error cases
    if (error.message.includes('Only super admin can update')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only super admin can update admins'
      });
    }

    if (error.message.includes('not found') || error.message.includes('Invalid admin ID')) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    if (error.message.includes('Cannot update super admin')) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update super admin account'
      });
    }

    if (error.message.includes('already exists')) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this email already exists'
      });
    }

    if (error.message.includes('Cannot promote admin to super admin')) {
      return res.status(400).json({
        success: false,
        message: 'Cannot promote admin to super admin role'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update admin',
      error: error.message
    });
  }
};

/**
 * Delete admin
 * @route DELETE /api/admin/admins/:id
 * @access Private (Super Admin only)
 */
export const deleteAdmin = async (req, res) => {
  try {
    const adminId = req.params.id;

    // Get request info for activity logging
    const requestInfo = {
      ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
      userAgent: req.get('User-Agent') || 'Unknown'
    };

    const result = await adminService.deleteAdmin(
      adminId,
      req.admin,
      requestInfo
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.deletedAdmin
    });
  } catch (error) {
    // Handle specific error cases
    if (error.message.includes('Only super admin can delete')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only super admin can delete admins'
      });
    }

    if (error.message.includes('not found') || error.message.includes('Invalid admin ID')) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    if (error.message.includes('cannot be deleted')) {
      return res.status(400).json({
        success: false,
        message: 'This admin account cannot be deleted'
      });
    }

    if (error.message.includes('Cannot delete your own account')) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete admin',
      error: error.message
    });
  }
};

/**
 * Reset admin password
 * @route PUT /api/admin/admins/:id/reset-password
 * @access Private (Super Admin only)
 */
export const resetAdminPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const adminId = req.params.id;

    // Validate input
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password is required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Get request info for activity logging
    const requestInfo = {
      ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
      userAgent: req.get('User-Agent') || 'Unknown'
    };

    const result = await adminService.resetAdminPassword(
      adminId,
      newPassword,
      req.admin,
      requestInfo
    );

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    // Handle specific error cases
    if (error.message.includes('Only super admin can reset')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only super admin can reset admin passwords'
      });
    }

    if (error.message.includes('not found') || error.message.includes('Invalid admin ID')) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    if (error.message.includes('Cannot reset super admin password')) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reset super admin password'
      });
    }

    if (error.message.includes('Password must be at least')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to reset admin password',
      error: error.message
    });
  }
};

// Default export for backward compatibility
export default {
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  resetAdminPassword
};