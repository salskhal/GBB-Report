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
      email: "admin@example.com",
      password: "admin123",
      role: "superadmin",
    });

    console.log("✅ Super Admin created:", admin.email);

    // Create Sample MDAs
    const mdas = await MDA.create([
      {
        name: "Ministry of Health",
        reportUrl: "https://example.com/health-report",
      },
      {
        name: "Ministry of Education",
        reportUrl: "https://example.com/education-report",
      },
      {
        name: "Ministry of Finance",
        reportUrl: "https://example.com/finance-report",
      },
    ]);

    console.log("✅ Sample MDAs created:", mdas.length);

    // Create Sample Users
    const users = await User.create([
      {
        name: "John Doe",
        email: "john@health.gov",
        password: "password123",
        mdaId: mdas[0]._id,
      },
      {
        name: "Jane Smith",
        email: "jane@education.gov",
        password: "password123",
        mdaId: mdas[1]._id,
      },
      {
        name: "Bob Johnson",
        email: "bob@finance.gov",
        password: "password123",
        mdaId: mdas[2]._id,
      },
    ]);

    console.log("✅ Sample Users created:", users.length);

    console.log("\n🎉 Database seeded successfully!");
    console.log("\n📋 Login Credentials:");
    console.log("Super Admin: admin@example.com / admin123");
    console.log("User 1: john@health.gov / password123 (Ministry of Health)");
    console.log(
      "User 2: jane@education.gov / password123 (Ministry of Education)"
    );
    console.log("User 3: bob@finance.gov / password123 (Ministry of Finance)");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

// Run the seeder
seedDatabase();
