import patientModel from "../models/patient.model.js";
import caretakerModel from "../models/caretaker.model.js";

// Fields that a caretaker is allowed to update on a patient record.
// Excludes protected fields: caretakerId, gameStats, vitalsMonitoring internals.
const ALLOWED_UPDATE_FIELDS = new Set([
  "fullName",
  "dateOfBirth",
  "gender",
  "bloodGroup",
  "profileImageUrl",
  "contact",
  "address",
  "relationshipToCaretaker",
  "medicalInfo",
  "status",
  "notes",
]);

/** Picks only allowed fields from a plain object (shallow). */
function pickAllowed(body) {
  return Object.fromEntries(
    Object.entries(body).filter(([key]) => ALLOWED_UPDATE_FIELDS.has(key)),
  );
}

// Helper to resolve caretaker _id from req.user
async function resolveCaretakerId(user) {
  if (!user) return null;
  if (user.caretakerProfile) return user.caretakerProfile;
  const caretaker = await caretakerModel.findOne({ email: user.email });
  if (caretaker) return caretaker._id;
  return null;
}

// ---------------------------------------------------------------------------
// GET /api/v1/patients
// ---------------------------------------------------------------------------
export const getPatients = async (req, res, next) => {
  try {
    const caretakerId = await resolveCaretakerId(req.user);

    const query = caretakerId ? { caretakerId } : {};

    const patients = await patientModel
      .find(query)
      .select("-gameStats.history") // omit large history array from list view
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: patients.length,
      data: patients,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/patients/:id
// ---------------------------------------------------------------------------
export const getPatientById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const patient = await patientModel
      .findById(id)
      .populate("caretakerId", "fullName email phone role");

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient record not found." });
    }

    return res.status(200).json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/patients  (caretaker only)
// ---------------------------------------------------------------------------
export const createPatient = async (req, res, next) => {
  try {
    const {
      fullName,
      dateOfBirth,
      gender,
      bloodGroup,
      profileImageUrl,
      contact,
      address,
      relationshipToCaretaker,
      medicalInfo,
      vitalsMonitoring,
      notes,
    } = req.body;

    if (!fullName || !dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: "Patient fullName and dateOfBirth are required.",
      });
    }

    const caretakerId = await resolveCaretakerId(req.user);
    if (!caretakerId) {
      return res.status(400).json({
        success: false,
        message: "A valid caretaker account is required to register a patient.",
      });
    }

    const patient = await patientModel.create({
      caretakerId,
      fullName,
      dateOfBirth: new Date(dateOfBirth),
      gender: gender || "prefer_not_to_say",
      bloodGroup: bloodGroup || "O+",
      profileImageUrl: profileImageUrl || "",
      contact: contact || {},
      address: address || {},
      relationshipToCaretaker: relationshipToCaretaker || "Parent",
      medicalInfo: medicalInfo || {},
      vitalsMonitoring: vitalsMonitoring || { enabled: true },
      notes: notes || "",
    });

    return res.status(201).json({
      success: true,
      message: "Patient registered successfully under your care.",
      data: patient,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// PUT /api/v1/patients/:id  (caretaker only)
// ---------------------------------------------------------------------------
export const updatePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const safeUpdate = pickAllowed(req.body);

    if (Object.keys(safeUpdate).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update.",
      });
    }

    const patient = await patientModel.findByIdAndUpdate(
      id,
      { $set: safeUpdate },
      { new: true, runValidators: true },
    );

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient record not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Patient record updated successfully.",
      data: patient,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/v1/patients/:id  (caretaker only — soft delete)
// ---------------------------------------------------------------------------
export const deletePatient = async (req, res, next) => {
  try {
    const { id } = req.params;

    const patient = await patientModel.findByIdAndUpdate(
      id,
      { $set: { status: "discharged" } },
      { new: true },
    );

    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient record not found." });
    }

    return res.status(200).json({ success: true, message: "Patient discharged successfully." });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/patients/:id/game-results
// ---------------------------------------------------------------------------
export const recordGameResult = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { gameId, score, accuracy, durationSeconds } = req.body;

    if (!gameId || score === undefined) {
      return res.status(400).json({
        success: false,
        message: "gameId and score are required.",
      });
    }

    const patient = await patientModel.findById(id);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient record not found." });
    }

    const newEntry = {
      gameId,
      score: Number(score),
      accuracy: accuracy !== undefined ? Number(accuracy) : 1,
      durationSeconds: durationSeconds ? Number(durationSeconds) : 0,
      completedAt: new Date(),
    };

    const total = (patient.gameStats.totalSessions || 0) + 1;
    const avg = Math.round(
      ((patient.gameStats.averageScore || 0) * (total - 1) + Number(score)) / total,
    );

    patient.gameStats.totalSessions = total;
    patient.gameStats.averageScore = avg;
    patient.gameStats.lastPlayedAt = new Date();
    patient.gameStats.history.unshift(newEntry);

    // Keep embedded cache capped at 50 — full history goes to GameSession collection
    if (patient.gameStats.history.length > 50) {
      patient.gameStats.history = patient.gameStats.history.slice(0, 50);
    }

    await patient.save();

    return res.status(200).json({
      success: true,
      message: "Game result recorded successfully.",
      gameStats: patient.gameStats,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/patients/:id/vitals
// ---------------------------------------------------------------------------
export const updateVitals = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { heartRate, spO2, motionStatus, tier } = req.body;

    const patient = await patientModel.findById(id);
    if (!patient) {
      return res.status(404).json({ success: false, message: "Patient record not found." });
    }

    const current = patient.vitalsMonitoring.currentVitals;
    patient.vitalsMonitoring.lastRecordedAt = new Date();
    patient.vitalsMonitoring.currentVitals = {
      heartRate: heartRate !== undefined ? heartRate : current.heartRate,
      spO2: spO2 !== undefined ? spO2 : current.spO2,
      motionStatus: motionStatus || current.motionStatus,
      tier: tier || current.tier,
    };

    await patient.save();

    return res.status(200).json({
      success: true,
      message: "Patient vitals telemetry updated.",
      vitals: patient.vitalsMonitoring,
    });
  } catch (err) {
    next(err);
  }
};
