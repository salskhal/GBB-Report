// database.js
import mongoose from "mongoose";

// Function to connect to MongoDB with retry
const connectDB = async (retries = 5, delay = 5000) => {
  try {
    // Retrieve MongoDB connection string from environment variable
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error(
        "MONGODB_URI is not defined in the environment variables"
      );
    }

    // Connect to MongoDB using Mongoose
    await mongoose.connect(mongoURI, {
      // No deprecated options needed
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      maxPoolSize: 10, // Maintain up to 10 socket connections
    });

    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    if (retries > 0) {
      console.log(`Retrying connection (${retries} attempts left)...`);
      setTimeout(() => connectDB(retries - 1, delay), delay);
    } else {
      console.error("Max retries reached. Exiting...");
      process.exit(1); // Exit process with failure code
    }
  }
};

// Handle Mongoose connection events
mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to database");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected from database");
});

// Handle process termination gracefully
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("MongoDB connection closed due to app termination");
  process.exit(0);
});

// Export the connectDB function
export default connectDB;
