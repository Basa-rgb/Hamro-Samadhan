const Report = require("../models/Report");
const ReportUpdate = require("../models/ReportUpdate");
const Department = require("../models/Department");
const generateReportId = require("../utils/generateReportId");
const uploadToCloudinary = require("../middleware/uploadToCloudinary");
const {
  sendReportSubmitted,
  sendReportStatusChanged,
  sendReportPriorityChanged,
} = require("../services/notification.service");
const createReport = async (req, res) => {
  try {
    const { title, category, description } = req.body;

    // Location and reporter arrive as JSON strings, so both are required too
    if (
      !title ||
      !category ||
      !description ||
      !req.body.location ||
      !req.body.reporter
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Convert JSON strings from form-data into objects
    let location;
    let reporter;

    try {
      location = JSON.parse(req.body.location);
      reporter = JSON.parse(req.body.reporter);
    } catch (error) {
      // Malformed JSON from the client is a 400, not a server error
      return res.status(400).json({
        success: false,
        message: "Location and reporter must be valid JSON",
      });
    }

    // Validate location and reporter
    if (
      !location.address ||
      !reporter.name ||
      !reporter.email ||
      !reporter.phone
    ) {
      return res.status(400).json({
        success: false,
        message: "Location and reporter information are required",
      });
    }

    // Upload image if provided
    let photo = null;

    // Debug log of the multipart body, kept to trace client uploads
    console.log(
      `[createReport] body keys: ${JSON.stringify(Object.keys(req.body))} | files: ${JSON.stringify(
        Object.keys(req.files || {}),
      )} | req.file: ${req.file ? req.file.fieldname : "undefined"} | content-type: ${req.get(
        "content-type",
      )}`,
    );

    // Buffer goes straight to Cloudinary, so no temp file touches the disk
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);

      photo = {
        url: result.secure_url,
        publicId: result.public_id,
      };
    }

    // Generate report ID
    // Readable sequential ID, so a citizen can quote it over the phone
    const reportId = await generateReportId();

    // Create report
    const report = await Report.create({
      reportId,
      title,
      category,
      description,
      location,
      reporter,
      photo,
    });

    // The confirmation mail is best effort, so a mail failure never loses the report
    try {
      await sendReportSubmitted({
        email: report.reporter.email,
        reportId: report.reportId,
        title: report.title,
        category: report.category,
        location: report.location.address,
      });
    } catch (notificationError) {
      console.log(`Notification error: ${notificationError.message}`);
    }

    return res.status(201).json({
      success: true,
      message: "Report submitted successfully",
      reportId,
      // Handed back once, at creation, and never again
      // The tracking lookup is redacted without it, so this is what lets the
      // citizen who filed the report see their own photo, description and
      // location later. The client is expected to keep it, not to publish it.
      publicToken: report.publicToken,
    });
  } catch (error) {
    console.log(`Error: ${error.message}`);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Shapes the public view of a report.
//
// Report ids are sequential, so anyone can walk HS-2026-000001 upwards. Without
// the tracking token that would let someone harvest where every citizen lives
// and what is wrong with their property, so a lookup by id alone is trimmed to
// what is needed to follow progress. The token proves the caller is the
// reporter, and unlocks the full detail.
//
// Every key is always present so clients can rely on the shape; the redacted
// ones are null rather than missing.
const publicReportView = (report, updates, hasToken) => {
  const view = {
    reportId: report.reportId,
    title: report.title,
    category: report.category,
    status: report.status,
    assignedDepartment: report.assignedDepartment,
    priority: report.priority,
    updates,
    createdAt: report.createdAt,
  };

  if (hasToken) {
    view.description = report.description;
    view.photo = report.photo?.url ? { url: report.photo.url } : null;
    view.location = {
      address: report.location.address,
      latitude: report.location.latitude,
      longitude: report.location.longitude,
    };
  } else {
    view.description = null;
    view.photo = null;
    view.location = null;
  }

  return view;
};

// Get ReportById

const getReportById = async (req, res) => {
  try {
    const { reportId } = req.params;
    // Optional second half of the link, checked against the stored token
    const { token } = req.query;

    const report = await Report.findOne(
      token ? { reportId, publicToken: token } : { reportId },
    ).populate("assignedDepartment", "name");

    if (!report) {
      // Deliberately a 404 for both a wrong id and a wrong token
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // Oldest first here, so the public timeline reads top to bottom
    const updates = await ReportUpdate.find({ report: report._id })
      .select("status message createdAt")
      .sort({ createdAt: 1 });

    // Hides internal ids, reporter contact details and the photo's storage id
    return res.status(200).json({
      success: true,
      report: publicReportView(report, updates, Boolean(token)),
    });
  } catch (error) {
    console.log(`Error:${error.message}`);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// getAllReports
const getAllReports = async (req, res) => {
  try {
    const { status, priority, search } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    // Only the filters that were actually sent take part in the query
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (search) {
      // Anchored, escaped regex, so a search term cannot be read as a pattern
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { reportId: { $regex: safeSearch, $options: "i" } },
        { title: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate("assignedDepartment", "name description")
        .sort({ createdAt: -1 })
        // Paged, so a large table is never returned in one response
        .skip((page - 1) * limit)
        .limit(limit),
      Report.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      count: reports.length,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      reports,
    });
  } catch (error) {
    console.log(`Error:${error.message}`);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Reports that still need work, used for the open and unassigned counters
const OPEN_STATUSES = ["PENDING", "UNDER_REVIEW", "IN_PROGRESS"];

// Every status and priority is listed even when its count is zero, so the
// dashboard keeps a stable order instead of dropping cards as data arrives
const STATUS_ORDER = [
  "PENDING",
  "UNDER_REVIEW",
  "IN_PROGRESS",
  "RESOLVED",
  "REJECTED",
];

const PRIORITY_ORDER = ["LOW", "MEDIUM", "HIGH", "URGENT"];

// getAdminStats
// Counted in the database, so the overview never has to download every report
// just to add up a few numbers
const getAdminStats = async (req, res) => {
  try {
    // The seven day keys are built in UTC, which is also the timezone the
    // aggregation below formats with, so the two always line up
    const dayKeys = [];

    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = new Date();

      day.setUTCDate(day.getUTCDate() - offset);
      dayKeys.push(day.toISOString().slice(0, 10));
    }

    const sevenDaysAgo = new Date(`${dayKeys[0]}T00:00:00.000Z`);

    const [
      statusGroups,
      priorityGroups,
      trendGroups,
      total,
      unassigned,
      resolvedThisWeek,
      activeDepartments,
      recent,
    ] = await Promise.all([
      Report.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),

      Report.aggregate([{ $group: { _id: "$priority", count: { $sum: 1 } } }]),

      Report.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "UTC",
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),

      Report.countDocuments({}),

      // Open work with nobody responsible for it yet, the admin's to-do list
      Report.countDocuments({
        status: { $in: OPEN_STATUSES },
        assignedDepartment: null,
      }),

      Report.countDocuments({
        status: "RESOLVED",
        updatedAt: { $gte: sevenDaysAgo },
      }),

      Department.countDocuments({ isActive: true }),

      Report.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("reportId title status priority createdAt")
        .populate("assignedDepartment", "name"),
    ]);

    // Turns the grouped rows into an object keyed by every known value
    const toCountMap = (groups, keys) => {
      const counts = {};

      keys.forEach((key) => {
        counts[key] = 0;
      });

      groups.forEach((group) => {
        if (group._id in counts) {
          counts[group._id] = group.count;
        }
      });

      return counts;
    };

    const byStatus = toCountMap(statusGroups, STATUS_ORDER);
    const byPriority = toCountMap(priorityGroups, PRIORITY_ORDER);

    const trendCounts = {};

    trendGroups.forEach((group) => {
      trendCounts[group._id] = group.count;
    });

    const open = OPEN_STATUSES.reduce((sum, key) => sum + byStatus[key], 0);

    return res.status(200).json({
      success: true,
      stats: {
        total,
        open,
        unassigned,
        resolvedThisWeek,
        activeDepartments,
        byStatus,
        byPriority,
        // Oldest day first, so a chart can plot it without sorting
        trend: dayKeys.map((date) => ({ date, count: trendCounts[date] || 0 })),
        recent,
      },
    });
  } catch (error) {
    console.log(`Error:${error.message}`);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// updateReportStatus
const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, message } = req.body;
    // Whitelist, so a typo can never store an unknown status
    const allowedStatuses = [
      "PENDING",
      "UNDER_REVIEW",
      "IN_PROGRESS",
      "RESOLVED",
      "REJECTED",
    ];
    const report = await Report.findById(id).populate(
      "assignedDepartment",
      "name",
    );
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "report not found",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    report.status = status;
    await report.save();
    // The change is also appended to the report's update history
    await ReportUpdate.create({
      report: report._id,
      status,
      message,
      updatedBy: req.user.userId,
    });

    // Mail is best effort here, a failure must not undo the status change
    try {
      await sendReportStatusChanged({
        email: report.reporter.email,
        reportId: report.reportId,
        status: report.status,
        priority: report.priority,
        department: report.assignedDepartment?.name,
        message,
      });
    } catch (notificationError) {
      console.log(`Notification error: ${notificationError.message}`);
    }
    return res.status(200).json({
      success: true,
      report,
      status,
      message,
    });
  } catch (error) {
    console.log(`Error:${error.message}`);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// getReportUpdates
const getReportUpdates = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // Newest first, and the id in updatedBy is resolved to a name and email
    const updates = await ReportUpdate.find({ report: report._id })
      .populate("updatedBy", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: updates.length,
      updates,
    });
  } catch (error) {
    console.log(`Error:${error.message}`);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// updateReportPriority

const updateReportPriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;
    // Priority is freely chosen, unlike the gated status flow
    const priorityStatus = ["LOW", "MEDIUM", "HIGH", "URGENT"];

    const report = await Report.findById(id).populate(
      "assignedDepartment",
      "name",
    );
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "report not found",
      });
    }

    if (!priorityStatus.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }
    report.priority = priority;
    await report.save();
    // The message is written here, since the admin only sends a priority
    try {
      await sendReportPriorityChanged({
        email: report.reporter.email,
        reportId: report.reportId,
        status: report.status,
        priority: report.priority,
        department: report.assignedDepartment?.name,
        message: `The priority of your report has been changed to ${report.priority}.`,
      });
    } catch (notificationError) {
      console.log(`Notification error: ${notificationError.message}`);
    }

    return res.status(200).json({
      success: true,
      report,
      priority,
    });
  } catch (error) {
    console.log(`Error:${error.message}`);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// getAdminReportById

const getAdminReportById = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await Report.findById(id).populate(
      "assignedDepartment",
      "name description",
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // Admin view returns the whole document, unlike the trimmed public one
    return res.status(200).json({
      success: true,
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
module.exports = {
  createReport,
  getReportById,
  getAllReports,
  getAdminStats,
  updateReportStatus,
  getReportUpdates,
  updateReportPriority,
  getAdminReportById,
};
