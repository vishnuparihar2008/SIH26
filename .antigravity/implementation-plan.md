# Implementation Plan
## AI-Based Cognitive Gaming and Memory Assistance Platform — NER

This plan sequences work so that a usable, demoable product exists at every
checkpoint, with AI and hardware integration layered in progressively rather than
attempted all at once. Phases can overlap where noted ("parallel track").

---

## Phase 0 — Scope Lock (Day 1)
**Goal:** Remove ambiguity before anyone writes code.
- Finalize the 2–3 games shipping for MVP (recommend: Memory Match, Pattern
  Recognition, Routine Recall).
- Pick the single MVP regional language for voice (based on Vosk/Piper/AI4Bharat
  coverage check).
- Confirm wearable approach: custom ESP32 prototype vs. off-the-shelf BLE device.
- Assign team tracks (see "Team Parallelization" below).

**Exit criteria:** PRD and Techspec decisions are no longer open questions.

---

## Phase 1 — Core Game Engine & UI (Days 2–4)
- Build the 2–3 chosen games as plain app logic, hardcoded difficulty.
- Elderly-friendly UI: large text, high contrast, minimal navigation depth.
- No AI, no backend, no wearable — this must run standalone.

**Exit criteria:** Games playable end-to-end on a real device, offline, with no
crashes.

---

## Phase 2 — Local Storage & Reminders (Completed ✅)
- Set up local offline schema (`patients`, `game_sessions`, `vitals_readings`, `alerts`, `reminders`, `sync_queue`) with `storage.ts`.
- Built reminder engine & scheduling (medicine, hydration, activity, meals, sleep, appointments) with `reminderService.ts`.
- Built Caretaker Dashboard reminder manager: set, edit, toggle, and delete care reminders for linked patients.
- Built elderly-friendly, high-contrast, offline-first `RemindersScreen.tsx` with one-tap completion & adherence tracking.
- Built `VitalsStatusScreen.tsx` with live telemetry, emergency tiered response matrix, and simulated vitals triggers.
- Enforced strict collection and login separation between Caretakers and Patients.

**Exit criteria:** Reminders fire and store correctly with the device in airplane mode.

---

## Phase 3 — Offline Voice (ASR + TTS) (Days 5–8)
- Integrate Vosk (STT) and Piper (TTS) for the MVP language.
- Standalone test script first, then wire into a `VoiceAssistScreen`.
- Fallback path confirmed (English/Hindi) if regional model quality is too low for
  the demo.

**Exit criteria:** A patient can issue a basic voice command and hear a spoken
response, fully offline.

*(Parallel track: Backend team starts Phase 6 here — it doesn't depend on this
phase.)*

---

## Phase 4 — Adaptive Difficulty Engine (Days 7–9)
- Build the on-device scoring/bandit module (pure JS/TS).
- Replace hardcoded difficulty from Phase 1 with engine output.
- If tuning weights against sample data, do that step in Colab, then ship the
  resulting config as a bundled JSON — not a live model call.

**Exit criteria:** Difficulty visibly adapts across at least 3 consecutive
sessions of synthetic play-testing.

---

## Phase 5 — Wearable Integration & Emergency Response (Days 9–14)
This is the highest-risk phase — start it with enough runway left to debug
hardware issues.

1. Get the ESP32 (or chosen wearable) broadcasting vitals over BLE.
2. Build BLE subscription in the app (`react-native-ble-plx`).
3. Build the on-device threshold engine (Normal/Low/High/Lethal classification).
4. Build the three action tiers:
   - SMS via native `SmsManager` bridge (Low)
   - Auto-retry calling via native `ACTION_CALL` bridge (High)
   - Local max-volume alarm + vibration + full-screen alert (Lethal — must work
     with zero signal)
5. Build a **simulated-vitals mode** (manual trigger buttons) as a demo-safety
   fallback in case live hardware misbehaves on stage.

**Exit criteria — critical test:** With the phone in airplane mode:
- Simulated "Low" reading → SMS attempt fires (verify via test SIM or logs, since
  actual delivery needs live signal).
- Simulated "High" reading → call intent fires and retries.
- Simulated "Lethal" reading → local alarm plays at full volume with no signal
  present at all.

---

## Phase 6 — Backend & Caregiver Dashboard (Days 5–12, parallel track)
Can start as soon as data models are agreed (end of Phase 0), independent of the
mobile AI work.
- Scaffold Express.js API (`/patients`, `/sessions`, `/vitals`, `/alerts`,
  `/reminders`).
- Build MongoDB schemas.
- Build caregiver dashboard (trends, activity, alert history, multi-patient view
  for health workers).
- Auth (JWT) for caregiver/health-worker accounts.

**Exit criteria:** Dashboard renders correctly against seeded test data, before
real sync exists.

---

## Phase 7 — Offline-First Sync (Days 13–16)
- Implement the `sync_queue` flush job (background task, triggered on
  connectivity change).
- Bulk-sync endpoints on the Express side to absorb large batches after extended
  offline periods.
- Conflict handling: last-write-wins (sufficient for single-device-per-patient
  MVP).

**Exit criteria — full end-to-end test:**
1. Put device in airplane mode.
2. Play games, trigger a reminder, simulate a vitals emergency.
3. Re-enable connectivity.
4. Confirm caregiver dashboard reflects all of the above within one sync cycle.

---

## Phase 8 — Polish, Testing, Demo Prep (Days 17–20)
- UI polish pass for elderly accessibility (contrast, font size, tap targets).
- Battery/performance check on a real low-end device, not just emulator.
- Rehearse the offline emergency-response demo specifically — this is the most
  failure-prone live demo moment, so script it and have the simulated-vitals
  fallback ready as backup.
- Prepare a short, honest note on language-coverage limitations rather than
  overclaiming full NER-language support.

---

## Team Parallelization Summary
| Track | Phases | Can start after |
|---|---|---|
| Mobile — Games/UI | 1, 2, 4 | Phase 0 |
| Mobile — Voice AI | 3 | Phase 0 |
| Mobile — Wearable/Emergency | 5 | Phase 1 partially done (needs local storage from Phase 2) |
| Backend/Dashboard | 6 | Phase 0 (data model agreement) |
| Integration/Sync | 7 | Phases 2 + 6 both functional |
| QA/Demo | 8 | Everything else substantially done |

## Key Risks to Track Throughout
- **Hardware risk (Phase 5):** always keep the simulated-vitals fallback working,
  even after real hardware works — it's your demo insurance.
- **Language coverage risk (Phase 3):** confirm MVP language viability *before*
  Phase 0 closes, not mid-build.
- **Scope creep:** resist adding more games or languages before Phases 1–5 are
  solid end-to-end.
