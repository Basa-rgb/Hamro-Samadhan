const mongoose = require("mongoose");

// Every change made to a report, kept as history
const ReportUpdateSchema = new mongoose.Schema(
    {
        report: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Report",
            required: true,
        },

        // Status the report was moved to by this update
        status: {
            type: String,
            enum: [
                "PENDING",
                "UNDER_REVIEW",
                "IN_PROGRESS",
                "RESOLVED",
                "REJECTED",
            ],
            required: true,
        },

        // Optional note explaining the change, shown to the reporter
        message: {
            type: String,
            trim: true,
            maxlength: 1000,
        },

        // Admin or department staff who made the change
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        // Adds createdAt and updatedAt
        timestamps: true,
    }
);

module.exports = mongoose.model("ReportUpdate", ReportUpdateSchema);
