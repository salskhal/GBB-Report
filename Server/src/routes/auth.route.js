import express from "express";
import { loginUser, loginAdmin, getMDAs } from "../controller/auth.controller.js";
import {
  validateUserLogin,
  validateAdminLogin,
} from "../middleware/validation.js";

const router = express.Router();

// @route   POST /api/auth/login
// @desc    User login
// @access  Public
router.post("/login", validateUserLogin, loginUser);

// @route   POST /api/auth/admin/login
// @desc    Admin login
// @access  Public
router.post("/admin/login", validateAdminLogin, loginAdmin);

// @route   GET /api/auth/mdas
// @desc    Get all MDAs for login dropdown
// @access  Public
router.get("/mdas", getMDAs);

export { router as authRoutes };