import reminderModel from "../models/reminder.model.js";
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
// GET /api/v1/reminders
// ---------------------------------------------------------------------------
export const getReminders = async (req, res, next) => {
  try {
    const { patientId, type, isActive } = req.query;
    const filter = {};

    if (patientId) {
      filter.patientId = patientId;
    } else if (req.user?.role === "patient" && req.user?.patientProfile) {
      filter.patientId = req.user.patientProfile;
    } else if (req.user?.role === "caretaker") {
      const caretakerId = await resolveCaretakerId(req.user);
      if (caretakerId) {
        // Find all patients belonging to this caretaker
        const patients = await patientModel.find({ caretakerId }).select("_id");
        const patientIds = patients.map((p) => p._id);
        filter.patientId = { $in: patientIds };
      }
    }

    if (type) {
      filter.type = type;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const reminders = await reminderModel
      .find(filter)
      .sort({ scheduledAt: 1 })
      .populate("patientId", "fullName");

    return res.status(200).json({
      success: true,
      count: reminders.length,
      data: reminders,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/reminders/patient/:patientId
// ---------------------------------------------------------------------------
export const getRemindersByPatient = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const reminders = await reminderModel
      .find({ patientId })
      .sort({ scheduledAt: 1 });

    return res.status(200).json({
      success: true,
      count: reminders.length,
      data: reminders,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/reminders
// ---------------------------------------------------------------------------
export const createReminder = async (req, res, next) => {
  try {
    const {
      patientId,
      title,
      description,
      type,
      scheduledAt,
      recurrence,
      recurrenceDays,
      medication,
    } = req.body;

    if (!patientId || !title || !scheduledAt) {
      return res.status(400).json({
        success: false,
        message: "patientId, title, and scheduledAt are required.",
      });
    }

    const patient = await patientModel.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient record not found.",
      });
    }

    const caretakerId = await resolveCaretakerId(req.user);

    const reminder = await reminderModel.create({
      patientId,
      caretakerId: caretakerId || undefined,
      title: title.trim(),
      description: description ? description.trim() : "",
      type: type || "medicine",
      scheduledAt: new Date(scheduledAt),
      recurrence: recurrence || "none",
      recurrenceDays: recurrenceDays || [],
      medication: medication || { name: "", dosage: "", instructions: "" },
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Reminder created successfully.",
      data: reminder,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// PUT /api/v1/reminders/:id
// ---------------------------------------------------------------------------
export const updateReminder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      type,
      scheduledAt,
      recurrence,
      recurrenceDays,
      isActive,
      medication,
    } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description.trim();
    if (type !== undefined) updates.type = type;
    if (scheduledAt !== undefined) updates.scheduledAt = new Date(scheduledAt);
    if (recurrence !== undefined) updates.recurrence = recurrence;
    if (recurrenceDays !== undefined) updates.recurrenceDays = recurrenceDays;
    if (isActive !== undefined) updates.isActive = isActive;
    if (medication !== undefined) updates.medication = medication;

    const reminder = await reminderModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Reminder updated successfully.",
      data: reminder,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/v1/reminders/:id/acknowledge
// ---------------------------------------------------------------------------
export const acknowledgeReminder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reminder = await reminderModel.findByIdAndUpdate(
      id,
      { $set: { acknowledgedAt: new Date() } },
      { new: true }
    );

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Reminder acknowledged.",
      data: reminder,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// PATCH /api/v1/reminders/:id/toggle
// ---------------------------------------------------------------------------
export const toggleReminder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await reminderModel.findById(id);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found.",
      });
    }

    existing.isActive = !existing.isActive;
    await existing.save();

    return res.status(200).json({
      success: true,
      message: `Reminder ${existing.isActive ? "activated" : "deactivated"}.`,
      data: existing,
    });
  } catch (err) {
    next(err);
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/v1/reminders/:id
// ---------------------------------------------------------------------------
export const deleteReminder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reminder = await reminderModel.findByIdAndDelete(id);

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Reminder deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
};

