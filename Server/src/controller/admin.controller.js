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

/**
 * Export user data with MDA associations
 * @route GET /api/admin/export/users
 * @access Private (Admin only)
 */
export const exportUserData = async (req, res) => {
  try {
    const {
      mdaId,
      isActive,
      startDate,
      endDate,
      format = 'json'
    } = req.query;

    // Validate format parameter
    if (!['json', 'csv'].includes(format.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid format. Supported formats: json, csv'
      });
    }

    // Validate date parameters
    if (startDate && isNaN(Date.parse(startDate))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start date format. Use ISO date string.'
      });
    }

    if (endDate && isNaN(Date.parse(endDate))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid end date format. Use ISO date string.'
      });
    }

    const filters = {
      mdaId,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      startDate,
      endDate
    };

    const exportData = await adminService.exportUserData(filters, format);

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
        message: 'User data exported successfully',
        filename: exportData.filename,
        data: exportData.data
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to export user data',
      error: error.message
    });
  }
};

/**
 * Export MDA data with user associations
 * @route GET /api/admin/export/mdas
 * @access Private (Admin only)
 */
export const exportMDAData = async (req, res) => {
  try {
    const {
      isActive,
      startDate,
      endDate,
      format = 'json'
    } = req.query;

    // Validate format parameter
    if (!['json', 'csv'].includes(format.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid format. Supported formats: json, csv'
      });
    }

    // Validate date parameters
    if (startDate && isNaN(Date.parse(startDate))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start date format. Use ISO date string.'
      });
    }

    if (endDate && isNaN(Date.parse(endDate))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid end date format. Use ISO date string.'
      });
    }

    const filters = {
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      startDate,
      endDate
    };

    const exportData = await adminService.exportMDAData(filters, format);

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
        message: 'MDA data exported successfully',
        filename: exportData.filename,
        data: exportData.data
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to export MDA data',
      error: error.message
    });
  }
};

/**
 * Export combined user and MDA data
 * @route GET /api/admin/export/combined
 * @access Private (Admin only)
 */
export const exportCombinedData = async (req, res) => {
  try {
    const {
      mdaId,
      isActive,
      startDate,
      endDate,
      format = 'json'
    } = req.query;

    // Validate format parameter
    if (!['json', 'csv'].includes(format.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid format. Supported formats: json, csv'
      });
    }

    // Validate date parameters
    if (startDate && isNaN(Date.parse(startDate))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid start date format. Use ISO date string.'
      });
    }

    if (endDate && isNaN(Date.parse(endDate))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid end date format. Use ISO date string.'
      });
    }

    const filters = {
      mdaId,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      startDate,
      endDate
    };

    const exportData = await adminService.exportCombinedData(filters, format);

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
        message: 'Combined data exported successfully',
        filename: exportData.filename,
        data: exportData.data
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to export combined data',
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
  resetAdminPassword,
  exportUserData,
  exportMDAData,
  exportCombinedData
};