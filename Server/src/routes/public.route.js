import express from "express";
import { loginUser, loginAdmin, getMDAs } from "../controller/auth.controller.js";
import { getAllMDAs } from "../controller/mda.controller.js";
import {
  validateUserLogin,
  validateAdminLogin,
} from "../middleware/validation.js";

const router = express.Router();


// @desc    Get all MDAs for login dropdown
// @route   GET /api/public/mdas
// @access  Public
router.get("/mdas", getMDAs);

// Health Check Route
// @desc    API health check
// @route   GET /api/public/health
// @access  Public
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});

// API Information Route
// @desc    Get API information
// @route   GET /api/public/info
// @access  Public
router.get("/info", (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: "MDA Management System API",
      version: "1.0.0",
      description: "API for managing Ministries, Departments, and Agencies",
      endpoints: {
        authentication: "/api/auth/*",
        mdas: "/api/public/mdas",
        health: "/api/public/health"
      }
    }
  });
});

export default router;