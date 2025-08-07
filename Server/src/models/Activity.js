import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "Admin ID is required"],
    },
    adminName: {
      type: String,
      required: [true, "Admin name is required"],
      trim: true,
    },
    action: {
      type: String,
      required: [true, "Action is required"],
      enum: {
        values: ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT"],
        message: "Action must be one of: CREATE, UPDATE, DELETE, LOGIN, LOGOUT",
      },
    },
    resourceType: {
      type: String,
      required: [true, "Resource type is required"],
      enum: {
        values: ["USER", "MDA", "ADMIN"],
        message: "Resource type must be one of: USER, MDA, ADMIN",
      },
    },
    resourceId: {
      type: String,
      required: function() {
        // Resource ID is required for all actions except LOGIN/LOGOUT
        return !["LOGIN", "LOGOUT"].includes(this.action);
      },
      default: null,
    },
    resourceName: {
      type: String,
      required: function() {
        // Resource name is required for all actions except LOGIN/LOGOUT
        return !["LOGIN", "LOGOUT"].includes(this.action);
      },
      trim: true,
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      required: [true, "IP address is required"],
      validate: {
        validator: function(ip) {
          // Basic IP validation (IPv4 and IPv6)
          const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
          const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
          return ipv4Regex.test(ip) || ipv6Regex.test(ip) || ip === "::1" || ip === "127.0.0.1";
        },
        message: "Please provide a valid IP address",
      },
    },
    userAgent: {
      type: String,
      required: [true, "User agent is required"],
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: [true, "Timestamp is required"],
    },
  },
  {
    timestamps: false, // We use our own timestamp field
  }
);

// Indexes for efficient querying and activity log filtering
activitySchema.index({ adminId: 1, timestamp: -1 });
activitySchema.index({ action: 1, timestamp: -1 });
activitySchema.index({ resourceType: 1, timestamp: -1 });
activitySchema.index({ timestamp: -1 }); // Primary sorting index
activitySchema.index({ adminId: 1, action: 1, resourceType: 1, timestamp: -1 }); // Compound index for complex filters

// Static method to log activity
activitySchema.statics.logActivity = async function(activityData) {
  try {
    const activity = new this(activityData);
    const savedActivity = await activity.save();
    return savedActivity;
  } catch (error) {
    console.error("Failed to log activity:", error);
    console.error("Activity data:", activityData);
    // Don't throw error to prevent activity logging from breaking main operations
    return null;
  }
};

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;