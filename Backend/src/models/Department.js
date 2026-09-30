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
