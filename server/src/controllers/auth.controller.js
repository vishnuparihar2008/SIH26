import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import config from "../config/config.js";
import userModel from "../models/user.model.js";
import caretakerModel from "../models/caretaker.model.js";
import patientModel from "../models/patient.model.js";
import sessionModel from "../models/session.model.js";

// ---------------------------------------------------------------------------
// Token helpers
// ---------------------------------------------------------------------------

function signAccessToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn || "1h" },
  );
}

function signRefreshToken(user) {
  // Refresh token uses a dedicated secret and a longer TTL (30 days)
  const secret = config.jwt.refreshSecret || config.jwt.secret + "_refresh";
  return jwt.sign(
    { id: user._id, role: user.role },
    secret,
    { expiresIn: "30d" },
  );
}

function verifyRefreshToken(token) {
  const secret = config.jwt.refreshSecret || config.jwt.secret + "_refresh";
  return jwt.verify(token, secret);
}

function hashToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

/**
 * Returns only the fields appropriate for the user's role.
 * Caretakers see their caretaker profile; patients see their patient profile.
 */
function toPublicUser(user, profile = null) {
  const base = {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    role: user.role,
  };

  if (user.role === "caretaker") {
    base.caretakerProfile = user.caretakerProfile || profile || null;
  } else if (user.role === "patient") {
    base.patientProfile = user.patientProfile || profile || null;
  }

  return base;
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  };
}

