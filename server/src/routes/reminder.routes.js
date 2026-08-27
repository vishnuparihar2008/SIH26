import { Router } from "express";
import {
  getReminders,
  getRemindersByPatient,
  createReminder,
  updateReminder,
  toggleReminder,
  acknowledgeReminder,
  deleteReminder,
} from "../controllers/reminder.controller.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";

const reminderRoutes = Router();

reminderRoutes.use(protect);

reminderRoutes.get("/", getReminders);
reminderRoutes.get("/patient/:patientId", getRemindersByPatient);

// Caretakers can create/update/delete reminders
reminderRoutes.post("/", restrictTo("caretaker"), createReminder);
reminderRoutes.put("/:id", restrictTo("caretaker"), updateReminder);
reminderRoutes.patch("/:id/toggle", restrictTo("caretaker"), toggleReminder);
reminderRoutes.delete("/:id", restrictTo("caretaker"), deleteReminder);

// Both patients and caretakers can acknowledge a reminder
reminderRoutes.patch("/:id/acknowledge", acknowledgeReminder);

export default reminderRoutes;

