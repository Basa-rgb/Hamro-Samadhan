const { Resend } = require("resend");

const resendApiKey = process.env.RESEND_API_KEY?.trim();
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const emailFrom = process.env.EMAIL_FROM?.trim() || "onboarding@resend.dev";

if (resend) {
  console.log("✅ Resend email client is ready");
} else {
  console.error("❌ Email configuration is missing: set RESEND_API_KEY");
}

const BRAND = "Hamro Samadhan";

const siteUrl = () => {
  const explicit = process.env.PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const firstAllowed = process.env.CLIENT_URL?.split(",")[0]?.trim();
  if (firstAllowed) return firstAllowed.replace(/\/+$/, "");

  return "http://localhost:5173";
};

const trackingLink = (reportId, publicToken) =>
  `${siteUrl()}/track?report=${reportId}&token=${publicToken}`;

// Every mail shares one sender and one layout, so a new kind only supplies text
const sendMail = async ({ to, subject, intro, details, message }) => {
  console.log(`Notification requested; recipient present: ${Boolean(to)}`);

  const rows = details.map(([label, value]) => `${label}: ${value}`).join("\n");

  const text = `
Hello,

${intro}

${rows}

Message:
${message}

Thank you for helping improve our community.

${BRAND}
    `;

  if (!resend) {
    throw new Error("Email is not configured: set RESEND_API_KEY");
  }

  const { data, error } = await resend.emails.send({
    from: `"${BRAND}" <${emailFrom}>`,
    to,
    subject,
    text,
  });

  if (error) {
    throw new Error(`Resend ${error.name || "error"}: ${error.message}`);
  }

  // Log only delivery metadata, never the message contents or credentials.
  console.log(
    `Email accepted by Resend: ${data?.id || "unknown"} to ${to}`,
  );
};

// Status, priority and department mails all report the same snapshot
const reportState = ({ status, priority, department }) => [
  ["Status", status],
  ["Priority", priority],
  ["Department", department || "Not assigned"],
];

// Sent once, right after a citizen submits a report
const sendReportSubmitted = async ({
  email,
  reportId,
  title,
  category,
  location,
  publicToken,
}) => {
  const link = publicToken ? trackingLink(reportId, publicToken) : null;

  await sendMail({
    to: email,
    subject: `Your report ${reportId} has been submitted`,
    intro: `Thank you for reporting a problem in your area. Your report has been received and is waiting to be reviewed by the administration.`,
    details: [
      ["Report ID", reportId],
      ["Title", title],
      ["Category", category],
      ["Location", location],
      ...(publicToken ? [["Tracking code", publicToken]] : []),
    ],
    message: [
      "You will receive another email whenever your report is assigned to a department or updated.",
      link
        ? `\nView your report: ${link}\nKeep this link private.`
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
  });
};

// Each status carries its own wording, so the mail still explains itself
// when an admin leaves the message empty
const statusMessages = {
  PENDING: "Your report is queued and will be reviewed shortly.",
  UNDER_REVIEW: "Your report is now under review by the administration.",
  IN_PROGRESS: "Work on your report has started.",
  RESOLVED: "Your report has been resolved.",
  REJECTED: "Your report has been rejected.",
};

// Sent when an admin moves a report through the status list
const sendReportStatusChanged = async ({
  email,
  reportId,
  status,
  priority,
  department,
  message,
}) => {
  await sendMail({
    to: email,
    subject: `Update on your report ${reportId}`,
    intro: `Your report ${reportId} has been marked as ${status}.`,
    details: reportState({ status, priority, department }),
    message: message || statusMessages[status],
  });
};

// Sent when an admin routes a report to a department
const sendReportDepartmentAssigned = async ({
  email,
  reportId,
  status,
  priority,
  department,
  message,
}) => {
  await sendMail({
    to: email,
    subject: `Update on your report ${reportId}`,
    intro: `Your report ${reportId} has been assigned to ${department}.`,
    details: reportState({ status, priority, department }),
    message:
      message || `Our ${department} team has been notified and will take it from here.`,
  });
};

// Sent when an admin reorders the queue
const sendReportPriorityChanged = async ({
  email,
  reportId,
  status,
  priority,
  department,
  message,
}) => {
  await sendMail({
    to: email,
    subject: `Update on your report ${reportId}`,
    intro: `The priority of your report ${reportId} has been changed to ${priority}.`,
    details: reportState({ status, priority, department }),
    message:
      message ||
      "A higher priority means your report will be looked at sooner.",
  });
};

module.exports = {
  sendReportSubmitted,
  sendReportStatusChanged,
  sendReportDepartmentAssigned,
  sendReportPriorityChanged,
};