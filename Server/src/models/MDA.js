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
    reports: {
      type: [
        {
          title: {
            type: String,
            required: [true, "Report title is required"],
            trim: true,
            maxlength: [100, "Report title cannot exceed 100 characters"],
          },
          url: {
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
      ],
      required: [true, "At least one report is required"],
      validate: {
        validator: function (reports) {
          return reports && reports.length > 0;
        },
        message: "MDA must have at least one report",
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
mdaSchema.index({ "reports.isActive": 1 }); // Index for active reports

const MDA = mongoose.model("MDA", mdaSchema);

export default MDA;
