import { Router } from "express";
import {
  register,
  login,
  getMe,
  refreshToken,
  logout,
  logoutall,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const authRoutes = Router();

authRoutes.post("/register", register);
authRoutes.post("/login", login);
authRoutes.get("/me", protect, getMe);
authRoutes.get("/refresh-token", refreshToken);
authRoutes.get("/logout", logout);
authRoutes.get("/logout-all", logoutall);

export default authRoutes;

