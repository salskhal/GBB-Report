import mongoose from "mongoose";

const mdaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "MDA name is required"],
      trim: true,
      unique: true,
      maxlength: [100, "MDA name cannot exceed 100 characters"],
    },
    reportUrl: {
      type: String,
      required: [true, "Report URL is required"],
      trim: true,
      validate: {
        validator: function (url) {
          return /^https?:\/\/.+/.test(url);
        },
        message: "Please provide a valid URL",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
mdaSchema.index({ name: 1 });
mdaSchema.index({ isActive: 1 });

const MDA = mongoose.model("MDA", mdaSchema);

export default MDA;
