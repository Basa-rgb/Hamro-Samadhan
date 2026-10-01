const { Resend } = require("resend");

// The client is only built when a key exists, since the constructor throws,
// and a missing key must not take the whole server down at boot
let resend = null;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log("✅ Resend email client is ready");
} else {
  console.error(
    "❌ RESEND_API_KEY is missing, notification emails will not be sent",
  );
}

const BRAND = "Hamro Samadhan";

// Every mail shares one sender and one layout, so a new kind only supplies text
const sendMail = async ({ to, subject, intro, details, message }) => {
  const rows = details.map(([label, value]) => `${label}: ${value}`).join("\n");

  if (!resend) {
    throw new Error("Resend is not configured, set RESEND_API_KEY");
  }

  // Plain text only, so every mail client shows it the same way
  const { error } = await resend.emails.send({
    from: `"${BRAND}" <${process.env.EMAIL_FROM || "onboarding@resend.dev"}>`,
    to,
    subject,
    text: `
Hello,

${intro}

${rows}

Message:
${message}

Thank you for helping improve our community.

${BRAND}
    `,
  });

  // Resend reports failures in the response instead of throwing,
  // so raise it here and let the callers log it as before
  if (error) {
    throw new Error(error.message);
  }
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
}) => {
  await sendMail({
    to: email,
    subject: `Your report ${reportId} has been submitted`,
    intro: `Thank you for reporting a problem in your area. Your report has been received and is waiting to be reviewed by the administration.`,
    details: [
      ["Report ID", reportId],
      ["Title", title],
      ["Category", category],
      ["Location", location],
    ],
    message:
      "You will receive another email whenever your report is assigned to a department or updated.",
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