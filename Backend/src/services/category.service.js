const Category = require("../models/Category");
const { categories: starterCategories } = require("../constants/categories");

// Fills the category collection from the starter list in
// src/constants/categories.js when it is empty.
//
// Idempotent by value, so running it on every boot is safe: a value that is
// already there is skipped, never overwritten. That matters because an admin may
// have renamed a label or retired a category, and a boot must not quietly undo
// that.
//
// Only inserts into an empty collection. A partially filled collection is left
// alone, because a missing value there is far more likely to be deliberate than
// a half finished seed.
const ensureCategories = async () => {
  const existingCount = await Category.countDocuments({});

  if (existingCount > 0) {
    return { inserted: 0, total: existingCount };
  }

  await Category.insertMany(
    starterCategories.map((category) => ({
      value: category.value,
      label: category.label,
      labelNe: category.labelNe || "",
      order: category.order,
      isActive: true,
    })),
  );

  return {
    inserted: starterCategories.length,
    total: starterCategories.length,
  };
};

// True when the value names a category a citizen may currently pick.
//
// Retired categories are rejected here, which is what stops the public form
// quietly accepting a type that is no longer offered.
const isActiveCategory = async (value) => {
  if (!value) return false;

  const category = await Category.exists({ value, isActive: true });

  return Boolean(category);
};

// Resolves a list of category values against the collection and drops any that
// no longer exist, so a department can never be saved holding a value that was
// deleted. Used when an admin assigns categories to a department.
const cleanCategoryValues = async (values) => {
  if (!Array.isArray(values)) return [];

  const wanted = [...new Set(values.map((value) => String(value).trim()).filter(Boolean))];

  if (!wanted.length) return [];

  const found = await Category.find({ value: { $in: wanted } })
    .select("value")
    .lean();

  const known = new Set(found.map((category) => category.value));

  return wanted.filter((value) => known.has(value));
};

module.exports = {
  ensureCategories,
  isActiveCategory,
  cleanCategoryValues,
};