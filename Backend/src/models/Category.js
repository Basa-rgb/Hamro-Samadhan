const mongoose = require("mongoose");

// The complaint types a citizen can pick.
//
// This used to be an enum baked into the schema and duplicated in the frontend.
// It is a collection now, so an admin can add or retire a type without a deploy
// and both the public form and the admin screens read the same rows.
//
// Report.category stores the value (the slug), not the ObjectId, so a report
// keeps working if the row is later renamed, and a category can be retired
// without touching the reports already filed under it.
const CategorySchema = new mongoose.Schema(
  {
    // The stored slug, for example road_damage. Unique, and never changed once
    // created, because reports and department category lists both point at it
    value: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    // What a citizen reads in the dropdown
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    // Nepali label, so the public form does not fall back to English on the
    // Nepali site. Optional, the label is used when this is empty
    labelNe: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },

    // Sort order in the dropdown, so an admin can put the common complaints
    // first without renaming anything
    order: {
      type: Number,
      default: 100,
    },

    // A retired category disappears from the public dropdown and cannot be
    // picked for a new report, but reports already filed under it stay intact
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Category", CategorySchema);