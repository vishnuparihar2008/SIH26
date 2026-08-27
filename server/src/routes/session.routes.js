import { Router } from "express";
import {
  getSessionsByPatient,
  recordSession,
  bulkSyncSessions,
} from "../controllers/session.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const sessionRoutes = Router();

sessionRoutes.use(protect);

sessionRoutes.get("/patient/:patientId", getSessionsByPatient);
sessionRoutes.post("/", recordSession);
sessionRoutes.post("/bulk", bulkSyncSessions);

export default sessionRoutes;

