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
export const loginUser = async (username, password) => {
  try {
    // Find user by username
    const user = await User.findOne({ username, isActive: true })
      .select('+password');

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Find MDA by reference
    const mda = await MDA.findOne({ name: user.mdaReference, isActive: true });
    if (!mda) {
      throw new Error('MDA not found or inactive');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token with username and MDA information
    const token = generateToken({
      userId: user._id,
      username: user.username,
      role: user.role,
      mdaReference: user.mdaReference
    });

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        contactEmail: user.contactEmail,
        role: user.role,
        mda: {
          name: mda.name,
          reports: mda.reports.filter(report => report.isActive)
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



// Default export object for backward compatibility
export default {
  generateToken,
  verifyToken,
  loginUser,
  loginAdmin
};