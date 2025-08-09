#!/usr/bin/env node

/**
 * Script to import users from CSV file
 * This script will:
 * 1. Read the user.csv file from the root directory
 * 2. Parse and clean the data
 * 3. Create users with appropriate roles:
 *    - "GBB Staff" or "Unrestricted" → Admin users
 *    - Others → Regular users assigned to provided MDA
 * 4. Set default password: Password12$
 * 5. Handle duplicates and validation errors
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import MDA from "../models/MDA.js";

// Load environment variables
dotenv.config();

// Get current directory (for ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const importUsersFromCSV = async () => {
  try {
    console.log("👥 Starting User import from CSV...\n");

    // Get MDA ID from command line arguments
    const mdaId = process.argv[2];
    if (!mdaId) {
      console.error("❌ Error: MDA ID is required!");
      console.log("Usage: npm run import-users <mdaId>");
      console.log("Example: npm run import-users 64f1a2b3c4d5e6f7g8h9i0j1");
      process.exit(1);
    }

    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Verify MDA exists
    console.log(`🔍 Verifying MDA ID: ${mdaId}`);
    const mda = await MDA.findById(mdaId);
    if (!mda) {
      console.error(`❌ Error: MDA with ID "${mdaId}" not found!`);
      console.log("\n💡 Available MDAs:");
      const allMDAs = await MDA.find().select("_id name");
      allMDAs.forEach((m) => console.log(`   ${m._id} - ${m.name}`));
      process.exit(1);
    }
    console.log(`✅ Found MDA: "${mda.name}"\n`);

    // Read CSV file
    const csvPath = path.join(__dirname, "../../datas/user.csv");
    console.log(`📁 Reading CSV file: ${csvPath}`);

    if (!fs.existsSync(csvPath)) {
      throw new Error("CSV file not found at: " + csvPath);
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8");
    console.log("✅ CSV file read successfully\n");

    // Parse CSV content
    console.log("🔍 Parsing CSV data...");
    const lines = csvContent.split("\n");

    // Parse data rows (assuming no headers based on your CSV)
    const rawData = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      const row = parseCSVLine(line);
      if (row.length >= 2 && row[0] && row[0].trim()) {
        rawData.push({
          username: row[0].trim(),
          category: row[1] ? row[1].trim() : "",
          lineNumber: i + 1,
        });
      }
    }

    console.log(`✅ Parsed ${rawData.length} valid data rows\n`);

    // Categorize users
    console.log("📊 Categorizing users...");
    const adminUsers = [];
    const regularUsers = [];

    rawData.forEach((user) => {
      const category = user.category.toLowerCase();
      if (category === "gbb staff" || category === "unrestricted") {
        adminUsers.push({
          ...user,
          role: "admin",
          isGBBStaff: category === "gbb staff",
        });
      } else {
        regularUsers.push({
          ...user,
          role: "user",
        });
      }
    });

    console.log(`✅ Categorization complete:`);
    console.log(
      `   👨‍💼 Admin users (GBB Staff + Unrestricted): ${adminUsers.length}`
    );
    console.log(`   👤 Regular users: ${regularUsers.length}\n`);

    // Get super admin for admin creation
    const superAdmin = await Admin.findOne({ role: "superadmin" });
    if (!superAdmin && adminUsers.length > 0) {
      console.error(
        "❌ Error: Super admin not found! Cannot create admin users."
      );
      console.log("Please run the seed script first to create a super admin.");
      process.exit(1);
    }

    // Create users in database
    console.log("💾 Creating users in database...\n");

    let createdAdmins = 0;
    let createdUsers = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors = [];

    // Create admin users
    console.log("👨‍💼 Creating admin users...");
    for (const userData of adminUsers) {
      try {
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({
          $or: [
            { email: generateEmail(userData.username) },
            { name: userData.username },
          ],
        });

        if (existingAdmin) {
          console.log(
            `⚠️  Admin "${userData.username}" already exists, skipping...`
          );
          skippedCount++;
          continue;
        }

        // Create admin
        const admin = new Admin({
          name: userData.username,
          email: generateEmail(userData.username),
          password: "Password12$",
          role: "admin",
          createdBy: superAdmin._id,
          isActive: true,
        });

        await admin.save();
        console.log(
          `✅ Created admin: "${userData.username}" (${userData.category})`
        );
        createdAdmins++;
      } catch (error) {
        console.error(
          `❌ Error creating admin "${userData.username}": ${error.message}`
        );
        errors.push({
          username: userData.username,
          type: "admin",
          error: error.message,
          line: userData.lineNumber,
        });
        errorCount++;
      }
    }

    // Create regular users
    console.log("\n👤 Creating regular users...");
    for (const userData of regularUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({
          $or: [
            { username: userData.username.toLowerCase() },
            { contactEmail: generateEmail(userData.username) },
          ],
        });

        if (existingUser) {
          console.log(
            `⚠️  User "${userData.username}" already exists, skipping...`
          );
          skippedCount++;
          continue;
        }

        // Create user
        const user = new User({
          username: userData.username.toLowerCase(),
          name: userData.username,
          contactEmail: generateEmail(userData.username),
          password: "Password12$",
          role: "user",
          mdaId: mdaId,
          isActive: true,
        });

        await user.save();
        console.log(`✅ Created user: "${userData.username}" → ${mda.name}`);
        createdUsers++;
      } catch (error) {
        console.error(
          `❌ Error creating user "${userData.username}": ${error.message}`
        );
        errors.push({
          username: userData.username,
          type: "user",
          error: error.message,
          line: userData.lineNumber,
        });
        errorCount++;
      }
    }

    // Summary
    console.log("\n📊 Import Summary:");
    console.log(`✅ Successfully created:`);
    console.log(`   👨‍💼 Admin users: ${createdAdmins}`);
    console.log(`   👤 Regular users: ${createdUsers}`);
    console.log(`⚠️  Skipped (already exist): ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📊 Total processed: ${rawData.length} entries`);

    // Show errors if any
    if (errors.length > 0) {
      console.log("\n❌ Detailed Error Report:");
      errors.forEach((err) => {
        console.log(
          `   Line ${err.line}: ${err.username} (${err.type}) - ${err.error}`
        );
      });
    }

    // Show final database state
    const totalUsers = await User.countDocuments();
    const totalAdmins = await Admin.countDocuments();
    console.log(`\n📊 Final database state:`);
    console.log(`   👤 Total users: ${totalUsers}`);
    console.log(`   👨‍💼 Total admins: ${totalAdmins}`);

    console.log("\n🎉 User import completed successfully!");
    console.log("\n📋 Default Login Credentials:");
    console.log("   Password for all users: Password12$");
    console.log(
      "   Usernames: As specified in CSV (lowercase for regular users)"
    );
    console.log("   Emails: Generated as username@galaxybackbone.com.ng");

    console.log("\n📋 Next steps:");
    console.log("1. Users can login with their username and default password");
    console.log("2. Advise users to change their passwords after first login");
    console.log(
      "3. Review and manually reassign users to appropriate MDAs if needed"
    );
    console.log("4. Test login functionality for both admin and regular users");
  } catch (error) {
    console.error("\n❌ Import failed:");
    console.error(error.message);
    console.error("\nStack trace:");
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
};

/**
 * Parse a CSV line handling quoted fields with commas
 */
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Generate email address from username
 */
function generateEmail(username) {
  // Clean username and make it email-safe
  const cleanUsername = username
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "") // Remove special characters
    .substring(0, 20); // Limit length

  return `${cleanUsername}@galaxybackbone.com.ng`;
}

/**
 * Show usage information
 */
function showUsage() {
  console.log("\n📋 Usage:");
  console.log("npm run import-users <mdaId>");
  console.log("\nExample:");
  console.log("npm run import-users 64f1a2b3c4d5e6f7g8h9i0j1");
  console.log("\n💡 To get MDA IDs, you can:");
  console.log("1. Check your admin interface");
  console.log("2. Run: npm run diagnose-users (shows some MDA info)");
  console.log("3. Use MongoDB shell to query MDAs collection");
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  process.exit(1);
});

// Show usage if no arguments provided
if (process.argv.length < 3) {
  console.log("👥 User Import Script");
  showUsage();
  process.exit(1);
}

// Run the import
importUsersFromCSV();
