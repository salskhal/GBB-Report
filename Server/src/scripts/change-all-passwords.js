#!/usr/bin/env node

/**
 * Script to change all user passwords
 * This script will:
 * 1. Update all user passwords to a new default password
 * 2. Optionally update admin passwords too
 * 3. Handle password hashing properly
 * 4. Provide detailed logging of changes
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Admin from "../models/Admin.js";

// Load environment variables
dotenv.config();

const changeAllPasswords = async () => {
  try {
    console.log("🔐 Starting password change for all users...\n");

    // Get new password from command line arguments or use default
    const newPassword = process.argv[2] || "Password12$";
    const includeAdmins = process.argv[3] === "--include-admins";

    console.log(`New password: ${newPassword}`);
    console.log(`Include admins: ${includeAdmins ? "Yes" : "No"}`);
    console.log("");

    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Show current state
    const userCount = await User.countDocuments();
    const adminCount = await Admin.countDocuments();

    console.log("📊 Current database state:");
    console.log(`   Users: ${userCount}`);
    console.log(`   Admins: ${adminCount}`);
    console.log("");

    // Hash the new password
    console.log("🔒 Hashing new password...");
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    console.log("✅ Password hashed successfully\n");

    // ===========================================
    // UPDATE USER PASSWORDS
    // ===========================================
    console.log("👥 Updating user passwords...");

    const userUpdateResult = await User.updateMany(
      {}, // Update all users
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date()
        } 
      }
    );

    console.log(`✅ Updated ${userUpdateResult.modifiedCount} user passwords`);

    // ===========================================
    // UPDATE ADMIN PASSWORDS (if requested)
    // ===========================================
    let adminUpdateResult = { modifiedCount: 0 };
    
    if (includeAdmins) {
      console.log("\n👨‍💼 Updating admin passwords...");
      
      adminUpdateResult = await Admin.updateMany(
        {}, // Update all admins
        { 
          $set: { 
            password: hashedPassword,
            updatedAt: new Date()
          } 
        }
      );

      console.log(`✅ Updated ${adminUpdateResult.modifiedCount} admin passwords`);
    } else {
      console.log("\n⚠️  Skipping admin passwords (use --include-admins to update them)");
    }

    // ===========================================
    // VERIFICATION
    // ===========================================
    console.log("\n🔍 Verifying password changes...");

    // Test password hash with a sample user
    const sampleUser = await User.findOne();
    if (sampleUser) {
      const isValidPassword = await bcrypt.compare(newPassword, sampleUser.password);
      if (isValidPassword) {
        console.log("✅ Password verification successful");
      } else {
        console.log("❌ Password verification failed");
      }
    }

    // Test admin password if admins were updated
    if (includeAdmins) {
      const sampleAdmin = await Admin.findOne();
      if (sampleAdmin) {
        const isValidAdminPassword = await bcrypt.compare(newPassword, sampleAdmin.password);
        if (isValidAdminPassword) {
          console.log("✅ Admin password verification successful");
        } else {
          console.log("❌ Admin password verification failed");
        }
      }
    }

    // ===========================================
    // SUMMARY
    // ===========================================
    console.log("\n📊 Password Change Summary:");
    console.log(`✅ Users updated: ${userUpdateResult.modifiedCount}`);
    console.log(`✅ Admins updated: ${adminUpdateResult.modifiedCount}`);
    console.log(`🔐 New password: ${newPassword}`);
    console.log(`🔒 Password hash: ${hashedPassword.substring(0, 20)}...`);

    console.log("\n🎉 Password change completed successfully!");
    
    console.log("\n📋 Important Notes:");
    console.log("1. All affected users must use the new password to login");
    console.log("2. Consider notifying users about the password change");
    console.log("3. Users should change their passwords after first login");
    console.log("4. The old passwords are no longer valid");

    console.log("\n📋 Next steps:");
    console.log("1. Test login with the new password");
    console.log("2. Notify all users about the password change");
    console.log("3. Consider implementing forced password change on next login");

  } catch (error) {
    console.error("\n❌ Password change failed:");
    console.error(error.message);
    console.error("\nStack trace:");
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
};

/**
 * Show usage information
 */
function showUsage() {
  console.log("\n📋 Usage:");
  console.log("npm run change-passwords [new_password] [--include-admins]");
  console.log("\nExamples:");
  console.log("npm run change-passwords                    # Uses default: Password12$");
  console.log("npm run change-passwords NewPass123!       # Sets custom password");
  console.log("npm run change-passwords NewPass123! --include-admins  # Include admin passwords");
  console.log("\n💡 Password Requirements:");
  console.log("- At least 8 characters long");
  console.log("- Should contain uppercase, lowercase, numbers, and symbols");
  console.log("- Avoid common passwords for security");
}

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

// Show usage if help requested
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("🔐 Change All Passwords Script");
  showUsage();
  process.exit(0);
}

// Run the password change
changeAllPasswords();