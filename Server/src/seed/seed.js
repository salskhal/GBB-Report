import dotenv from "dotenv";
import connectDB from "../config/database.js";
import Admin from "../models/Admin.js";
import MDA from "../models/MDA.js";
import User from "../models/User.js";

// Load environment variables
dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();

    // Clear existing data
    await Admin.deleteMany({});
    await MDA.deleteMany({});
    await User.deleteMany({});

    // Create Super Admin
    const admin = await Admin.create({
      name: "Super Admin",
      email: "olaniyisal@gmail.com",
      password: "Kh@lid2165",
      role: "superadmin",
    });

    console.log("✅ Super Admin created:", admin.email);

    console.log("\n🎉 Database seeded successfully!");
    console.log("\n📋 Login Credentials:");
    console.log("Super Admin: olaniyisal@gmail.com / Kh@lid2165");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

// Run the seeder
seedDatabase();
