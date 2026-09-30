const mongoose = require("mongoose");

// Staff account used to sign in to the admin portal
const UserSchema = new mongoose.Schema(
  {
    // Login credentials
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    // Every staff account has the same rights, so there is one role only
    role: {
      type: String,
      enum: ["admin"],
      default: "admin",
    },

    // Soft delete, so past reports keep pointing at a real user
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    // Adds createdAt and updatedAt
    timestamps: true,
  }
);

module.exports = mongoose.model("User", UserSchema);
