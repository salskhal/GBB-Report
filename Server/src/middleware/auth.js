import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Admin from "../models/Admin.js";

// Middleware to authenticate JWT token
export const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token.",
    });
  }
};

// Middleware to authorize user role
export const authorizeUser = (req, res, next) => {
  if (req.user.role !== "user") {
    return res.status(403).json({
      success: false,
      message: "Access denied. User role required.",
    });
  }
  next();
};

// Middleware to authorize admin role
export const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== "superadmin" && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin role required.",
    });
  }
  next();
};

// Middleware to authorize super admin role only
export const authorizeSuperAdmin = (req, res, next) => {
  if (req.user.role !== "superadmin") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Super admin role required.",
    });
  }
  next();
};

// Middleware to check if user is active
export const checkUserStatus = async (req, res, next) => {
  try {
    let user;

    if (req.user.role === "user") {
      user = await User.findById(req.user.userId);
    } else if (req.user.role === "superadmin" || req.user.role === "admin") {
      user = await Admin.findById(req.user.adminId);
      // Set req.admin for activity logging
      if (user) {
        req.admin = {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role
        };
      }
    }

    if (!user || !user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive.",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error during user status check.",
    });
  }
};

// Default export object for backward compatibility
export default {
  authenticate,
  authorizeUser,
  authorizeAdmin,
  authorizeSuperAdmin,
  checkUserStatus,
};
