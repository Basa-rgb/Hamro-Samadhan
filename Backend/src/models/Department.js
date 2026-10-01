const mongoose = require("mongoose");

// Department that reports get assigned to
const DepartmentSchema = new mongoose.Schema(
    {
        // Name must stay unique, it is used to look the department up
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },

        // The complaint types this department is responsible for, stored as the
        // category values, not ids.
        //
        // This is what decides two things. It suggests which department an
        // unassigned report belongs to, and it is the whole visible world of a
        // department admin: they only see reports whose category is in this
        // list. A department with an empty list handles nothing and can still be
        // assigned to by hand.
        categories: {
            type: [String],
            default: [],
        },

        // Inactive departments are hidden but keep their old reports
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

module.exports = mongoose.model("Department", DepartmentSchema);
