const User = require("../models/User");
const Session = require("../models/Session");
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

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
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
    const user = await User.findById(req.user.userId).select("-password");
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

module.exports = { login, getMe, logout };
