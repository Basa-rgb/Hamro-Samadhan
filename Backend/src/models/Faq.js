const mongoose = require("mongoose");

// A question shown on the public FAQ page, written in both site languages
const FaqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
        trim: true,
        maxlength: 300,
    },

    answer: {
      type: String,
      required: true,
        trim: true,
        maxlength: 2000,
    },

        // Nepali columns are optional, so a question can be added in English
        // first and translated later without breaking the page
    questionNe: {
      type: String,
        trim: true,
        maxlength: 300,
        default: "",
    },

    answerNe: {
      type: String,
        trim: true,
        maxlength: 2000,
        default: "",
    },

        // Lower numbers show first, so the page order is decided here
    order: {
        type: Number,
        default: 0,
    },

        // A hidden question keeps its place in the list, it is just not public
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

module.exports = mongoose.model("Faq", FaqSchema);
