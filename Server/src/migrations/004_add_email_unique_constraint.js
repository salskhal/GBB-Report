import mongoose from 'mongoose';
import User from '../models/User.js';

/**
 * Migration: Add unique constraint to contactEmail field
 * This migration will:
 * 1. Find and handle duplicate email addresses
 * 2. Add unique constraint to contactEmail field
 * 3. Update indexes
 */

export const up = async () => {
  console.log('Starting migration: Add unique constraint to contactEmail');

  try {
    // Connect to database if not already connected
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected. Please ensure database connection is established.');
    }

    // Step 1: Find duplicate emails
    console.log('Checking for duplicate email addresses...');
    const duplicates = await User.aggregate([
      {
        $group: {
          _id: '$contactEmail',
          count: { $sum: 1 },
          users: { $push: { id: '$_id', username: '$username', createdAt: '$createdAt' } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    if (duplicates.length > 0) {
      console.log(`Found ${duplicates.length} duplicate email addresses:`);
      
      for (const duplicate of duplicates) {
        console.log(`Email: ${duplicate._id} (${duplicate.count} users)`);
        
        // Sort by creation date, keep the oldest one
        const sortedUsers = duplicate.users.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const keepUser = sortedUsers[0];
        const removeUsers = sortedUsers.slice(1);
        
        console.log(`  Keeping user: ${keepUser.username} (${keepUser.id})`);
        
        // Update duplicate users with modified email addresses
        for (let i = 0; i < removeUsers.length; i++) {
          const user = removeUsers[i];
          const newEmail = `${duplicate._id.split('@')[0]}_duplicate_${i + 1}@${duplicate._id.split('@')[1]}`;
          
          await User.findByIdAndUpdate(user.id, {
            contactEmail: newEmail
          });
          
          console.log(`  Updated user ${user.username} email to: ${newEmail}`);
        }
      }
    } else {
      console.log('No duplicate email addresses found.');
    }

    // Step 2: Drop existing index on contactEmail if it exists
    console.log('Updating database indexes...');
    try {
      await User.collection.dropIndex('contactEmail_1');
      console.log('Dropped existing contactEmail index');
    } catch (error) {
      // Index might not exist, that's okay
      console.log('No existing contactEmail index to drop');
    }

    // Step 3: Create unique index on contactEmail
    await User.collection.createIndex({ contactEmail: 1 }, { unique: true });
    console.log('Created unique index on contactEmail');

    // Step 4: Update other indexes if needed
    try {
      await User.collection.dropIndex('mdaReference_1');
      console.log('Dropped old mdaReference index');
    } catch (error) {
      console.log('No mdaReference index to drop');
    }

    try {
      await User.collection.dropIndex({ username: 1, mdaReference: 1 });
      console.log('Dropped old compound index');
    } catch (error) {
      console.log('No old compound index to drop');
    }

    // Create new indexes
    await User.collection.createIndex({ mdaId: 1 });
    console.log('Created mdaId index');

    await User.collection.createIndex({ username: 1, mdaId: 1 });
    console.log('Created compound index on username and mdaId');

    console.log('Migration completed successfully!');
    return { success: true, message: 'Email unique constraint added successfully' };

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

export const down = async () => {
  console.log('Rolling back migration: Remove unique constraint from contactEmail');

  try {
    // Drop unique index
    await User.collection.dropIndex({ contactEmail: 1 });
    console.log('Dropped unique contactEmail index');

    // Recreate non-unique index
    await User.collection.createIndex({ contactEmail: 1 });
    console.log('Created non-unique contactEmail index');

    console.log('Migration rollback completed successfully!');
    return { success: true, message: 'Email unique constraint removed successfully' };

  } catch (error) {
    console.error('Migration rollback failed:', error);
    throw error;
  }
};

export default { up, down };