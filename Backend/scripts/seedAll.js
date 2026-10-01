// Runs every seed in the order they depend on each other.
//
// Categories first, because the departments point at them and a department admin
// is only created for a department that actually handles something. The admin
// account is last so that everything else is in place by the time anyone can sign
// in and use the portal.
//
// Each seed is a separate process, so one failing does not leave the rest to run
// against half a database.
const { execFileSync } = require("child_process");
const path = require("path");

const steps = [
  ["categories", "seedCategories.js"],
  ["departments", "seedDepartments.js"],
  ["admin", "seedAdmin.js"],
  ["staff", "seedStaff.js"],
  ["faq", "seedFaq.js"],
];

const scriptsDir = path.join(__dirname);

steps.forEach(([label, file]) => {
  console.log(`\n--- ${label} ---`);

  try {
    execFileSync(process.execPath, [path.join(scriptsDir, file)], {
      stdio: "inherit",
    });
  } catch (error) {
    // Carries on so one missing optional seed does not hide the rest, but says so
    // loudly, because a half seeded database is a confusing thing to debug later
    console.error(`${label} seed failed with code ${error.status}`);
  }
});