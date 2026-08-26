import mongoose from "mongoose";

/**
 * vitals Collection — time-series history of patient vital readings.
 *
 * Rather than embedding all history inside the patient document (which can
 * grow unbounded), each reading is stored as a separate document here.
 * The patient.vitalsMonitoring.currentVitals field holds only the latest snapshot.
 *
 * Relationship: many vitals → one patient (via patientId)
 */
const vitalsSchema = new mongoose.Schema(
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
      required: false, // Optional — in case the patient self-reports
      index: true,
    },
    // Raw sensor readings
    heartRate: {
      type: Number,
      min: 0,
      max: 300,
      default: null,
    },
    spO2: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    motionStatus: {
      type: String,
      enum: ["Normal", "Stationary", "Fall Detected", "Unknown"],
      default: "Unknown",
    },
    // Risk classification derived from readings
    tier: {
      type: String,
      enum: ["normal", "low", "high", "lethal"],
      default: "normal",
    },
    // Source device / integration
    source: {
      type: String,
      enum: ["ble_wearable", "manual_entry", "app_sensor", "unknown"],
      default: "unknown",
    },
    recordedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for efficient per-patient time-range queries
vitalsSchema.index({ patientId: 1, recordedAt: -1 });
// TTL: auto-purge raw readings older than 2 years to keep collection size manageable
vitalsSchema.index({ recordedAt: 1 }, { expireAfterSeconds: 2 * 365 * 24 * 60 * 60 });

const vitalsModel = mongoose.model("vitals", vitalsSchema);

export default vitalsModel;

