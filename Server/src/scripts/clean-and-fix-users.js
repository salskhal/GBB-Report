#!/usr/bin/env node

/**
 * Script to clean up user database and fix all issues
 * This script will remove all users and recreate the proper constraints
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";

// Load environment variables
dotenv.config();

const cleanAndFix = async () => {
  try {
    console.log("🧹 Starting user database cleanup and fix...\n");

    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Show current state
    const currentUserCount = await User.countDocuments();
    console.log(`📊 Current users in database: ${currentUserCount}`);

    // Ask for confirmation (in a real scenario, you'd want user input)
    console.log("\n⚠️  WARNING: This will delete ALL users from the database!");
    console.log(
      "This is safe to do if you have seeded data or can recreate users."
    );

    // Delete all users
    console.log("\n🗑️  Deleting all users...");
    const deleteResult = await User.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} users`);

    // Drop all indexes
    console.log("\n🔧 Dropping all user indexes...");
    try {
      await User.collection.dropIndexes();
      console.log("✅ Dropped all indexes");
    } catch (error) {
      console.log(
        "ℹ️  No indexes to drop or error dropping indexes:",
        error.message
      );
    }

    // Recreate the collection with proper schema
    console.log("\n🏗️  Recreating user collection with proper constraints...");

    // Create indexes as defined in the model
    await User.collection.createIndex({ username: 1 }, { unique: true });
    console.log("✅ Created unique index on username");

    await User.collection.createIndex({ contactEmail: 1 }, { unique: true });
    console.log("✅ Created unique index on contactEmail");

    await User.collection.createIndex({ mdaId: 1 });
    console.log("✅ Created index on mdaId");

    await User.collection.createIndex({ isActive: 1 });
    console.log("✅ Created index on isActive");

    await User.collection.createIndex({ username: 1, mdaId: 1 });
    console.log("✅ Created compound index on username and mdaId");

    // Verify indexes
    console.log("\n🔍 Verifying indexes...");
    const indexes = await User.collection.getIndexes();
    console.log("Created indexes:");
    Object.keys(indexes).forEach((indexName) => {
      const index = indexes[indexName];
      console.log(
        `  - ${indexName}:`,
        JSON.stringify(index.key),
        index.unique ? "(UNIQUE)" : ""
      );
    });

    console.log("\n✅ Database cleanup and fix completed successfully!");
    console.log("\n📋 Next steps:");
    console.log("1. Restart your server");
    console.log("2. Re-seed your database if needed");
    console.log("3. Test user creation functionality");
  } catch (error) {
    console.error("\n❌ Cleanup failed:");
    console.error(error.message);
    console.error("\nStack trace:");
    console.error(error.stack);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  process.exit(1);
});

// Run the cleanup
cleanAndFix();
