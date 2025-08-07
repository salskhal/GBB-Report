#!/usr/bin/env node

/**
 * Script to fix only duplicate issues without deleting all data
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const fixDuplicatesOnly = async () => {
  try {
    console.log('🔧 Starting targeted duplicate fix...\n');

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Find and fix duplicate usernames
    console.log('🔍 Finding duplicate usernames...');
    const duplicateUsernames = await User.aggregate([
      {
        $group: {
          _id: '$username',
          count: { $sum: 1 },
          users: { $push: { id: '$_id', createdAt: '$createdAt' } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    for (const duplicate of duplicateUsernames) {
      console.log(`Fixing duplicate username: ${duplicate._id}`);
      const sortedUsers = duplicate.users.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      // Keep the first one, delete the rest
      for (let i = 1; i < sortedUsers.length; i++) {
        await User.findByIdAndDelete(sortedUsers[i].id);
        console.log(`  Deleted duplicate user: ${sortedUsers[i].id}`);
      }
    }

    // Step 2: Find and fix duplicate emails
    console.log('\n🔍 Finding duplicate emails...');
    const duplicateEmails = await User.aggregate([
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

    for (const duplicate of duplicateEmails) {
      console.log(`Fixing duplicate email: ${duplicate._id}`);
      const sortedUsers = duplicate.users.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      // Keep the first one, modify the rest
      for (let i = 1; i < sortedUsers.length; i++) {
        const user = sortedUsers[i];
        const newEmail = `${duplicate._id.split('@')[0]}_${i}@${duplicate._id.split('@')[1]}`;
        await User.findByIdAndUpdate(user.id, { contactEmail: newEmail });
        console.log(`  Updated user ${user.username} email to: ${newEmail}`);
      }
    }

    // Step 3: Ensure proper indexes
    console.log('\n🔧 Setting up proper indexes...');
    
    try {
      await User.collection.dropIndex('contactEmail_1');
    } catch (e) {
      console.log('No existing contactEmail index to drop');
    }

    await User.collection.createIndex({ contactEmail: 1 }, { unique: true });
    console.log('✅ Created unique index on contactEmail');

    await User.collection.createIndex({ username: 1 }, { unique: true });
    console.log('✅ Ensured unique index on username');

    console.log('\n✅ Duplicate fix completed successfully!');

  } catch (error) {
    console.error('\n❌ Fix failed:');
    console.error(error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

fixDuplicatesOnly();