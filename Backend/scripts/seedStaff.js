require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../src/models/User");
const Department = require("../src/models/Department");

// One-off script: creates the first full admin and one department admin per
// starter department, so the two roles can be tried out without opening the
// portal by hand.
//
// Every account here is a known password, so this is a development helper. Do not
// run it against a live database. The full admin is the same account seedAdmin.js
// creates, and it is skipped if that already exists.
//
// Department admins are only created for departments that already handle at least
// one category. A department admin with an empty category list would sign in to an
// empty portal, which looks like the account is broken rather than like the
// department is unconfigured.
const PASSWORD = process.env.SEED_STAFF_PASSWORD || "department@2026";

const adminAccount = {
  name: "system admin",
  email: "admin@hamrosamadhan.com",
  password: "hamrosamadhan@123",
  role: "admin",
};

const staffSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGOOSE_URL);
    console.log("Database connected successfully");

    const existingAdmin = await User.findOne({ email: adminAccount.email });

    if (existingAdmin) {
      console.log(`Admin ${adminAccount.email} already exists, skipping`);
    } else {
      const passwordHash = await bcrypt.hash(adminAccount.password, 12);

      await User.create({
        name: adminAccount.name,
        email: adminAccount.email,
        password: passwordHash,
        role: "admin",
        isActive: true,
      });

      console.log("Admin created successfully");
      console.log("Email:", adminAccount.email);
      console.log("Password:", adminAccount.password);
    }

    const departments = await Department.find({ isActive: true })
      .sort({ name: 1 })
      .lean();

    if (!departments.length) {
      console.log("No departments found, run seed:departments first");
      return;
    }

    // One hash computed once and reused. Hashing the same password 12 times in a
    // row is 12 times the wait for the exact same result
    const staffHash = await bcrypt.hash(PASSWORD, 12);

    let created = 0;
    const skipped = [];

    for (const department of departments) {
      if (!department.categories?.length) {
        skipped.push(`${department.name} (handles no categories)`);
        continue;
      }

      // Derived from the department name, so re-running finds the same account
      const email = `${department.name}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ".")
        .replace(/^\.+|\.+$/g, "")
        .slice(0, 60) + "@hamrosamadhan.com";

      const existing = await User.findOne({ email });

      if (existing) {
        skipped.push(`${email} (already exists)`);
        continue;
      }

      await User.create({
        name: `${department.name} admin`,
        email,
        password: staffHash,
        role: "department_admin",
        department: department._id,
        isActive: true,
      });

      created += 1;
    }

    console.log(`Department admins created: ${created}`);

    if (skipped.length) {
      console.log(`Skipped: ${skipped.join(", ")}`);
    }

    console.log(`Password for every new account: ${PASSWORD}`);
    console.log(
      "These are known passwords. Remove these accounts before going live.",
    );
  } catch (error) {
    console.error("Seed error:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
};

// Run it with: node scripts/seedStaff.js
staffSeed();