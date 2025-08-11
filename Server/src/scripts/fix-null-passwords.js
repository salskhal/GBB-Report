#!/usr/bin/env node

/**
 * Script to fix users/admins with null or undefined passwords
 * This script will:
 * 1. Find users/admins with null, undefined, or invalid passwords
 * 2. Set them to a default password
 * 3. Report on what was fixed
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Admin from "../models/Admin.js";

// Load environment variables
dotenv.config();

const fixNullPasswords = async () => {
  try {
    console.log("🔧 Starting null password fix...\n");

    const defaultPassword = process.argv[2] || "Password12$";
    console.log(`Default password to set: ${defaultPassword}\n`);

    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Hash the default password
    console.log("🔒 Hashing default password...");
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);
    console.log("✅ Password hashed successfully\n");

    // ===========================================
    // FIX USER PASSWORDS
    // ===========================================
    console.log("👥 Checking user passwords...");

    // Find users with null/undefined/invalid passwords
    const usersWithBadPasswords = await User.find({
      $or: [
        { password: null },
        { password: undefined },
        { password: "" },
        { password: { $exists: false } },
        { password: { $type: "null" } }
      ]
    });

    console.log(`Found ${usersWithBadPasswords.length} users with invalid passwords`);

    if (usersWithBadPasswords.length > 0) {
      console.log("Users with invalid passwords:");
      usersWithBadPasswords.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.username || user.name || user._id} - password: ${user.password}`);
      });

      // Fix them
      const userFixResult = await User.updateMany(
        {
          $or: [
            { password: null },
            { password: undefined },
            { password: "" },
            { password: { $exists: false } },
            { password: { $type: "null" } }
          ]
        },
        {
          $set: {
            password: hashedPassword,
            updatedAt: new Date()
          }
        }
      );

      console.log(`✅ Fixed ${userFixResult.modifiedCount} user passwords`);
    } else {
      console.log("✅ All user passwords are valid");
    }

    // ===========================================
    // FIX ADMIN PASSWORDS
    // ===========================================
    console.log("\n👨‍💼 Checking admin passwords...");

    // Find admins with null/undefined/invalid passwords
    const adminsWithBadPasswords = await Admin.find({
      $or: [
        { password: null },
        { password: undefined },
        { password: "" },
        { password: { $exists: false } },
        { password: { $type: "null" } }
      ]
    });

    console.log(`Found ${adminsWithBadPasswords.length} admins with invalid passwords`);

    if (adminsWithBadPasswords.length > 0) {
      console.log("Admins with invalid passwords:");
      adminsWithBadPasswords.forEach((admin, index) => {
        console.log(`  ${index + 1}. ${admin.name || admin.email || admin._id} - password: ${admin.password}`);
      });

      // Fix them
      const adminFixResult = await Admin.updateMany(
        {
          $or: [
            { password: null },
            { password: undefined },
            { password: "" },
            { password: { $exists: false } },
            { password: { $type: "null" } }
          ]
        },
        {
          $set: {
            password: hashedPassword,
            updatedAt: new Date()
          }
        }
      );

      console.log(`✅ Fixed ${adminFixResult.modifiedCount} admin passwords`);
    } else {
      console.log("✅ All admin passwords are valid");
    }

    // ===========================================
    // VERIFICATION
    // ===========================================
    console.log("\n🔍 Final verification...");

    // Check for any remaining bad passwords
    const remainingBadUsers = await User.countDocuments({
      $or: [
        { password: null },
        { password: undefined },
        { password: "" },
        { password: { $exists: false } },
        { password: { $type: "null" } }
      ]
    });

    const remainingBadAdmins = await Admin.countDocuments({
      $or: [
        { password: null },
        { password: undefined },
        { password: "" },
        { password: { $exists: false } },
        { password: { $type: "null" } }
      ]
    });

    console.log(`Remaining users with bad passwords: ${remainingBadUsers}`);
    console.log(`Remaining admins with bad passwords: ${remainingBadAdmins}`);

    if (remainingBadUsers === 0 && remainingBadAdmins === 0) {
      console.log("✅ All passwords are now valid!");
    } else {
      console.log("⚠️  Some passwords still need fixing");
    }

    // Test the fixed passwords
    console.log("\n🧪 Testing fixed passwords...");
    
    const testUser = await User.findOne();
    if (testUser && testUser.password) {
      try {
        const isValid = await bcrypt.compare(defaultPassword, testUser.password);
        console.log(`User password test: ${isValid ? "✅ PASS" : "❌ FAIL"}`);
      } catch (error) {
        console.log(`User password test: ❌ ERROR - ${error.message}`);
      }
    }

    const testAdmin = await Admin.findOne();
    if (testAdmin && testAdmin.password) {
      try {
        const isValid = await bcrypt.compare(defaultPassword, testAdmin.password);
        console.log(`Admin password test: ${isValid ? "✅ PASS" : "❌ FAIL"}`);
      } catch (error) {
        console.log(`Admin password test: ❌ ERROR - ${error.message}`);
      }
    }

    console.log("\n🎉 Null password fix completed!");
    console.log(`\n📋 Summary:`);
    console.log(`✅ Fixed ${usersWithBadPasswords.length} user passwords`);
    console.log(`✅ Fixed ${adminsWithBadPasswords.length} admin passwords`);
    console.log(`🔐 Default password: ${defaultPassword}`);

  } catch (error) {
    console.error("\n❌ Fix failed:");
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

// Run the fix
fixNullPasswords();