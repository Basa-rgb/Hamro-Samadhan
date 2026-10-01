const Category = require("../models/Category");
const Report = require("../models/Report");
const Department = require("../models/Department");
const slugify = require("../utils/slugify");

// The complaint types, out of the database rather than out of a code constant.
//
// Both the public report form and the admin screens read this, which is what
// keeps them from disagreeing: an admin who adds a type here has added it to the
// citizen's dropdown in the same moment.

// Public list, the dropdown on the report form is open to everyone
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select("value label labelNe description order")
      .sort({ order: 1, label: 1 });

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.log(`Error:${error.message}`);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Admin list, retired categories included so they can be brought back
const getAllCategories = async (req, res) => {
  try {
    // Sorted by order so the dropdown preview in the admin screen matches what a
    // citizen sees
    const categories = await Category.find()
      .sort({ order: 1, label: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.log(`Error:${error.message}`);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const createCategory = async (req, res) => {
  try {
    const { label, labelNe, description, order, isActive } = req.body;

    // The value is derived, so the same label always lands on the same value and
    // an admin never has to invent a key. An explicit value is still honoured,
    // which is what the seed and any deliberate rename of the key need
    const value = slugify(req.body.value || label);

    if (!value) {
      return res.status(400).json({
        success: false,
        message: "The label must contain letters or numbers",
      });
    }

    const existing = await Category.findOne({ value });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A category with that value already exists",
      });
    }

    const category = await Category.create({
      value,
      label,
      labelNe,
      description,
      order,
      isActive,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.log(`Error:${error.message}`);

    // 11000 is the unique index on value, so this is a conflict and not a server
    // fault. Two admins creating the same label at once lands here
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A category with that value already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, labelNe, description, order, isActive } = req.body;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Only the fields sent in the body are changed. value is not among them: it
    // is the key every report and every department points at, so changing it
    // would orphan both. Renaming the label is always safe
    if (label !== undefined) {
      category.label = label;
    }

    if (labelNe !== undefined) {
      category.labelNe = labelNe;
    }

    if (description !== undefined) {
      category.description = description;
    }

    if (order !== undefined) {
      category.order = order;
    }

    // Retiring hides the category from the public dropdown and stops new reports
    // being filed under it. Reports already filed stay exactly as they are, which
    // is why this is a flag and not a delete
    if (isActive !== undefined) {
      category.isActive = isActive;
    }

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.log(`Error:${error.message}`);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// A category is never deleted. Reports hold the value as a plain string, so
// removing the row would leave them pointing at nothing and the public tracking
// page would show a bare key. Retiring is the way to stop offering it.
//
// Refuses outright while any department still lists it, so the department and
// category screens cannot drift apart and leave a department claiming to handle
// a type nobody can file.
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const [reportCount, departmentCount] = await Promise.all([
      Report.countDocuments({ category: category.value }),
      Department.countDocuments({ categories: category.value }),
    ]);

    if (reportCount > 0) {
      return res.status(409).json({
        success: false,
        message: `This category has ${reportCount} report(s) and cannot be deleted. Retire it instead.`,
        reports: reportCount,
      });
    }

    if (departmentCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Remove it from ${departmentCount} department(s) first.`,
        departments: departmentCount,
      });
    }

    await category.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.log(`Error:${error.message}`);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  getCategories,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};