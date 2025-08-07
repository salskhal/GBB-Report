#!/usr/bin/env node

/**
 * Script to fix user email constraint issue
 * This script will add unique constraint to contactEmail field
 * and handle any existing duplicate data
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { up } from '../migrations/004_add_email_unique_constraint.js';

// Load environment variables
dotenv.config();

const runMigration = async () => {
  try {
    console.log('🚀 Starting user email constraint fix...\n');

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Run the migration
    const result = await up();
    
    if (result.success) {
      console.log('\n✅ Migration completed successfully!');
      console.log('📧 Email unique constraint has been added.');
      console.log('🔧 Any duplicate emails have been handled.');
      console.log('\n📋 Next steps:');
      console.log('1. Restart your server');
      console.log('2. Test user creation functionality');
      console.log('3. Check that duplicate email validation works');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('1. Check your MongoDB connection');
    console.error('2. Ensure you have proper database permissions');
    console.error('3. Check server logs for more details');
    process.exit(1);
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

// Run the migration
runMigration();