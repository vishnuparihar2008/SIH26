import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import config from "./config/config.js";

import authRoutes from "./routes/auth.routes.js";
import patientRoutes from "./routes/patient.routes.js";

import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();

app.use(
  cors({
    origin:
      config.env === "production"
        ? process.env.FRONTEND_URL
        : [
            "http://localhost:8081", // Expo web dev server
            "http://localhost:3000",
            "http://localhost:19006", // older Expo web port
            "http://192.168.29.199:8081", // physical device via LAN
          ],
    credentials: true,
  }),
);
app.use(express.json());
if (config.env === "development") {
  app.use(morgan("dev"));
}
app.use(cookieParser());

// --- Health check ---
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "cognitive-care-backend" });
});

// --- Routes ---
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/patients", patientRoutes);

// --- 404 + error handling (must be registered last) ---
app.use(notFound);
app.use(errorHandler);

export default app;
