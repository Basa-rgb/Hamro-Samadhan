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

    // Two kinds of staff account.
    //
    // "admin" sees and edits everything: departments, categories, staff accounts
    // and every report.
    //
    // "department_admin" works inside one department. They can open, update and
    // route the reports whose category that department handles, and nothing
    // else. The scope comes from User.department plus the category list on that
    // department, so it follows the department rather than being set per person.
    role: {
      type: String,
      enum: ["admin", "department_admin"],
      default: "admin",
    },

    // The department a department admin belongs to.
    // Null for a full admin, which is what marks them as unscoped. It is
    // enforced by the controller, not by the schema, so an account can never be
    // left in a half configured state that quietly grants or denies access.
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
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
