import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: [true, "User is required."],
      index: true,
    },
    // Stored as SHA-256 hash of the raw refresh token
    refreshToken: {
      type: String,
      unique: true, // fixed: Mongoose unique doesn't accept a tuple [true, "message"]
      required: [true, "Refresh token hash is required."],
    },
    ip: {
      type: String,
      required: [true, "IP address is required."],
    },
    userAgent: {
      type: String,
      required: [true, "User agent is required."],
    },
    revoked: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      index: { expires: 0 }, // TTL index — MongoDB auto-deletes expired sessions
    },
  },
  {
    timestamps: true,
  },
);

const sessionModel = mongoose.model("sessions", sessionSchema);

export default sessionModel;
