import jwt from "jsonwebtoken";
import config from "../config/config.js";
import userModel from "../models/user.model.js";

/**
 * Verifies the Bearer token and attaches the authenticated user to req.user.
 * Use on any route that requires login.
 */
export async function protect(req, res, next) {
  try {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized — no token provided" });
    }

    const decoded = jwt.verify(token, config.jwt.secret);

    const user = await userModel.findById(decoded.id).select("-password -passwordHash");
    if (!user) {
      return res.status(401).json({ message: "Not authorized — user no longer exists" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized — invalid or expired token" });
  }
}

/**
 * Restricts a route to specific roles. Use after `protect`.
 * e.g. router.post("/x", protect, restrictTo("caretaker", "care-taker"), handler)
 */
export function restrictTo(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "You do not have permission to perform this action" });
    }
    next();
  };
}

export default { protect, restrictTo };

