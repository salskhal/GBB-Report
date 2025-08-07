import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();

import { errorHandler } from "./middleware/errorHandler.js";
import connectDB from "./config/database.js";
import { authRoutes } from "./routes/auth.route.js";
import { mdaRoutes } from "./routes/mdas.route.js";
import adminRoutes from "./routes/admin.route.js";
import publicRoutes from "./routes/public.route.js";
import { profileRoutes } from "./routes/profile.route.js";

const app = express();

// Connect to MongoDB
await connectDB();

// Security middleware
app.use(helmet());


// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// CORS configuration
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://yourdomain.com"]
        : ["http://localhost:5174", "http://localhost:5173"],
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan("combined"));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Route implementations
app.use("/api/public", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/mdas", mdaRoutes);
app.use("/api/profile", profileRoutes);

// Base Route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Backend API for Report Admin Dashboard",
    version: process.env.npm_package_version || "1.0.0",
  });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`
  );
});

export default app;
