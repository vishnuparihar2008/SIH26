import mongoose from "mongoose";

/**
 * reminders Collection — scheduled care reminders per patient.
 *
 * Caretakers create reminders; patients see them on their device.
 * Each reminder has a type (medicine, hydration, appointment, etc.),
 * a recurrence rule, and an active/completed status.
 *
 * Relationship: many reminders → one patient, created by one caretaker.
 */
const reminderSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "patients",
      required: [true, "Patient ID is required."],
      index: true,
    },
    caretakerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "caretakers",
      required: false, // Can also be created by the patient themselves
      index: true,
    },
    title: {
      type: String,
      required: [true, "Reminder title is required."],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "medicine",
        "hydration",
        "appointment",
        "exercise",
        "meal",
        "sleep",
        "other",
      ],
      default: "medicine",
      index: true,
    },
    // When the reminder first fires
    scheduledAt: {
      type: Date,
      required: [true, "Scheduled time is required."],
      index: true,
    },
    // Simple recurrence rule; null = one-time
    recurrence: {
      type: String,
      enum: ["none", "daily", "weekly", "monthly"],
      default: "none",
    },
    // Days of week for weekly recurrence (0=Sun … 6=Sat)
    recurrenceDays: {
      type: [Number],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    // Tracks acknowledgement by the patient
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    // Optional medication details if type === "medicine"
    medication: {
      name: { type: String, default: "" },
      dosage: { type: String, default: "" },
      instructions: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for dashboard: "all active reminders for a patient, sorted by time"
reminderSchema.index({ patientId: 1, isActive: 1, scheduledAt: 1 });

const reminderModel = mongoose.model("reminders", reminderSchema);

export default reminderModel;
