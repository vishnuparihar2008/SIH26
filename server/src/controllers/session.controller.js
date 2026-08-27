import gameSessionModel from "../models/gameSession.model.js";
import patientModel from "../models/patient.model.js";

// ---------------------------------------------------------------------------
// GET /api/v1/sessions/patient/:patientId
// ---------------------------------------------------------------------------
export const getSessionsByPatient = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { gameId, limit = 50 } = req.query;

    const filter = { patientId };
    if (gameId) filter.gameId = gameId;

    const sessions = await gameSessionModel
      .find(filter)
      .sort({ completedAt: -1 })
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/sessions
// ---------------------------------------------------------------------------
export const recordSession = async (req, res, next) => {
  try {
    const {
      patientId,
      gameId,
      score,
      accuracy,
      durationSeconds,
      difficultyLevel,
      roundDetails,
      completedAt,
    } = req.body;

    if (!patientId || !gameId || score === undefined) {
      return res.status(400).json({
        success: false,
        message: "patientId, gameId, and score are required.",
      });
    }

    const patient = await patientModel.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient record not found.",
      });
    }

    const session = await gameSessionModel.create({
      patientId,
      caretakerId: patient.caretakerId || undefined,
      gameId,
      score: Number(score),
      accuracy: accuracy !== undefined ? Number(accuracy) : 1,
      durationSeconds: durationSeconds ? Number(durationSeconds) : 0,
      difficultyLevel: difficultyLevel ? Number(difficultyLevel) : 1,
      roundDetails: roundDetails || [],
      completedAt: completedAt ? new Date(completedAt) : new Date(),
    });

    // Update aggregated stats on patient document
    const total = (patient.gameStats.totalSessions || 0) + 1;
    const avg = Math.round(
      ((patient.gameStats.averageScore || 0) * (total - 1) + Number(score)) / total
    );

    patient.gameStats.totalSessions = total;
    patient.gameStats.averageScore = avg;
    patient.gameStats.lastPlayedAt = session.completedAt;
    patient.gameStats.history.unshift({
      gameId,
      score: Number(score),
      accuracy: session.accuracy,
      durationSeconds: session.durationSeconds,
      completedAt: session.completedAt,
    });

    if (patient.gameStats.history.length > 50) {
      patient.gameStats.history = patient.gameStats.history.slice(0, 50);
    }

    await patient.save();

    return res.status(201).json({
      success: true,
      message: "Game session recorded successfully.",
      data: session,
      gameStats: patient.gameStats,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/sessions/bulk (Offline sync endpoint)
// ---------------------------------------------------------------------------
export const bulkSyncSessions = async (req, res, next) => {
  try {
    const { sessions } = req.body;

    if (!Array.isArray(sessions) || sessions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "An array of sessions is required.",
      });
    }

    const inserted = await gameSessionModel.insertMany(
      sessions.map((s) => ({
        patientId: s.patientId,
        caretakerId: s.caretakerId,
        gameId: s.gameId,
        score: Number(s.score),
        accuracy: s.accuracy !== undefined ? Number(s.accuracy) : 1,
        durationSeconds: s.durationSeconds ? Number(s.durationSeconds) : 0,
        difficultyLevel: s.difficultyLevel ? Number(s.difficultyLevel) : 1,
        roundDetails: s.roundDetails || [],
        completedAt: s.completedAt ? new Date(s.completedAt) : new Date(),
      }))
    );

    return res.status(201).json({
      success: true,
      message: `Synced ${inserted.length} game sessions successfully.`,
      count: inserted.length,
    });
  } catch (err) {
    next(err);
  }
};

