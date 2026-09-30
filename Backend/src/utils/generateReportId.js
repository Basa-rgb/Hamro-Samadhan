const Counter = require("../models/Counter");

// Builds a readable id like HS-2026-000042
const generateReportId = async () => {
  try {
    const year = new Date().getFullYear();
    // findOneAndUpdate increments atomically, so ids never repeat
    const number = await Counter.findOneAndUpdate(
      { name: "report" },
      { $inc: { sequence: 1 } },
      { new: true, upsert: true },
    );
    // Zero pad to six digits so the id length never changes
    const numbers = String(number.sequence);
    const formattedNumber = numbers.padStart(6, "0");
    return `HS-${year}-${formattedNumber}`;
  } catch (error) {
    // Let the caller handle the failure instead of returning a bad id
    console.log(`Error generating report ID: ${error.message}`);
    throw error;
  }
};


module.exports = generateReportId;