// ---------------------------------------------------------------------------
// POST /api/v1/auth/register
// ---------------------------------------------------------------------------
export const register = async (req, res, next) => {
  try {
    const { name, fullName, username, email, phone, password, role, relationshipToPatients } = req.body;
    const userName = (name || fullName || "").trim();

    if (!userName || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    // Accept only canonical roles; default to "caretaker"
    const normalizedRole = role === "patient" ? "patient" : "caretaker";

    const existing = await userModel.findOne({
      $or: [{ email: normalizedEmail }, ...(phone ? [{ phone }] : [])],
    });

    if (existing) {
      return res.status(409).json({
        message: "An account with this email or phone already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let linkedProfile = null;

    if (normalizedRole === "caretaker") {
      // Create caretaker profile
      const caretaker = await caretakerModel.create({
        fullName: userName,
        email: normalizedEmail,
        phone: phone || `+91-${Date.now().toString().slice(-10)}`,
        passwordHash,
        role: "family_member",
        relationshipToPatients: relationshipToPatients || "Family",
      });
      linkedProfile = caretaker;
    } else {
      // Patient self-registration: caretakerId is optional (can be linked later by a caretaker)
      // We create a minimal patient document — caretakerId will be set when a caretaker adds them
      const patient = await patientModel.create({
        fullName: userName,
        dateOfBirth: req.body.dateOfBirth || new Date("1990-01-01"),
        gender: req.body.gender || "prefer_not_to_say",
        contact: { email: normalizedEmail, phone: phone || "" },
        // caretakerId intentionally omitted — patient is self-registered
      });
      linkedProfile = patient;
    }

    const user = await userModel.create({
      name: userName,
      username: username || normalizedEmail.split("@")[0],
      email: normalizedEmail,
      phone: phone || "",
      password: passwordHash,
      role: normalizedRole,
      caretakerProfile: normalizedRole === "caretaker" ? linkedProfile?._id : undefined,
      patientProfile: normalizedRole === "patient" ? linkedProfile?._id : undefined,
    });

    const refreshToken = signRefreshToken(user);
    await sessionModel.create({
      user: user._id,
      refreshToken: hashToken(refreshToken),
      ip: req.ip || "127.0.0.1",
      userAgent: req.headers["user-agent"] || "mobile-client",
    });

    const accessToken = signAccessToken(user);

    res.cookie("refreshToken", refreshToken, cookieOptions());
    return res.status(201).json({
      message: "Account registered successfully!",
      user: toPublicUser(user, linkedProfile),
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/auth/login
// ---------------------------------------------------------------------------
export const login = async (req, res, next) => {
  try {
    const { email, username, identifier, password } = req.body;
    const loginId = (email || username || identifier || "").toLowerCase().trim();

    if (!loginId || !password) {
      return res.status(400).json({
        message: "Email/username and password are required.",
      });
    }

    const user = await userModel.findOne({
      $or: [{ email: loginId }, { username: loginId }, { phone: loginId }],
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // Populate the correct linked profile for the role
    let profile = null;
    if (user.role === "caretaker") {
      profile = user.caretakerProfile
        ? await caretakerModel.findById(user.caretakerProfile)
        : await caretakerModel.findOne({ email: user.email });

      // Update lastLoginAt on the caretaker profile
      if (profile) {
        profile.lastLoginAt = new Date();
        await profile.save();
      }
    } else if (user.role === "patient") {
      profile = user.patientProfile
        ? await patientModel.findById(user.patientProfile)
        : await patientModel.findOne({ "contact.email": user.email });
    }

    const refreshToken = signRefreshToken(user);
    await sessionModel.create({
      user: user._id,
      refreshToken: hashToken(refreshToken),
      ip: req.ip || "127.0.0.1",
      userAgent: req.headers["user-agent"] || "mobile-client",
    });

    const accessToken = signAccessToken(user);

    res.cookie("refreshToken", refreshToken, cookieOptions());
    return res.status(200).json({
      message: "Logged in successfully",
      user: toPublicUser(user, profile),
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/auth/me
// ---------------------------------------------------------------------------
export const getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    let profile = null;
    if (req.user.role === "caretaker") {
      profile = req.user.caretakerProfile
        ? await caretakerModel.findById(req.user.caretakerProfile)
        : await caretakerModel.findOne({ email: req.user.email });
    } else if (req.user.role === "patient") {
      profile = req.user.patientProfile
        ? await patientModel.findById(req.user.patientProfile)
        : await patientModel.findOne({ "contact.email": req.user.email });
    }

    return res.status(200).json({
      user: toPublicUser(req.user, profile),
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/auth/refresh-token
// ---------------------------------------------------------------------------
export const refreshToken = async (req, res, next) => {
  try {
    const rToken = req.cookies?.refreshToken || req.headers["x-refresh-token"];
    if (!rToken) {
      return res.status(401).json({ message: "Refresh token not found." });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(rToken);
    } catch {
      return res.status(401).json({ message: "Invalid or expired refresh token." });
    }

    const session = await sessionModel.findOne({
      refreshToken: hashToken(rToken),
      revoked: false,
    });

    if (!session) {
      return res.status(401).json({ message: "Session not found or revoked." });
    }

    const user = await userModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    const newRefreshToken = signRefreshToken(user);
    session.refreshToken = hashToken(newRefreshToken);
    await session.save();

    const accessToken = signAccessToken(user);

    res.cookie("refreshToken", newRefreshToken, cookieOptions());
    return res.status(200).json({
      message: "Access token refreshed successfully!",
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/auth/logout
// ---------------------------------------------------------------------------
export const logout = async (req, res, next) => {
  try {
    const rToken = req.cookies?.refreshToken || req.headers["x-refresh-token"];
    if (rToken) {
      await sessionModel.updateOne(
        { refreshToken: hashToken(rToken) },
        { revoked: true },
      );
    }

    res.clearCookie("refreshToken");
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/auth/logout-all
// ---------------------------------------------------------------------------
export const logoutall = async (req, res, next) => {
  try {
    const rToken = req.cookies?.refreshToken || req.headers["x-refresh-token"];

    if (!rToken) {
      // Still clear cookie even if no token found
      res.clearCookie("refreshToken");
      return res.status(200).json({ message: "Logged out from all devices successfully" });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(rToken);
    } catch {
      res.clearCookie("refreshToken");
      return res.status(200).json({ message: "Logged out from all devices successfully" });
    }

    await sessionModel.updateMany(
      { user: decoded.id, revoked: false },
      { revoked: true },
    );

    res.clearCookie("refreshToken");
    return res.status(200).json({ message: "Logged out from all devices successfully" });
  } catch (err) {
    next(err);
  }
};
