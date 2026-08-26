import mongoose from "mongoose";

const caretakerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required."],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required."],
      unique: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required."],
    },
    // Matches schema.md exactly — 4 roles, no "caretaker" generic alias
    role: {
      type: String,
      enum: ["family_member", "nurse", "guardian", "professional_caregiver"],
      default: "family_member",
    },
    relationshipToPatients: {
      type: String,
      default: "Family",
    },
    profileImageUrl: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
    },
    address: {
      line1: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      country: { type: String, default: "IN" },
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const caretakerModel = mongoose.model("caretakers", caretakerSchema);

export default caretakerModel;
