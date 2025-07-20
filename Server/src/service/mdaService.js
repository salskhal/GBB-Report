import MDA from '../models/MDA.js';
import User from '../models/User.js';

// Get all MDAs
export const getAllMDAs = async () => {
  try {
    return await MDA.find();
  } catch (error) {
    throw error;
  }
};

// Get MDA by ID
export const getMDAById = async (mdaId) => {
  try {
    const mda = await MDA.findById(mdaId);
    if (!mda) {
      throw new Error('MDA not found');
    }
    return mda;
  } catch (error) {
    throw error;
  }
};

// Create new MDA
export const createMDA = async (mdaData) => {
  try {
    // Check if MDA name already exists
    const existingMDA = await MDA.findOne({ name: mdaData.name });
    if (existingMDA) {
      throw new Error('MDA name already exists');
    }

    const mda = new MDA(mdaData);
    await mda.save();
    return mda;
  } catch (error) {
    throw error;
  }
};

// Update MDA
export const updateMDA = async (mdaId, updateData) => {
  try {
    // If updating name, check for duplicates
    if (updateData.name) {
      const existingMDA = await MDA.findOne({
        name: updateData.name,
        _id: { $ne: mdaId }
      });
      if (existingMDA) {
        throw new Error('MDA name already exists');
      }
    }

    const mda = await MDA.findByIdAndUpdate(
      mdaId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!mda) {
      throw new Error('MDA not found');
    }

    return mda;
  } catch (error) {
    throw error;
  }
};

// Delete MDA (hard delete)
export const deleteMDA = async (mdaId) => {
  try {
    // Check if MDA has users assigned
    const usersCount = await User.countDocuments({ mdaId });
    if (usersCount > 0) {
      throw new Error('Cannot delete MDA with active users. Please reassign users first.');
    }

    const mda = await MDA.findByIdAndDelete(mdaId);

    if (!mda) {
      throw new Error('MDA not found');
    }

    return { message: 'MDA deleted successfully' };
  } catch (error) {
    throw error;
  }
};

// Default export object for backward compatibility
export default {
  getAllMDAs,
  getMDAById,
  createMDA,
  updateMDA,
  deleteMDA
};