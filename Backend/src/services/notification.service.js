const nodemailer = require("nodemailer");

// Render times out outbound SMTP connections. Use Gmail API over HTTPS in
// production and keep SMTP only as a local fallback.
let transporter = null;
const gmailApiConfig = [
  process.env.GMAIL_USE_API === "true",
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REFRESH_TOKEN,
].every(Boolean);

if (gmailApiConfig) {
  console.log("✅ Gmail API email client is ready");
} else if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    // Do not let a slow SMTP connection keep a report submission pending.
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  console.log("✅ Gmail email client is ready");

  transporter
    .verify()
    .then(() => console.log("✅ Gmail SMTP verification passed"))
    .catch((error) =>
      console.log(
        `❌ Gmail SMTP verification failed: ${JSON.stringify({
          code: error.code,
          responseCode: error.responseCode,
          command: error.command,
          message: error.message,
        })}`,
      ),
    );
} else {
  console.error(
    "❌ Email configuration is missing: set Gmail API OAuth variables",
  );
}

const getGmailAccessToken = async () => {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GMAIL_CLIENT_ID,
      client_secret: process.env.GMAIL_CLIENT_SECRET,
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      `Gmail OAuth ${response.status}: ${result.error_description || result.error}`,
    );
  }

  return result.access_token;
};

if (gmailApiConfig) {
  getGmailAccessToken()
    .then(() => console.log("✅ Gmail API verification passed"))
    .catch((error) => console.log(`❌ Gmail API verification failed: ${error.message}`));
}

const BRAND = "Hamro Samadhan";

// Every mail shares one sender and one layout, so a new kind only supplies text
const sendMail = async ({ to, subject, intro, details, message }) => {
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

  if (gmailApiConfig) {
    const accessToken = await getGmailAccessToken();
    const rawMessage = [
      `From: Hamro Samadhan <${process.env.GMAIL_USER}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "",
      text,
    ].join("\\r\\n");

    const response = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
        body: JSON.stringify({
          raw: Buffer.from(rawMessage).toString("base64url"),
        }),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        `Gmail API ${response.status}: ${result.error?.message || "email rejected"}`,
      );
    }

    console.log(`Email accepted by Gmail API: ${result.id} to ${to}`);
    return;
  }

  if (!transporter) {
    throw new Error(
      "Email is not configured, set Gmail API OAuth variables",
    );
  }

  // Local Gmail fallback; Render uses the Gmail API branch above.
  const result = await transporter.sendMail({
    from: `"${BRAND}" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    text,
  });

  // Log only delivery metadata, never the message contents or credentials.
  console.log(
    `Email accepted by Gmail: ${result.messageId} to ${to}`,
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