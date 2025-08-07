import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ["superadmin", "admin"],
        message: "Role must be either 'superadmin' or 'admin'",
      },
      default: "admin",
    },
    canBeDeleted: {
      type: Boolean,
      default: true,
      validate: {
        validator: function(value) {
          // Super admin cannot be deleted
          if (this.role === "superadmin" && value === true) {
            return false;
          }
          return true;
        },
        message: "Super admin cannot be set as deletable",
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: function() {
        // CreatedBy is required for regular admins, but not for super admin
        return this.role !== "superadmin";
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
adminSchema.index({ email: 1 });
adminSchema.index({ role: 1 });
adminSchema.index({ isActive: 1 });
adminSchema.index({ createdBy: 1 });


// Set canBeDeleted to false for super admin
adminSchema.pre("save", function (next) {
  if (this.role === "superadmin") {
    this.canBeDeleted = false;
  }
  next();
});

// Hash password before saving
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(
    this.password,
    parseInt(process.env.BCRYPT_SALT_ROUNDS)
  );
  next();
});

// Method to check password
adminSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;
