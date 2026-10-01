const mongoose = require("mongoose");
const crypto = require("crypto");

// A complaint filed by a citizen, from submission to resolution
const ReportSchema = new mongoose.Schema(
  {
    // Public id shown to users, built from the Counter sequence
    reportId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    // The complaint type, stored as the category's value rather than its id, so a
    // report keeps its meaning after the category is renamed or retired.
    // There is no enum here on purpose: the list is data now, and an admin can
    // add a type without a deploy. Which values are accepted is decided by the
    // collection, checked in createReport
    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    // Cloudinary upload details for the attached image
    photo: {
      url: {
        type: String,
      },
      publicId: {
        type: String,
      },
    },

    // Where the problem is, used to place it on the map
    location: {
      address: {
        type: String,
        required: true,
        trim: true,
      },

      latitude: {
        type: Number,
      },

      longitude: {
        type: Number,
      },
    },

    // Reporter details, copied in so the report survives account deletion
    reporter: {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },

      phone: {
        type: String,
        required: true,
        trim: true,
      },
    },

    // Reports waiting for the department to act on them start as PENDING
    status: {
      type: String,
      enum: ["PENDING", "UNDER_REVIEW", "IN_PROGRESS", "RESOLVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },

    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM",
      index: true,
    },

    // Empty until the report is routed to a department
    assignedDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },

    // Second, unguessable half of the public link
    // Report ids count up, so on their own they let anyone read every report
    publicToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => crypto.randomBytes(24).toString("hex"),
    },
  },

  {
    // Adds createdAt and updatedAt
    timestamps: true,
  },
);

module.exports = mongoose.model("Report", ReportSchema);
