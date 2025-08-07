import express from "express";
import { loginUser, loginAdmin, logoutAdmin } from "../controller/auth.controller.js";
import {
  validateUserLogin,
  validateAdminLogin,
} from "../middleware/validation.js";
import { authenticate, checkUserStatus } from "../middleware/auth.js";
import { extractClientInfo } from "../controller/activity.controller.js";

const router = express.Router();

// @route   POST /api/auth/login
// @desc    User login
// @access  Public
router.post("/login", validateUserLogin, loginUser);

// @route   POST /api/auth/admin/login
// @desc    Admin login
// @access  Public
router.post("/admin/login", extractClientInfo, validateAdminLogin, loginAdmin);

// @route   POST /api/auth/admin/logout
// @desc    Admin logout
// @access  Private (Admin)
router.post("/admin/logout", authenticate, checkUserStatus, extractClientInfo, logoutAdmin);

export { router as authRoutes };