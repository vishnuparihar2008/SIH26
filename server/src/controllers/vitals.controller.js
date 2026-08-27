import vitalsModel from "../models/vitals.model.js";
import patientModel from "../models/patient.model.js";
import caretakerModel from "../models/caretaker.model.js";

// Helper to resolve caretaker _id from req.user
async function resolveCaretakerId(user) {
  if (!user) return null;
  if (user.caretakerProfile) return user.caretakerProfile;
  const caretaker = await caretakerModel.findOne({ email: user.email });
  if (caretaker) return caretaker._id;
  return null;
}

// ---------------------------------------------------------------------------
// GET /api/v1/vitals/patient/:patientId
// ---------------------------------------------------------------------------
export const getVitalsHistory = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const limit = parseInt(req.query.limit, 10) || 50;

    const readings = await vitalsModel
      .find({ patientId })
      .sort({ recordedAt: -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: readings.length,
      data: readings,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/vitals/patient/:patientId
// ---------------------------------------------------------------------------
export const recordVital = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { heartRate, spO2, motionStatus, tier, source, notes, recordedAt } = req.body;

    const patient = await patientModel.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient record not found.",
      });
    }

    const caretakerId = await resolveCaretakerId(req.user);

    // Create telemetry record
    const vital = await vitalsModel.create({
      patientId,
      caretakerId: caretakerId || patient.caretakerId || undefined,
      heartRate: heartRate !== undefined ? Number(heartRate) : null,
      spO2: spO2 !== undefined ? Number(spO2) : null,
      motionStatus: motionStatus || "Normal",
      tier: tier || "normal",
      source: source || "manual_entry",
      notes: notes || "",
      recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
    });

    // Update current snapshot on patient document
    const current = patient.vitalsMonitoring.currentVitals;
    patient.vitalsMonitoring.lastRecordedAt = vital.recordedAt;
    patient.vitalsMonitoring.currentVitals = {
      heartRate: heartRate !== undefined ? Number(heartRate) : current.heartRate,
      spO2: spO2 !== undefined ? Number(spO2) : current.spO2,
      motionStatus: motionStatus || current.motionStatus,
      tier: tier || current.tier,
    };

    await patient.save();

    return res.status(201).json({
      success: true,
      message: "Vitals reading recorded successfully.",
      data: vital,
      currentVitals: patient.vitalsMonitoring.currentVitals,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/vitals/bulk  (Offline sync endpoint)
// ---------------------------------------------------------------------------
export const bulkSyncVitals = async (req, res, next) => {
  try {
    const { readings } = req.body;

    if (!Array.isArray(readings) || readings.length === 0) {
      return res.status(400).json({
        success: false,
        message: "An array of readings is required.",
      });
    }

    const inserted = await vitalsModel.insertMany(
      readings.map((r) => ({
        patientId: r.patientId,
        caretakerId: r.caretakerId,
        heartRate: r.heartRate,
        spO2: r.spO2,
        motionStatus: r.motionStatus || "Normal",
        tier: r.tier || "normal",
        source: r.source || "ble_wearable",
        notes: r.notes || "",
        recordedAt: r.recordedAt ? new Date(r.recordedAt) : new Date(),
      }))
    );

    // Update patient snapshot with the newest reading
    const newest = readings.sort(
      (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
    )[0];

    if (newest?.patientId) {
      await patientModel.findByIdAndUpdate(newest.patientId, {
        $set: {
          "vitalsMonitoring.lastRecordedAt": new Date(newest.recordedAt),
          "vitalsMonitoring.currentVitals": {
            heartRate: newest.heartRate,
            spO2: newest.spO2,
            motionStatus: newest.motionStatus || "Normal",
            tier: newest.tier || "normal",
          },
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: `Synced ${inserted.length} vitals readings successfully.`,
      count: inserted.length,
    });
  } catch (err) {
    next(err);
  }
};

