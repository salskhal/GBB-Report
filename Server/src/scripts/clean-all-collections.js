#!/usr/bin/env node

/**
 * Comprehensive script to clean and fix all collections (Users, MDAs, Admins)
 * This script will:
 * 1. Clean up all duplicate data
 * 2. Drop and recreate proper indexes
 * 3. Set up correct unique constraints
 * 4. Automatically run the admin seeder
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";
import MDA from "../models/MDA.js";
import Admin from "../models/Admin.js";
import Activity from "../models/Activity.js";
import seedDatabase from "../seed/seed.js";

// Load environment variables
dotenv.config();

const cleanAllCollections = async () => {
  try {
    console.log("🧹 Starting comprehensive database cleanup and fix...\n");

    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Show current state
    const userCount = await User.countDocuments();
    const mdaCount = await MDA.countDocuments();
    const adminCount = await Admin.countDocuments();
    const activityCount = await Activity.countDocuments();

    console.log("📊 Current database state:");
    console.log(`   Users: ${userCount}`);
    console.log(`   MDAs: ${mdaCount}`);
    console.log(`   Admins: ${adminCount}`);
    console.log(`   Activities: ${activityCount}`);

    console.log("\n⚠️  WARNING: This will delete ALL data from the database!");
    console.log("This is safe if you can recreate the data or have backups.");

    // ===========================================
    // CLEAN UP USERS COLLECTION
    // ===========================================
    console.log("\n👥 Cleaning Users collection...");

    // Delete all users
    const userDeleteResult = await User.deleteMany({});
    console.log(`✅ Deleted ${userDeleteResult.deletedCount} users`);

    // Drop and recreate user indexes
    try {
      await User.collection.dropIndexes();
      console.log("✅ Dropped all user indexes");
    } catch (error) {
      console.log("ℹ️  No user indexes to drop");
    }

    // Create proper user indexes
    await User.collection.createIndex({ username: 1 }, { unique: true });
    await User.collection.createIndex({ contactEmail: 1 }, { unique: true });
    await User.collection.createIndex({ mdaId: 1 });
    await User.collection.createIndex({ isActive: 1 });
    await User.collection.createIndex({ username: 1, mdaId: 1 });
    console.log("✅ Created proper user indexes");

    // ===========================================
    // CLEAN UP MDA COLLECTION
    // ===========================================
    console.log("\n🏢 Cleaning MDA collection...");

    // Delete all MDAs
    const mdaDeleteResult = await MDA.deleteMany({});
    console.log(`✅ Deleted ${mdaDeleteResult.deletedCount} MDAs`);

    // Drop and recreate MDA indexes
    try {
      await MDA.collection.dropIndexes();
      console.log("✅ Dropped all MDA indexes");
    } catch (error) {
      console.log("ℹ️  No MDA indexes to drop");
    }

    // Create proper MDA indexes
    await MDA.collection.createIndex({ name: 1 }, { unique: true });
    await MDA.collection.createIndex({ isActive: 1 });
    await MDA.collection.createIndex({ "reports.isActive": 1 });
    console.log("✅ Created proper MDA indexes");

    // ===========================================
    // CLEAN UP ADMIN COLLECTION
    // ===========================================
    console.log("\n👨‍💼 Cleaning Admin collection...");

    // Delete all admins
    const adminDeleteResult = await Admin.deleteMany({});
    console.log(`✅ Deleted ${adminDeleteResult.deletedCount} admins`);

    // Drop and recreate admin indexes
    try {
      await Admin.collection.dropIndexes();
      console.log("✅ Dropped all admin indexes");
    } catch (error) {
      console.log("ℹ️  No admin indexes to drop");
    }

    // Create proper admin indexes
    await Admin.collection.createIndex({ email: 1 }, { unique: true });
    await Admin.collection.createIndex({ role: 1 });
    await Admin.collection.createIndex({ isActive: 1 });
    await Admin.collection.createIndex({ createdBy: 1 });
    console.log("✅ Created proper admin indexes");

    // ===========================================
    // CLEAN UP ACTIVITY COLLECTION
    // ===========================================
    console.log("\n📋 Cleaning Activity collection...");

    // Delete all activities
    const activityDeleteResult = await Activity.deleteMany({});
    console.log(`✅ Deleted ${activityDeleteResult.deletedCount} activities`);

    // Drop and recreate activity indexes if needed
    try {
      await Activity.collection.dropIndexes();
      console.log("✅ Dropped all activity indexes");
    } catch (error) {
      console.log("ℹ️  No activity indexes to drop");
    }

    // ===========================================
    // VERIFY ALL INDEXES
    // ===========================================
    console.log("\n🔍 Verifying all indexes...");

    // Check User indexes
    const userIndexes = await User.collection.getIndexes();
    console.log("User indexes:");
    Object.keys(userIndexes).forEach((indexName) => {
      const index = userIndexes[indexName];
      const uniqueText = index.unique ? " (UNIQUE)" : "";
      console.log(
        `  - ${indexName}: ${JSON.stringify(index.key)}${uniqueText}`
      );
    });

    // Check MDA indexes
    const mdaIndexes = await MDA.collection.getIndexes();
    console.log("MDA indexes:");
    Object.keys(mdaIndexes).forEach((indexName) => {
      const index = mdaIndexes[indexName];
      const uniqueText = index.unique ? " (UNIQUE)" : "";
      console.log(
        `  - ${indexName}: ${JSON.stringify(index.key)}${uniqueText}`
      );
    });

    // Check Admin indexes
    const adminIndexes = await Admin.collection.getIndexes();
    console.log("Admin indexes:");
    Object.keys(adminIndexes).forEach((indexName) => {
      const index = adminIndexes[indexName];
      const uniqueText = index.unique ? " (UNIQUE)" : "";
      console.log(
        `  - ${indexName}: ${JSON.stringify(index.key)}${uniqueText}`
      );
    });

    // ===========================================
    // RUN ADMIN SEEDER
    // ===========================================
    console.log("\n🌱 Running admin seeder...");

    // Close current connection before seeder runs (seeder manages its own connection)
    await mongoose.connection.close();
    console.log("🔌 Closed database connection for seeder");

    // Run the seeder
    try {
      await seedDatabase();
      console.log("✅ Admin seeder completed successfully");
    } catch (error) {
      console.error("❌ Admin seeder failed:", error.message);
      throw error;
    }

    console.log(
      "\n🎉 Complete database cleanup and setup finished successfully!"
    );
    console.log("\n📋 Summary:");
    console.log("✅ All collections cleaned and indexes recreated");
    console.log("✅ Super admin account created");
    console.log("✅ Database ready for use");

    console.log("\n📋 Next steps:");
    console.log("1. Restart your server");
    console.log("2. Test admin login with seeded credentials");
    console.log("3. Create MDAs through admin interface");
    console.log("4. Create users and assign them to MDAs");
    console.log("5. Test all functionality");
  } catch (error) {
    console.error("\n❌ Cleanup failed:");
    console.error(error.message);
    console.error("\nStack trace:");
    console.error(error.stack);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  process.exit(1);
});

// Handle process termination gracefully
process.on("SIGINT", () => {
  console.log("\n⚠️  Process interrupted. Exiting gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n⚠️  Process terminated. Exiting gracefully...");
  process.exit(0);
});

// Run the cleanup
cleanAllCollections();
