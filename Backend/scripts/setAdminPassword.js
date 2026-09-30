require("dotenv").config({ quiet: true });

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../src/models/User");

// One-off script: sets a strong password for an admin account and prints it
// Used after the seeded password was found to be weak
const setAdminPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGOOSE_URL);

    const email = process.argv[2];

    if (!email) {
      console.log("Usage: node scripts/setAdminPassword.js <admin-email> [password]");
      return;
    }

    // Generated when not supplied, so the new value is never a guessable default
    const password =
      process.argv[3] || crypto.randomBytes(12).toString("base64url");

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log("No such admin:", email);
      return;
    }

    user.password = await bcrypt.hash(password, 12);
    await user.save();

    console.log(`Password updated for ${user.email}`);
    console.log("New password:", password);
    console.log("Copy it now, it is not stored anywhere in plain text");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.connection.close();
  }
};

// Run it with: node scripts/setAdminPassword.js admin@hamrosamadhan.com
setAdminPassword();
