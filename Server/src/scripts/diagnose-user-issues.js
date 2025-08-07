#!/usr/bin/env node

/**
 * Diagnostic script to check user database issues
 * This script will help identify what's causing the duplicate value error
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const diagnoseIssues = async () => {
  try {
    console.log('🔍 Starting user database diagnostics...\n');

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check total user count
    const totalUsers = await User.countDocuments();
    console.log(`📊 Total users in database: ${totalUsers}\n`);

    // Check for duplicate usernames
    console.log('🔍 Checking for duplicate usernames...');
    const duplicateUsernames = await User.aggregate([
      {
        $group: {
          _id: '$username',
          count: { $sum: 1 },
          users: { $push: { id: '$_id', name: '$name', email: '$contactEmail' } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    if (duplicateUsernames.length > 0) {
      console.log(`❌ Found ${duplicateUsernames.length} duplicate usernames:`);
      duplicateUsernames.forEach(dup => {
        console.log(`  Username: "${dup._id}" (${dup.count} users)`);
        dup.users.forEach(user => {
          console.log(`    - ${user.name} (${user.email}) - ID: ${user.id}`);
        });
      });
    } else {
      console.log('✅ No duplicate usernames found');
    }

    // Check for duplicate emails
    console.log('\n🔍 Checking for duplicate emails...');
    const duplicateEmails = await User.aggregate([
      {
        $group: {
          _id: '$contactEmail',
          count: { $sum: 1 },
          users: { $push: { id: '$_id', name: '$name', username: '$username' } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);

    if (duplicateEmails.length > 0) {
      console.log(`❌ Found ${duplicateEmails.length} duplicate emails:`);
      duplicateEmails.forEach(dup => {
        console.log(`  Email: "${dup._id}" (${dup.count} users)`);
        dup.users.forEach(user => {
          console.log(`    - ${user.name} (@${user.username}) - ID: ${user.id}`);
        });
      });
    } else {
      console.log('✅ No duplicate emails found');
    }

    // Check database indexes
    console.log('\n🔍 Checking database indexes...');
    const indexes = await User.collection.getIndexes();
    console.log('Current indexes:');
    Object.keys(indexes).forEach(indexName => {
      const index = indexes[indexName];
      console.log(`  - ${indexName}:`, JSON.stringify(index.key), index.unique ? '(UNIQUE)' : '');
    });

    // Check for any users with null/undefined values
    console.log('\n🔍 Checking for users with missing required fields...');
    
    const usersWithoutUsername = await User.countDocuments({ 
      $or: [{ username: null }, { username: undefined }, { username: '' }] 
    });
    console.log(`Users without username: ${usersWithoutUsername}`);

    const usersWithoutEmail = await User.countDocuments({ 
      $or: [{ contactEmail: null }, { contactEmail: undefined }, { contactEmail: '' }] 
    });
    console.log(`Users without email: ${usersWithoutEmail}`);

    const usersWithoutMDA = await User.countDocuments({ 
      $or: [{ mdaId: null }, { mdaId: undefined }] 
    });
    console.log(`Users without MDA: ${usersWithoutMDA}`);

    // Show sample users
    console.log('\n📋 Sample users in database:');
    const sampleUsers = await User.find().limit(5).select('username contactEmail name mdaId createdAt');
    sampleUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (@${user.username}) - ${user.contactEmail} - MDA: ${user.mdaId}`);
    });

    console.log('\n✅ Diagnostics completed!');

  } catch (error) {
    console.error('\n❌ Diagnostics failed:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Run the diagnostics
diagnoseIssues();