import dotenv from "dotenv";
import connectDB from "../config/database.js";
import Admin from "../models/Admin.js";
import MDA from "../models/MDA.js";
import User from "../models/User.js";
import Activity from "../models/Activity.js";

// Load environment variables
dotenv.config();

const seedDatabase = async () => {
  try {
    console.log("🔄 Starting Super Admin seeding process...");
    // Connect to database
    await connectDB();
    console.log("✅ Database connected successfully");

    // Clear existing data
    await Admin.deleteMany({});
    await MDA.deleteMany({});
    await User.deleteMany({});
    await Activity.deleteMany({});

    // Get super admin credentials from environment variables or use defaults
    const superAdminData = {
      name: process.env.SUPER_ADMIN_NAME || "Super Administrator",
      email: process.env.SUPER_ADMIN_EMAIL || "admin@galaxybackbone.com.ng",
      password: process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin123!",
      role: "superadmin",
      canBeDeleted: false, // Explicitly set to false for super admin
    };

    // Validate required data
    if (
      !superAdminData.name ||
      !superAdminData.email ||
      !superAdminData.password
    ) {
      throw new Error("Super admin name, email, and password are required");
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(superAdminData.email)) {
      throw new Error("Invalid email format for super admin");
    }

    // Validate password strength
    if (superAdminData.password.length < 8) {
      throw new Error(
        "Super admin password must be at least 8 characters long"
      );
    }

    console.log("🔄 Creating Super Admin account...");

    // Create Super Admin
    const superAdmin = await Admin.create(superAdminData);

    console.log("✅ Super Admin created successfully!");
    console.log("\n📋 Super Admin Details:");
    console.log(`   ID: ${superAdmin._id}`);
    console.log(`   Name: ${superAdmin.name}`);
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Role: ${superAdmin.role}`);
    console.log(`   Can Be Deleted: ${superAdmin.canBeDeleted}`);
    console.log(`   Created: ${superAdmin.createdAt}`);

    console.log("\n🔐 Login Credentials:");
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Password: ${superAdminData.password}`);

    console.log("\n⚠️  IMPORTANT SECURITY NOTES:");
    console.log(
      "   1. Change the default password immediately after first login"
    );
    console.log("   2. Store credentials securely");
    console.log(
      "   3. The super admin account cannot be deleted through the application"
    );
    console.log(
      "   4. Only the super admin can create and manage other admin accounts"
    );

    console.log("\n🎉 Super Admin seeding completed successfully!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error during Super Admin seeding:");
    console.error(`   ${error.message}`);

    if (error.name === "ValidationError") {
      console.error("\n📝 Validation Errors:");
      Object.values(error.errors).forEach((err) => {
        console.error(`   - ${err.message}`);
      });
    }

    if (error.code === 11000) {
      console.error(
        "\n   This usually means an admin with this email already exists."
      );
      console.error("   Check the database or use a different email address.");
    }

    console.error("\n🔧 Troubleshooting:");
    console.error("   1. Ensure MongoDB is running and accessible");
    console.error("   2. Check database connection string in .env file");
    console.error("   3. Verify environment variables are set correctly");
    console.error("   4. Ensure no existing admin has the same email address");

    process.exit(1);
  }
};

// Handle process termination gracefully
process.on("SIGINT", () => {
  console.log("\n⚠️  Process interrupted. Exiting gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n⚠️  Process terminated. Exiting gracefully...");
  process.exit(0);
});

// Run the seeder if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export default seedDatabase;
