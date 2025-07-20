import express from "express";
import { authenticate, authorizeAdmin, checkUserStatus } from "../middleware/auth.js";
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
  validateMDACreation, 
  validateUserCreation 
} from "../middleware/validation.js";

const router = express.Router();

// Apply authentication and admin authorization to all routes
router.use(authenticate);
router.use(authorizeAdmin);
router.use(checkUserStatus);

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
router.post("/mdas", validateMDACreation,  createNewMDA);

// @desc    Update MDA
// @route   PUT /api/admin/mdas/:id
// @access  Private (Admin only)
router.put("/mdas/:id", updateMDA);

// @desc    Delete MDA (soft delete)
// @route   DELETE /api/admin/mdas/:id
// @access  Private (Admin only)
router.delete("/mdas/:id", deleteMDA);

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
router.post("/users", validateUserCreation, createUser);

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private (Admin only)
router.put("/users/:id", updateUser);

// @desc    Delete user (soft delete)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
router.delete("/users/:id", deleteUser);

// @desc    Reset user password
// @route   PUT /api/admin/users/:id/reset-password
// @access  Private (Admin only)
router.put("/users/:id/reset-password", resetUserPassword);

export default router;