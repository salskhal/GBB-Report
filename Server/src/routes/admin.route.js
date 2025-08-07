import express from "express";
import { authenticate, authorizeAdmin, authorizeSuperAdmin, checkUserStatus } from "../middleware/auth.js";
import {
  getAllMDAs,
  getMDA,
  createNewMDA,
  updateMDA,
  deleteMDA,
} from "../controller/mda.controller.js";

import {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
} from "../controller/user.controller.js";

import {
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  resetAdminPassword,
  exportUserData,
  exportMDAData,
  exportCombinedData,
} from "../controller/admin.controller.js";

import {
  getActivityLogs,
  exportActivityLogs,
  getActivityStats,
  cleanupOldLogs,
  extractClientInfo,
} from "../controller/activity.controller.js";

import { 
  validateMDACreation, 
  validateUserCreation 
} from "../middleware/validation.js";
import { logActivity } from "../middleware/activityLogger.js";

const router = express.Router();

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(authorizeAdmin);
router.use(checkUserStatus);
router.use(extractClientInfo); // Add client info extraction for activity logging

// MDA Management Routes
// @desc    Get all MDAs
// @route   GET /api/admin/mdas
// @access  Private (Admin only)
router.get("/mdas", getAllMDAs);

// @desc    Get single MDA by ID
// @route   GET /api/admin/mdas/:id
// @access  Private (Admin only)
router.get("/mdas/:id", getMDA);

// @desc    Create new MDA
// @route   POST /api/admin/mdas
// @access  Private (Admin only)
router.post("/mdas", validateMDACreation, logActivity(), createNewMDA);

// @desc    Update MDA
// @route   PUT /api/admin/mdas/:id
// @access  Private (Admin only)
router.put("/mdas/:id", logActivity(), updateMDA);

// @desc    Delete MDA (soft delete)
// @route   DELETE /api/admin/mdas/:id
// @access  Private (Admin only)
router.delete("/mdas/:id", logActivity(), deleteMDA);

// User Management Routes
// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
router.get("/users", getAllUsers);

// @desc    Get single user by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
router.get("/users/:id", getUser);

// @desc    Create new user
// @route   POST /api/admin/users
// @access  Private (Admin only)
router.post("/users", validateUserCreation, logActivity(), createUser);

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private (Admin only)
router.put("/users/:id", logActivity(), updateUser);

// @desc    Delete user (soft delete)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
router.delete("/users/:id", logActivity(), deleteUser);

// @desc    Reset user password
// @route   PUT /api/admin/users/:id/reset-password
// @access  Private (Admin only)
router.put("/users/:id/reset-password", logActivity(), resetUserPassword);

// Admin Management Routes (Super Admin Only)
// @desc    Get all admins
// @route   GET /api/admin/admins
// @access  Private (Super Admin only)
router.get("/admins", authorizeSuperAdmin, getAllAdmins);

// @desc    Get single admin by ID
// @route   GET /api/admin/admins/:id
// @access  Private (Super Admin only)
router.get("/admins/:id", authorizeSuperAdmin, getAdminById);

// @desc    Create new admin
// @route   POST /api/admin/admins
// @access  Private (Super Admin only)
router.post("/admins", authorizeSuperAdmin, logActivity(), createAdmin);

// @desc    Update admin
// @route   PUT /api/admin/admins/:id
// @access  Private (Super Admin only)
router.put("/admins/:id", authorizeSuperAdmin, logActivity(), updateAdmin);

// @desc    Delete admin
// @route   DELETE /api/admin/admins/:id
// @access  Private (Super Admin only)
router.delete("/admins/:id", authorizeSuperAdmin, logActivity(), deleteAdmin);


// @desc    Reset admin password
// @route   PUT /api/admin/admins/:id/reset-password
// @access  Private (Super Admin only)
router.put("/admins/:id/reset-password", authorizeSuperAdmin, logActivity(), resetAdminPassword);

// Activity Logging Routes (Super Admin Only)
// @desc    Get activity logs with filtering and pagination
// @route   GET /api/admin/activities
// @access  Private (Super Admin only)
router.get("/activities", authorizeSuperAdmin, getActivityLogs);

// @desc    Export activity logs
// @route   GET /api/admin/activities/export
// @access  Private (Super Admin only)
router.get("/activities/export", authorizeSuperAdmin, exportActivityLogs);

// @desc    Get activity statistics
// @route   GET /api/admin/activities/stats
// @access  Private (Super Admin only)
router.get("/activities/stats", authorizeSuperAdmin, getActivityStats);

// @desc    Clean up old activity logs
// @route   DELETE /api/admin/activities/cleanup
// @access  Private (Super Admin only)
router.delete("/activities/cleanup", authorizeSuperAdmin, cleanupOldLogs);

// Data Export Routes (Admin only)
// @desc    Export user data with MDA associations
// @route   GET /api/admin/export/users
// @access  Private (Admin only)
router.get("/export/users", exportUserData);

// @desc    Export MDA data with user associations
// @route   GET /api/admin/export/mdas
// @access  Private (Admin only)
router.get("/export/mdas", exportMDAData);

// @desc    Export combined user and MDA data
// @route   GET /api/admin/export/combined
// @access  Private (Admin only)
router.get("/export/combined", exportCombinedData);

export default router;