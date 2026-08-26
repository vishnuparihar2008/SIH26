import mongoose from "mongoose";

const medicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
  },
  { _id: false },
);

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    phone: { type: String, default: "" },
    relation: { type: String, default: "" },
  },
  { _id: false },
);

const gameHistorySchema = new mongoose.Schema(
  {
    gameId: { type: String, required: true },
    score: { type: Number, required: true },
    accuracy: { type: Number, default: 1 },
    durationSeconds: { type: Number, default: 0 },
    completedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const patientSchema = new mongoose.Schema(
  {
    caretakerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "caretakers",
      required: false, // Optional — patients can self-register; caretaker links them later
      default: null,
      index: true,
    },
    fullName: {
      type: String,
      required: [true, "Patient full name is required."],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required."],
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"],
      default: "prefer_not_to_say",
    },
    bloodGroup: {
      type: String,
      default: "O+",
    },
    profileImageUrl: {
      type: String,
      default: "",
    },
    contact: {
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
    },
    address: {
      line1: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      country: { type: String, default: "IN" },
    },
    relationshipToCaretaker: {
      type: String,
      default: "Parent",
    },
    medicalInfo: {
      conditions: {
        type: [String],
        default: [],
      },
      allergies: {
        type: [String],
        default: [],
      },
      medications: {
        type: [medicationSchema],
        default: [],
      },
      primaryPhysician: {
        type: String,
        default: "",
      },
      emergencyContact: {
        type: emergencyContactSchema,
        default: () => ({}),
      },
    },
    vitalsMonitoring: {
      enabled: { type: Boolean, default: true },
      lastRecordedAt: { type: Date, default: null },
      currentVitals: {
        heartRate: { type: Number, default: 72 },
        spO2: { type: Number, default: 98 },
        motionStatus: { type: String, default: "Normal" },
        tier: { type: String, enum: ["normal", "low", "high", "lethal"], default: "normal" },
      },
    },
    gameStats: {
      totalSessions: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      lastPlayedAt: { type: Date, default: null },
      history: {
        type: [gameHistorySchema],
        default: [],
      },
    },
    status: {
      type: String,
      enum: ["active", "inactive", "deceased", "discharged"],
      default: "active",
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

const patientModel = mongoose.model("patients", patientSchema);

export default patientModel;
