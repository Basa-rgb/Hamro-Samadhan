const Report = require("../models/Report");
const Department = require("../models/Department");
const { cleanCategoryValues } = require("../services/category.service");
const { findScopedReport, isOwnDepartment } = require("../middleware/auth");
const {
  sendReportDepartmentAssigned,
} = require("../services/notification.service");

// create Department
const createDepartment = async (req, res) => {
  try {
    const { name, description, categories } = req.body;

    // Unknown values are dropped rather than stored, so a department can never
    // be saved claiming to handle a type that is not in the collection
    const cleanedCategories = await cleanCategoryValues(categories);

    const department = await Department.create({
      name,
      description,
      categories: cleanedCategories,
    });

    return res.status(201).json({
      success: true,
      message: "Department created successfully",
      department,
    });
  } catch (error) {
    console.log(`Error:${error.message}`);

    // 11000 is the unique index on name, so this is a conflict and not a
    // server fault. Without this the admin only sees "internal server error"
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A department with that name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all  Department

const getAllDepartments = async (req, res) => {
  try {
    // Inactive departments are listed too, so an admin can reactivate them
    const departments = await Department.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: departments.length,
      departments,
    });
  } catch (error) {
    console.log(`Error:${error.message}`);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Assign Department

const assignDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { departmentId } = req.body;

    // Read inside the caller's scope, so a department admin cannot route a
    // report they are not allowed to see. Out of scope is a 404, the same answer
    // as a report that does not exist
    const report = await findScopedReport(req, id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // A department admin can only ever confirm their own department. Routing work
    // between departments is the full admin's call, and letting a department
    // admin hand a report to another department would hand them a report they
    // can no longer see
    if (!isOwnDepartment(req, departmentId)) {
      return res.status(403).json({
        success: false,
        message: "You can only assign reports to your own department",
      });
    }

    // A retired department must not take on new work
    const department = await Department.findOne({
      _id: departmentId,
      isActive: true,
    });

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Active department not found",
      });
    }

    // The category list is advice, not a rule. A report filed before the
    // categories were assigned, or one a full admin deliberately routed by hand,
    // must still be assignable, so a mismatch is reported back instead of
    // refused. The client shows it as a hint on the row
    const handlesCategory = department.categories.includes(report.category);

    report.assignedDepartment = department._id;
    await report.save();
    // The reporter is mailed after the save, so a mail failure is only logged
    try {
      await sendReportDepartmentAssigned({
        email: report.reporter.email,
        reportId: report.reportId,
        status: report.status,
        priority: report.priority,
        department: department.name,
        message: `Your report has been assigned to the ${department.name}.`,
      });
    } catch (notificationError) {
      console.log(`Notification error: ${notificationError.message}`);
    }

    return res.status(200).json({
      success: true,
      message: "Department assigned successfully",
      warning: handlesCategory
        ? null
        : `${department.name} does not list "${report.category}" as one of its categories.`,
      report,
    });
  } catch (error) {
    console.log(`Error:${error.message}`);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// updateDepartment

const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive, categories } = req.body;

    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // Only the fields sent in the body are changed, others stay as they are
    if (name !== undefined) {
      department.name = name;
    }

    if (description !== undefined) {
      department.description = description;
    }

    // The complaint types this department owns. This is what a department admin
    // can see, so it is saved through the collection and never as free text
    if (categories !== undefined) {
      department.categories = await cleanCategoryValues(categories);
    }

    // Retiring a department here keeps its old reports and history intact
    if (isActive !== undefined) {
      department.isActive = isActive;
    }

    await department.save();

    return res.status(200).json({
      success: true,
      message: "Department updated successfully",
      department,
    });
  } catch (error) {
    console.log(`Error:${error.message}`);

    // Renaming onto a name that already exists hits the same unique index
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A department with that name already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// The departments that handle a given complaint type.
//
// Used by the admin screens to suggest where an unassigned report belongs, and
// by the report form's help text. "other" is treated as a catch-all, so it is
// offered for every category the same way
const getDepartmentsForCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const departments = await Department.find({
      isActive: true,
      categories: { $in: [category, "other"] },
    }).select("name description categories");

    return res.status(200).json({
      success: true,
      count: departments.length,
      departments,
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
  createDepartment,
  getAllDepartments,
  assignDepartment,
  updateDepartment,
  getDepartmentsForCategory,
};