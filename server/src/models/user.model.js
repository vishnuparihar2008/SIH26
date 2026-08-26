import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      lowercase: true,
      trim: true,
      default: function () {
        return this.email ? this.email.split("@")[0] : "";
      },
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
      trim: true,
      default: "",
    },
    password: {
      type: String,
      required: [true, "Password is required."],
    },
    // Normalized to exactly two values — no "care-taker" variant
    role: {
      type: String,
      enum: ["caretaker", "patient"],
      default: "caretaker",
    },
    caretakerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "caretakers",
    },
    patientProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "patients",
    },
  },
  {
    timestamps: true,
  },
);

const userModel = mongoose.model("users", userSchema);

export default userModel;
