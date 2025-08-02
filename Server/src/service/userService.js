import User from '../models/User.js';
import MDA from '../models/MDA.js';

// Get all users
export const getAllUsers = async () => {
  try {
    return await User.find()
      .populate('mdaId', 'name reports')
      .select('-password');
  } catch (error) {
    throw error;
  }
};

// Get user by ID
export const getUserById = async (userId) => {
  try {
    const user = await User.findById(userId)
      .populate('mdaId', 'name reports')
      .select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  } catch (error) {
    throw error;
  }
};

// Create new user
export const createUser = async (userData) => {
  try {
    // Check if MDA exists
    const mda = await MDA.findById(userData.mdaId);
    if (!mda) {
      throw new Error('MDA not found');
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const user = new User(userData);
    await user.save();

    return await User.findById(user._id)
      .populate('mdaId', 'name reports')
      .select('-password');
  } catch (error) {
    throw error;
  }
};

// Update user
export const updateUser = async (userId, updateData) => {
  try {
    // If updating MDA, check if it exists
    if (updateData.mdaId) {
      const mda = await MDA.findById(updateData.mdaId);
      if (!mda) {
        throw new Error('MDA not found');
      }
    }

    // If updating email, check for duplicates
    if (updateData.email) {
      const existingUser = await User.findOne({
        email: updateData.email,
        _id: { $ne: userId }
      });
      if (existingUser) {
        throw new Error('Email already registered');
      }
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).populate('mdaId', 'name reports').select('-password');

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    throw error;
  }
};

// Delete user (hard delete)
export const deleteUser = async (userId) => {
  try {
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      throw new Error('User not found');
    }

    return { message: 'User deleted successfully' };
  } catch (error) {
    throw error;
  }
};

// Default export object for backward compatibility
export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};