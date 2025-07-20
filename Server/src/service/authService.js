import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import MDA from '../models/MDA.js';

// Generate JWT token
export const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Verify JWT token
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// User login
export const loginUser = async (email, password, mdaId) => {
  try {
    // Find user by email and populate MDA
    const user = await User.findOne({ email, isActive: true })
      .select('+password')
      .populate('mdaId');

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user belongs to the selected MDA
    if (user.mdaId._id.toString() !== mdaId) {
      throw new Error('User not authorized for selected MDA');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken({
      userId: user._id,
      email: user.email,
      role: user.role,
      mdaId: user.mdaId._id
    });

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        // mdaId: user.mdaId._id
        mda: {
          id: user.mdaId._id,
          name: user.mdaId.name,
          reportUrl: user.mdaId.reportUrl
        }
      }
    };
  } catch (error) {
    throw error;
  }
};

// Admin login
export const loginAdmin = async (email, password) => {
  try {
    // Find admin by email
    const admin = await Admin.findOne({ email, isActive: true })
      .select('+password');

    if (!admin) {
      throw new Error('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate token
    const token = generateToken({
      adminId: admin._id,
      email: admin.email,
      role: admin.role
    });

    return {
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    };
  } catch (error) {
    throw error;
  }
};

// Get all MDAs for login dropdown
export const getMDAs = async () => {
  try {
    return await MDA.find({ isActive: true }).select('name');
  } catch (error) {
    throw error;
  }
};

// Default export object for backward compatibility
export default {
  generateToken,
  verifyToken,
  loginUser,
  loginAdmin,
  getMDAs
};