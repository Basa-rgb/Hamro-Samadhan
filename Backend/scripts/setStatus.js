require("dotenv").config();

const mongoose = require("mongoose");
const Report = require("../src/models/Report");

const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;

// The token is only ever set as an http-only cookie, so it is pulled from the header
const login = async (email, password) => {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Login failed with status ${response.status}`);
  }

  return response.headers.getSetCookie()[0].split(";")[0];
};

// Changing the status in MongoDB skips the controller, so no mail is sent
// This calls the admin route instead, which updates the report and mails the reporter
const setReportStatus = async () => {
  const [, , reportId, status, message = ""] = process.argv;

  if (!reportId || !status) {
    console.log("Usage: node scripts/setStatus.js <reportId> <status> [message]");
    console.log("Statuses: PENDING, UNDER_REVIEW, IN_PROGRESS, RESOLVED, REJECTED");
    return;
  }

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first");
    return;
  }

  try {
    // The route works on the mongo id, so the public report id is resolved first
    await mongoose.connect(process.env.MONGOOSE_URL);

    const report = await Report.findOne({ reportId }).select("_id");

    if (!report) {
      console.log("Report not found:", reportId);
      return;
    }

    const cookie = await login(email, password);

    const response = await fetch(`${BASE_URL}/api/admin/${report._id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ status, message }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`Status set to ${status} and reporter notified by email`);
    } else {
      console.log("Request failed:", result.message || result);
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.connection.close();
  }
};

// Run it with: node scripts/setStatus.js HS-2026-000017 IN_PROGRESS "Work has started"
setReportStatus();