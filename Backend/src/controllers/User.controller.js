const User = require("../models/User");
const Session = require("../models/Session");
const Department = require("../models/Department");
const bcrypt = require("bcryptjs");

// Admin Login

// Every failed login returns this exact response, so an attacker cannot tell
// a wrong password from an email that does not exist
const LOGIN_FAILED = {
  success: false,
  message: "Invalid email or password",
};

// The cookie's Secure flag has to follow how the request actually arrived, not
// NODE_ENV. A Secure cookie set over plain http is accepted by the browser but
// then dropped, so the login returns 200 and every later request arrives with no
// Cookie header. That is what happens when NODE_ENV says production while
// running on http://localhost, or on a LAN IP, which is the usual local setup
//
// SameSite follows from it. A cross site frontend needs None so the browser will
// send the cookie at all, but None is only legal alongside Secure, so the two are
// decided together rather than independently
const isHttps = (req) =>
  req.secure ||
  req.headers["x-forwarded-proto"] === "https" ||
  Boolean(req.headers["x-forwarded-proto"]);

// Kept in one place because the browser matches on every attribute when a cookie
// is replaced or cleared. A clearCookie that disagrees with the set cookie
// leaves the original in place
const cookieOptions = (req) => {
  const secure = isHttps(req);

  return {
    httpOnly: true,
    secure,
    sameSite: secure ? "none" : "lax",
    path: "/",
  };
};

// The shape a staff account is handed to the client in. Used by every route that
// returns a user, so no handler can leak the password hash by forgetting to strip
// it
const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department
    ? { _id: user.department._id, name: user.department.name }
    : null,
  isActive: user.isActive,
});

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password are required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // An unknown email still runs a bcrypt compare, so the response time does
    // not reveal whether the account is real either
    const passwordMatches = user
      ? await bcrypt.compare(password, user.password)
      : await bcrypt.compare(
          password,
          "$2a$12$C6UzMDM.H6dfI/f/IKcEeO1Zf3vVfXKqXHnXwJQEGPuBqXhdcO3mS",
        );

    if (!user || !passwordMatches || !user.isActive) {
      return res.status(401).json(LOGIN_FAILED);
    }

    // Server-side session, so logout and expiry are both enforced server side
    const sessionToken = await Session.createForUser(user._id);

    res.cookie("token", sessionToken, {
      ...cookieOptions(req),
      maxAge: 15 * 60 * 1000,
    });

    // Populated so the portal can label the account's department before it has
    // loaded anything else, which decides what the sidebar shows
    await user.populate("department", "name");

    return res.status(200).json({
      success: true,
      user: publicUser(user),
    });
  } catch (error) {
    console.log(`Error:${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get Admin

const getMe = async (req, res) => {
  try {
    // Password hash is stripped so it never reaches the client
    const user = await User.findById(req.user.userId)
      .select("-password")
      .populate("department", "name");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not Found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(`Error:${error.message}`);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// logout

const logout = async (req, res) => {
  try {
    // Deleting the row is what actually ends the session, clearing the cookie
    // alone would leave the token usable if it had been copied elsewhere
    await Session.revoke(req.sessionToken);

    res.clearCookie("token", cookieOptions(req));

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.log(`Error:${error.message}`);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Every staff account, newest first
//
// Full admin only. A department admin cannot list accounts, because the account
// list would tell them how many people work elsewhere, and their own department's
// staffing is not their business either
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("department", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.log(`Error:${error.message}`);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Checks that a department admin has somewhere to work.
//
// Two things are wrong with an account that names no department or a retired one:
// the scope helper would refuse every request with a 401, which reads to the
// person as "my password is wrong", and a department with no categories would
// silently show an empty portal. Both are refused at the point the account is
// written, so an admin never has to debug the symptom
const resolveDepartment = async (role, departmentId) => {
  if (role === "admin") {
    // A full admin is unscoped by definition, so any department left on the
    // record is cleared rather than kept as a stale field
    return { department: null };
  }

  const department = await Department.findById(departmentId);

  if (!department) {
    return { error: "Department not found" };
  }

  if (!department.isActive) {
    return { error: "That department is retired" };
  }

  if (!department.categories?.length) {
    return {
      error: `${department.name} has no categories assigned yet, so a department admin would see nothing. Assign it categories first.`,
    };
  }

  return { department: department._id };
};

// createUser
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, isActive } = req.body;

    const { department, error: departmentError } = await resolveDepartment(
      role,
      req.body.department,
    );

    if (departmentError) {
      return res.status(400).json({
        success: false,
        message: departmentError,
      });
    }

    // Checked before hashing, so a duplicate email fails in milliseconds instead
    // of after a 12 round bcrypt
    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "An account with that email already exists",
      });
    }

    // 12 rounds keeps hashing slow enough to slow down brute force
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: passwordHash,
      role,
      department,
      isActive,
    });

    await user.populate("department", "name");

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: publicUser(user),
    });
  } catch (err) {
    console.log(`Error:${err.message}`);

    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with that email already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// updateUser
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, isActive } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    // An admin demoting themselves would lock the portal out with no way back,
    // because the only account that could undo it is the one they just changed.
    // The last active full admin is protected for the same reason
    if (user.role === "admin" && (role && role !== "admin" || isActive === false)) {
      const otherAdmins = await User.countDocuments({
        role: "admin",
        isActive: true,
        _id: { $ne: user._id },
      });

      if (otherAdmins === 0) {
        return res.status(400).json({
          success: false,
          message:
            "This is the only active admin account, so it cannot be demoted or disabled",
        });
      }
    }

    if (name !== undefined) {
      user.name = name;
    }

    if (role !== undefined && role !== user.role) {
      // Switching into or out of department_admin changes what the scope helper
      // expects, so the department is resolved again from scratch
      const { department, error: departmentError } = await resolveDepartment(
        role,
        req.body.department ?? user.department,
      );

      if (departmentError) {
        return res.status(400).json({
          success: false,
          message: departmentError,
        });
      }

      user.role = role;
      user.department = department;
    } else if (req.body.department !== undefined) {
      const { department, error: departmentError } = await resolveDepartment(
        user.role,
        req.body.department,
      );

      if (departmentError) {
        return res.status(400).json({
          success: false,
          message: departmentError,
        });
      }

      user.department = department;
    }

    if (isActive !== undefined) {
      user.isActive = isActive;
    }

    await user.save();

    // A disabled account keeps its rows but must lose its live sessions at once,
    // otherwise a 15 minute cookie outlives the decision to disable it
    if (isActive === false) {
      await Session.deleteMany({ user: user._id });
    }

    await user.populate("department", "name");

    return res.status(200).json({
      success: true,
      message: "Account updated successfully",
      user: publicUser(user),
    });
  } catch (error) {
    console.log(`Error:${error.message}`);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// setUserPassword
const setUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found",
      });
    }

    user.password = await bcrypt.hash(password, 12);
    await user.save();

    // Every session that account had is dropped, so a password change cannot be
    // undone by an attacker who is still holding an old cookie
    await Session.deleteMany({ user: user._id });

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
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
  login,
  getMe,
  logout,
  getAllUsers,
  createUser,
  updateUser,
  setUserPassword,
};