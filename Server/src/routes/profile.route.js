import express from "express";
import { authenticate, authorizeUser, checkUserStatus } from "../middleware/auth.js";
import { getUserProfile, changePassword } from "../controller/profile.controller.js";
import { validatePasswordChange } from "../middleware/validation.js";

const router = express.Router();

// Apply authentication and user authorization to all routes
router.use(authenticate);
router.use(authorizeUser);
router.use(checkUserStatus);

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private (User only)
router.get("/", getUserProfile);

// @desc    Change user password
// @route   PUT /api/profile/password
// @access  Private (User only)
router.put("/password", validatePasswordChange, changePassword);

export { router as profileRoutes };