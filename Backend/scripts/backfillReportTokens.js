require("dotenv").config({ quiet: true });

const mongoose = require("mongoose");
const crypto = require("crypto");
const Report = require("../src/models/Report");

// Reports created before publicToken existed have none, which would leave their
// tracking links dead. This fills in a token for every one that is missing.
const backfillTokens = async () => {
  try {
    await mongoose.connect(process.env.MONGOOSE_URL);
    console.log("Database connected successfully");

    // Filtered on the field itself, so re-running is safe and never rotates a
    // token that citizens are already using
    const missing = await Report.find({
      $or: [{ publicToken: { $exists: false } }, { publicToken: null }],
    }).select("reportId");

    if (missing.length === 0) {
      console.log("Every report already has a tracking token, nothing to do");
      return;
    }

    for (const report of missing) {
      report.publicToken = crypto.randomBytes(24).toString("hex");
      await report.save();
    }

    console.log(`Added a tracking token to ${missing.length} report(s):`);
    for (const report of missing) {
      console.log(`  ${report.reportId}  /track/${report.reportId}/${report.publicToken}`);
    }
  } catch (error) {
    console.error("Backfill error:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
};

// Run it with: node scripts/backfillReportTokens.js
backfillTokens();
