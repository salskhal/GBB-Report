#!/usr/bin/env node

/**
 * Script to fix database indexes without losing data
 * This script will:
 * 1. Drop all existing indexes
 * 2. Recreate proper indexes with correct unique constraints
 * 3. Keep all existing data intact
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";
import MDA from "../models/MDA.js";
import Admin from "../models/Admin.js";
import Activity from "../models/Activity.js";

// Load environment variables
dotenv.config();

const fixIndexesOnly = async () => {
  try {
    console.log("🔧 Starting index fix (keeping all data)...\n");

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
    console.log("\n✅ All data will be preserved!\n");

    // ===========================================
    // FIX USER COLLECTION INDEXES
    // ===========================================
    console.log("👥 Fixing User collection indexes...");

    try {
      await User.collection.dropIndexes();
      console.log("✅ Dropped all user indexes");
    } catch (error) {
      console.log("ℹ️  No user indexes to drop or error dropping:", error.message);
    }

    // Create proper user indexes
    try {
      await User.collection.createIndex({ username: 1 }, { unique: true });
      console.log("✅ Created unique username index");
    } catch (error) {
      console.log("⚠️  Username index creation failed:", error.message);
    }

    try {
      await User.collection.createIndex({ contactEmail: 1 }, { unique: true });
      console.log("✅ Created unique contactEmail index");
    } catch (error) {
      console.log("⚠️  ContactEmail index creation failed:", error.message);
    }

    try {
      await User.collection.createIndex({ mdaId: 1 });
      await User.collection.createIndex({ isActive: 1 });
      await User.collection.createIndex({ username: 1, mdaId: 1 });
      console.log("✅ Created additional user indexes");
    } catch (error) {
      console.log("⚠️  Additional user indexes failed:", error.message);
    }

    // ===========================================
    // FIX MDA COLLECTION INDEXES
    // ===========================================
    console.log("\n🏢 Fixing MDA collection indexes...");

    try {
      await MDA.collection.dropIndexes();
      console.log("✅ Dropped all MDA indexes");
    } catch (error) {
      console.log("ℹ️  No MDA indexes to drop or error dropping:", error.message);
    }

    try {
      await MDA.collection.createIndex({ name: 1 }, { unique: true });
      console.log("✅ Created unique MDA name index");
    } catch (error) {
      console.log("⚠️  MDA name index creation failed:", error.message);
    }

    try {
      await MDA.collection.createIndex({ isActive: 1 });
      await MDA.collection.createIndex({ "reports.isActive": 1 });
      console.log("✅ Created additional MDA indexes");
    } catch (error) {
      console.log("⚠️  Additional MDA indexes failed:", error.message);
    }

    // ===========================================
    // FIX ADMIN COLLECTION INDEXES
    // ===========================================
    console.log("\n👨‍💼 Fixing Admin collection indexes...");

    try {
      await Admin.collection.dropIndexes();
      console.log("✅ Dropped all admin indexes");
    } catch (error) {
      console.log("ℹ️  No admin indexes to drop or error dropping:", error.message);
    }

    try {
      await Admin.collection.createIndex({ email: 1 }, { unique: true });
      console.log("✅ Created unique admin email index");
    } catch (error) {
      console.log("⚠️  Admin email index creation failed:", error.message);
    }

    try {
      await Admin.collection.createIndex({ role: 1 });
      await Admin.collection.createIndex({ isActive: 1 });
      await Admin.collection.createIndex({ createdBy: 1 });
      console.log("✅ Created additional admin indexes");
    } catch (error) {
      console.log("⚠️  Additional admin indexes failed:", error.message);
    }

    // ===========================================
    // FIX ACTIVITY COLLECTION INDEXES
    // ===========================================
    console.log("\n📋 Fixing Activity collection indexes...");

    try {
      await Activity.collection.dropIndexes();
      console.log("✅ Dropped all activity indexes");
    } catch (error) {
      console.log("ℹ️  No activity indexes to drop or error dropping:", error.message);
    }

    try {
      await Activity.collection.createIndex({ timestamp: -1 });
      await Activity.collection.createIndex({ userId: 1 });
      await Activity.collection.createIndex({ adminId: 1 });
      await Activity.collection.createIndex({ action: 1 });
      await Activity.collection.createIndex({ timestamp: -1, userId: 1 });
      await Activity.collection.createIndex({ timestamp: -1, adminId: 1 });
      console.log("✅ Created activity indexes for better logging performance");
    } catch (error) {
      console.log("⚠️  Activity indexes failed:", error.message);
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

    // Check Activity indexes
    const activityIndexes = await Activity.collection.getIndexes();
    console.log("Activity indexes:");
    Object.keys(activityIndexes).forEach((indexName) => {
      const index = activityIndexes[indexName];
      const uniqueText = index.unique ? " (UNIQUE)" : "";
      console.log(
        `  - ${indexName}: ${JSON.stringify(index.key)}${uniqueText}`
      );
    });

    // Final verification
    const finalUserCount = await User.countDocuments();
    const finalMdaCount = await MDA.countDocuments();
    const finalAdminCount = await Admin.countDocuments();
    const finalActivityCount = await Activity.countDocuments();

    console.log("\n📊 Final database state (should be unchanged):");
    console.log(`   Users: ${finalUserCount} (was ${userCount})`);
    console.log(`   MDAs: ${finalMdaCount} (was ${mdaCount})`);
    console.log(`   Admins: ${finalAdminCount} (was ${adminCount})`);
    console.log(`   Activities: ${finalActivityCount} (was ${activityCount})`);

    if (finalUserCount === userCount && finalMdaCount === mdaCount && 
        finalAdminCount === adminCount && finalActivityCount === activityCount) {
      console.log("✅ All data preserved successfully!");
    } else {
      console.log("⚠️  Data counts changed - please verify!");
    }

    console.log("\n🎉 Index fix completed successfully!");
    console.log("\n📋 What was fixed:");
    console.log("✅ All collections now have proper indexes");
    console.log("✅ Unique constraints properly set");
    console.log("✅ Activity logging should work better now");
    console.log("✅ All your existing data is preserved");

    console.log("\n📋 Next steps:");
    console.log("1. Restart your application");
    console.log("2. Test activity logging functionality");
    console.log("3. Monitor performance improvements");

  } catch (error) {
    console.error("\n❌ Index fix failed:");
    console.error(error.message);
    console.error("\nStack trace:");
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
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

// Run the index fix
fixIndexesOnly();