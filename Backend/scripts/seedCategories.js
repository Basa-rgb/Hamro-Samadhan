require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("../src/models/Category");
const { categories } = require("../src/constants/categories");

// One-off script: fills the category collection with the starter complaint types.
//
// The server also calls this on boot when the collection is empty, so this script
// is only needed to seed ahead of the first start or to top the collection up
// after it has been emptied.
//
// Adds any value that is missing. Never renames, never reorders and never
// reactivates a category an admin has edited, because those rows already exist
// and are left untouched.
const categorySeed = async () => {
  try {
    await mongoose.connect(process.env.MONGOOSE_URL);
    console.log("Database connected successfully");

    const existingValues = new Set(await Category.distinct("value"));

    const toCreate = categories
      .filter((category) => !existingValues.has(category.value))
      .map((category) => ({
        value: category.value,
        label: category.label,
        labelNe: category.labelNe || "",
        order: category.order,
        isActive: true,
      }));

    if (toCreate.length === 0) {
      console.log(
        `All ${categories.length} categories already exist, nothing added`,
      );
      return;
    }

    await Category.insertMany(toCreate);

    console.log(
      `Categories seeded successfully: ${toCreate.length} added, ${await Category.countDocuments()} total`,
    );
  } catch (error) {
    console.error("Seed error:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
};

// Run it with: node scripts/seedCategories.js
categorySeed();