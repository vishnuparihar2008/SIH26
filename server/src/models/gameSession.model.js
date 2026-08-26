import mongoose from "mongoose";

/**
 * gameSessions Collection — individual cognitive game session records.
 *
 * The patient.gameStats.history array acts as a short rolling cache (last 50).
 * Full history and analytics (leaderboards, per-game trends) live here.
 *
 * Relationship: many game sessions → one patient.
 */
const gameSessionSchema = new mongoose.Schema(
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
      required: false,
      index: true,
    },
    // Matches the game IDs used in the front-end catalog
    gameId: {
      type: String,
      required: [true, "Game ID is required."],
      enum: [
        "memory_album",
        "memory_tray",
        "routine_sequencer",
        "what_changed",
        "face_name_match",
        "local_culture_match",
      ],
      index: true,
    },
    score: {
      type: Number,
      required: [true, "Score is required."],
      min: 0,
    },
    // Fraction correct: 0.0 – 1.0
    accuracy: {
      type: Number,
      min: 0,
      max: 1,
      default: 1,
    },
    durationSeconds: {
      type: Number,
      min: 0,
      default: 0,
    },
    // Difficulty level at time of play (supports adaptive engine in Phase 4)
    difficultyLevel: {
      type: Number,
      min: 1,
      max: 5,
      default: 1,
    },
    // Round-by-round detail for deeper analytics (optional, written per game)
    roundDetails: {
      type: [
        {
          round: { type: Number },
          correct: { type: Boolean },
          responseTimeMs: { type: Number },
        },
      ],
      default: [],
    },
    completedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound indexes for common analytics queries
gameSessionSchema.index({ patientId: 1, completedAt: -1 }); // Per-patient history
gameSessionSchema.index({ patientId: 1, gameId: 1, completedAt: -1 }); // Per-game trends
gameSessionSchema.index({ caretakerId: 1, completedAt: -1 }); // Caretaker dashboard view

const gameSessionModel = mongoose.model("game_sessions", gameSessionSchema);

export default gameSessionModel;
