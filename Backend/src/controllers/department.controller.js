const Report = require("../models/Report");
const ReportUpdate = require("../models/ReportUpdate");
const Department = require("../models/Department");
const {
  sendReportDepartmentAssigned,
} = require("../services/notification.service");
// create Department
const createDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "All fields are requird",
      });
    }
    await Department.create({
      name: name,
      description: description,
    });

    return res.status(201).json({
      success: true,
      message: "Department created successfully",
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
    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: "Department ID is required",
      });
    }
    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
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
    const { name, description, isActive } = req.body;

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

module.exports = {
  createDepartment,
  getAllDepartments,
  assignDepartment,
  updateDepartment,
};
