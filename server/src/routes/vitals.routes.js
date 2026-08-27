import { Router } from "express";
import {
  getVitalsHistory,
  recordVital,
  bulkSyncVitals,
} from "../controllers/vitals.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const vitalsRoutes = Router();

vitalsRoutes.use(protect);

vitalsRoutes.get("/patient/:patientId", getVitalsHistory);
vitalsRoutes.post("/patient/:patientId", recordVital);
vitalsRoutes.post("/bulk", bulkSyncVitals);

export default vitalsRoutes;

