#!/usr/bin/env node

/**
 * Activity Logging Diagnostic Script
 * This script will:
 * 1. Check database connection and Activity collection
 * 2. Test activity logging functionality
 * 3. Check indexes and performance
 * 4. Verify middleware setup
 * 5. Test manual activity creation
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import Activity from "../models/Activity.js";
import Admin from "../models/Admin.js";
import activityService from "../service/activityService.js";

// Load environment variables
dotenv.config();

const diagnoseActivityLogging = async () => {
  try {
    console.log("🔍 Starting Activity Logging Diagnostics...\n");

    // Connect to MongoDB
    console.log("1. Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // ===========================================
    // CHECK DATABASE STATE
    // ===========================================
    console.log("2. 📊 Checking database state...");
    
    const activityCount = await Activity.countDocuments();
    const adminCount = await Admin.countDocuments();
    
    console.log(`   Activities in database: ${activityCount}`);
    console.log(`   Admins in database: ${adminCount}`);
    
    if (activityCount === 0) {
      console.log("⚠️  No activities found - this might be the issue!");
    }
    
    // Check recent activities
    const recentActivities = await Activity.find()
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();
    
    console.log(`   Recent activities (last 5):`);
    if (recentActivities.length === 0) {
      console.log("     No recent activities found");
    } else {
      recentActivities.forEach((activity, index) => {
        console.log(`     ${index + 1}. ${activity.action} ${activity.resourceType} by ${activity.adminName} at ${activity.timestamp}`);
      });
    }
    console.log("");

    // ===========================================
    // CHECK INDEXES
    // ===========================================
    console.log("3. 🔍 Checking Activity collection indexes...");
    
    const indexes = await Activity.collection.getIndexes();
    console.log("   Current indexes:");
    Object.keys(indexes).forEach((indexName) => {
      const index = indexes[indexName];
      const uniqueText = index.unique ? " (UNIQUE)" : "";
      console.log(`     - ${indexName}: ${JSON.stringify(index.key)}${uniqueText}`);
    });
    console.log("");

    // ===========================================
    // TEST MANUAL ACTIVITY CREATION
    // ===========================================
    console.log("4. 🧪 Testing manual activity creation...");
    
    // Get a test admin
    const testAdmin = await Admin.findOne();
    if (!testAdmin) {
      console.log("❌ No admin found for testing - please create an admin first");
      return;
    }
    
    console.log(`   Using test admin: ${testAdmin.name} (${testAdmin.email})`);
    
    // Test 1: Direct Activity.logActivity
    console.log("   Test 1: Direct Activity.logActivity...");
    const testActivity1 = {
      adminId: testAdmin._id,
      adminName: testAdmin.name,
      action: "CREATE",
      resourceType: "USER",
      resourceId: "test-resource-id",
      resourceName: "Test Resource",
      details: { test: "direct creation" },
      ipAddress: "127.0.0.1",
      userAgent: "Test User Agent"
    };
    
    try {
      const result1 = await Activity.logActivity(testActivity1);
      if (result1) {
        console.log("   ✅ Direct Activity.logActivity SUCCESS");
        console.log(`      Created activity ID: ${result1._id}`);
      } else {
        console.log("   ❌ Direct Activity.logActivity FAILED - returned null");
      }
    } catch (error) {
      console.log("   ❌ Direct Activity.logActivity ERROR:", error.message);
    }
    
    // Test 2: ActivityService.logActivity
    console.log("   Test 2: ActivityService.logActivity...");
    const testActivity2 = {
      adminId: testAdmin._id,
      adminName: testAdmin.name,
      action: "UPDATE",
      resourceType: "MDA",
      resourceId: "test-resource-id-2",
      resourceName: "Test Resource 2",
      details: { test: "service creation" },
      ipAddress: "127.0.0.1",
      userAgent: "Test User Agent 2"
    };
    
    try {
      const result2 = await activityService.logActivity(testActivity2);
      if (result2) {
        console.log("   ✅ ActivityService.logActivity SUCCESS");
        console.log(`      Created activity ID: ${result2._id}`);
      } else {
        console.log("   ❌ ActivityService.logActivity FAILED - returned null");
      }
    } catch (error) {
      console.log("   ❌ ActivityService.logActivity ERROR:", error.message);
    }
    
    // Test 3: Direct mongoose save
    console.log("   Test 3: Direct mongoose save...");
    try {
      const directActivity = new Activity({
        adminId: testAdmin._id,
        adminName: testAdmin.name,
        action: "DELETE",
        resourceType: "ADMIN",
        resourceId: "test-resource-id-3",
        resourceName: "Test Resource 3",
        details: { test: "direct mongoose save" },
        ipAddress: "127.0.0.1",
        userAgent: "Test User Agent 3"
      });
      
      const result3 = await directActivity.save();
      console.log("   ✅ Direct mongoose save SUCCESS");
      console.log(`      Created activity ID: ${result3._id}`);
    } catch (error) {
      console.log("   ❌ Direct mongoose save ERROR:", error.message);
      console.log("      Validation errors:", error.errors);
    }
    console.log("");

    // ===========================================
    // CHECK VALIDATION ISSUES
    // ===========================================
    console.log("5. 🔍 Checking for validation issues...");
    
    // Test with invalid data
    const invalidTests = [
      {
        name: "Missing adminId",
        data: {
          adminName: testAdmin.name,
          action: "CREATE",
          resourceType: "USER",
          ipAddress: "127.0.0.1",
          userAgent: "Test"
        }
      },
      {
        name: "Invalid action",
        data: {
          adminId: testAdmin._id,
          adminName: testAdmin.name,
          action: "INVALID_ACTION",
          resourceType: "USER",
          ipAddress: "127.0.0.1",
          userAgent: "Test"
        }
      },
      {
        name: "Invalid IP address",
        data: {
          adminId: testAdmin._id,
          adminName: testAdmin.name,
          action: "CREATE",
          resourceType: "USER",
          ipAddress: "invalid-ip",
          userAgent: "Test"
        }
      }
    ];
    
    for (const test of invalidTests) {
      try {
        const result = await Activity.logActivity(test.data);
        console.log(`   ⚠️  ${test.name}: Expected to fail but succeeded`);
      } catch (error) {
        console.log(`   ✅ ${test.name}: Correctly failed with: ${error.message}`);
      }
    }
    console.log("");

    // ===========================================
    // CHECK RECENT DATABASE ACTIVITY
    // ===========================================
    console.log("6. 📊 Final database check...");
    
    const finalActivityCount = await Activity.countDocuments();
    const newActivities = finalActivityCount - activityCount;
    
    console.log(`   Activities before tests: ${activityCount}`);
    console.log(`   Activities after tests: ${finalActivityCount}`);
    console.log(`   New activities created: ${newActivities}`);
    
    if (newActivities > 0) {
      console.log("   ✅ Activity logging is working!");
      
      // Show the new activities
      const latestActivities = await Activity.find()
        .sort({ timestamp: -1 })
        .limit(newActivities)
        .lean();
      
      console.log("   Latest activities:");
      latestActivities.forEach((activity, index) => {
        console.log(`     ${index + 1}. ${activity.action} ${activity.resourceType} - ${activity.details?.test || 'No test details'}`);
      });
    } else {
      console.log("   ❌ No new activities created - there's definitely an issue!");
    }
    console.log("");

    // ===========================================
    // RECOMMENDATIONS
    // ===========================================
    console.log("7. 💡 Recommendations:");
    
    if (newActivities === 0) {
      console.log("   ❌ Activity logging is not working. Possible issues:");
      console.log("      1. Database connection problems");
      console.log("      2. Validation errors in activity data");
      console.log("      3. Middleware not being called");
      console.log("      4. Admin information not available in requests");
      console.log("      5. Index issues preventing writes");
      console.log("");
      console.log("   🔧 Try running: npm run fix-indexes");
    } else if (newActivities < 3) {
      console.log("   ⚠️  Some activity logging is working, but not all tests passed");
      console.log("      Check the error messages above for specific issues");
    } else {
      console.log("   ✅ Activity logging appears to be working correctly!");
      console.log("      If you're still not seeing logs in production:");
      console.log("      1. Check that admin authentication is working");
      console.log("      2. Verify middleware is being called");
      console.log("      3. Check application logs for errors");
      console.log("      4. Ensure you're testing with the right admin role");
    }
    
    console.log("\n🎉 Diagnostic completed!");

  } catch (error) {
    console.error("\n❌ Diagnostic failed:");
    console.error(error.message);
    console.error("\nStack trace:");
    console.error(error.stack);
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

// Run the diagnostic
diagnoseActivityLogging();