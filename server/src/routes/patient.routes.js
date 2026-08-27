import { Router } from "express";
import {
  getPatients,
  getPatientById,
  createPatient,
  linkPatient,
  updatePatient,
  deletePatient,
  recordGameResult,
  updateVitals,
} from "../controllers/patient.controller.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const patientRoutes = Router();

// All routes require authentication
patientRoutes.use(protect);

// Read: both caretakers and patients can view
patientRoutes.get("/", getPatients);
patientRoutes.get("/:id", getPatientById);

// Write: caretaker-only — patients cannot create or manage other patients
patientRoutes.post("/", restrictTo("caretaker"), createPatient);
patientRoutes.post("/link", restrictTo("caretaker"), linkPatient);
patientRoutes.put("/:id", restrictTo("caretaker"), updatePatient);
patientRoutes.delete("/:id", restrictTo("caretaker"), deletePatient);

// Game results: both roles can record (patient plays games themselves)
patientRoutes.post("/:id/game-results", recordGameResult);
// Vitals: caretaker or wearable integration only
patientRoutes.post("/:id/vitals", restrictTo("caretaker"), updateVitals);

export default patientRoutes;
