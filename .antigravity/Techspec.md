# Technical Specification
## AI-Based Cognitive Gaming and Memory Assistance Platform — NER

**Stack:** React Native (mobile) · Express.js + Node.js (backend) · MongoDB (cloud DB)
**Companion hardware:** BLE-connected wearable (custom ESP32 prototype or supported
smartwatch)

---

## 1. System Architecture

```
┌─────────────────────────────┐        BLE         ┌───────────────────────┐
│  Wearable (vitals sensor)   │ ─────────────────►  │   React Native App    │
│  ESP32 + MAX30102 + accel   │                     │   (patient device)    │
└─────────────────────────────┘                     │                        │
                                                      │  - Game engine         │
                                                      │  - Difficulty engine   │
                                                      │  - ASR/TTS (offline)   │
                                                      │  - Vitals threshold    │
                                                      │    engine              │
                                                      │  - Reminder scheduler  │
                                                      │  - Local SQLite store  │
                                                      │  - SMS / Call / Alarm  │
                                                      │    action layer        │
                                                      └──────────┬─────────────┘
                                                                 │ Sync when online
                                                                 ▼
                                                      ┌───────────────────────┐
                                                      │   Express.js API      │
                                                      │   (Node.js backend)   │
                                                      └──────────┬─────────────┘
                                                                 │
                                                                 ▼
                                                      ┌───────────────────────┐
                                                      │      MongoDB           │
                                                      └──────────┬─────────────┘
                                                                 │
                                                                 ▼
                                                      ┌───────────────────────┐
                                                      │  Caregiver Web/Mobile  │
                                                      │  Dashboard (React)    │
                                                      └───────────────────────┘
```

Core principle: **everything a patient needs must work with the phone in airplane
mode.** The backend only matters for caregiver-side visibility and cross-device
sync, never for real-time safety features.

---

## 2. Mobile App (React Native)

### 2.1 Navigation / Screens
- `HomeScreen` — large-icon menu (Games / Reminders / Talk / Emergency status)
- `GameScreen` (per game type: MemoryMatch, PatternRecognition, RoutineRecall,
  AttentionTask)
- `VoiceAssistScreen` — push-to-talk style interaction
- `ReminderScreen` / background notification handling
- `VitalsStatusScreen` — current readings + last sync state
- `CaregiverLinkScreen` — pairing/setup (phone numbers, backup contact)
- Caregiver-facing screens can be a separate lightweight React Native or React web
  app hitting the same Express API.

### 2.2 Local Data Layer
- **SQLite** via `react-native-sqlite-storage` or **WatermelonDB** for
  offline-first structured storage.
- Tables: `patients`, `game_sessions`, `vitals_readings`, `alerts`,
  `reminders`, `sync_queue`.
- All writes go local-first; a `sync_queue` table tracks unsynced records for the
  background sync job.

### 2.3 Offline AI Components
| Component | Library | Notes |
|---|---|---|
| Speech-to-text | Vosk (via native module / `react-native-vosk` or custom bridge) | Small offline models (~50MB), per-language |
| Text-to-speech | Piper TTS (bundled native binary + model) or platform TTS as fallback | Prefer Piper for regional-language voice quality |
| Difficulty adaptation | Custom JS module (see §2.4) | No external ML library needed |
| Regional language coverage | AI4Bharat resources evaluated per language | MVP scopes to 1 language with good coverage |

### 2.4 Difficulty Adaptation Engine
- Lightweight contextual-bandit / weighted scoring module, pure JS/TS, runs
  on-device with no network or heavy compute.
- Inputs per session: accuracy, response time, error type, game category.
- Output: next difficulty level (1–5) per game category, persisted per patient.
- Optionally fine-tuned/validated in Google Colab against synthetic or pilot data,
  then the resulting scoring weights are shipped as a small JSON config bundled
  into the app — **not** a heavyweight on-device model.

### 2.5 Bluetooth / Wearable Integration
- Library: `react-native-ble-plx`.
- Wearable broadcasts vitals as BLE GATT characteristics (HR, SpO2, motion/fall
  flag) at a configurable interval (e.g. every 10–30s).
- App subscribes to characteristic notifications; no pairing to internet required.

### 2.6 Vitals Threshold Engine
- Pure on-device rule evaluation, runs on every incoming reading:
  - `Normal`: within configured per-patient baseline ranges.
  - `Low`: mild deviation sustained over N readings.
  - `High`: significant deviation sustained over N readings.
  - `Lethal`: critical threshold breach or fall detected.
- Thresholds configurable per patient (caregiver sets baseline during setup, synced
  from backend when online, cached locally otherwise).

### 2.7 Emergency Action Layer
| Tier | Mechanism | Library / API | Network dependency |
|---|---|---|---|
| Low | SMS to caregiver | Native module wrapping Android `SmsManager` (`react-native-sms` or custom native module — RN has no first-class SMS-send API, requires native bridge) | GSM/cellular signal only, no data |
| High | Continuous automated calling | Native module using `Intent.ACTION_CALL` (custom native module; `Linking.openURL('tel:...')` opens dialer but doesn't auto-dial repeatedly, so a native module is needed for retry logic) | GSM/cellular signal only, no data |
| Lethal | Local loud alarm + vibration + full-screen alert | `react-native-sound` / `expo-av` + `Vibration` API + custom full-screen `Activity`/overlay | None — works with zero signal |
| All tiers | Queue-and-retry if no signal at all | `sync_queue`-style local queue, retried on connectivity/signal change listener | Delayed until signal returns |

> **Note:** Android's App permissions require explicit `SEND_SMS` and `CALL_PHONE`
> runtime permissions — request these during onboarding, not at the moment of
> emergency.

### 2.8 Background Sync
- A background task (e.g. `react-native-background-fetch` or a foreground service)
  periodically checks connectivity and flushes `sync_queue` to the Express API.
- Conflict strategy: last-write-wins is acceptable for MVP given single-device-per-
  patient assumption.

### 2.9 Caregiver Photo & Personal Content Upload
Three MVP games (My Memory Album, Family Face & Name Match, Local Culture Match)
require caregiver-supplied personal photos and labels — this was surfaced during
Phase 1 build and was not part of the original data model. Adding it here.

- **New screen:** `PhotoUploadScreen` (caregiver-facing, not shown to the patient)
  — capture or pick a photo, attach a label (name + relationship, e.g. "Simran —
  Granddaughter"), and tag which game(s) it's used in.
- **Capture/pick:** `react-native-image-picker` (camera + gallery), no cloud
  dependency for the picker itself.
- **Local storage:** photos saved to app-private storage
  (`react-native-fs`, app document directory) with a corresponding row in a new
  local `photo_assets` table (id, patientId, localUri, label, relationship,
  gameTags, syncedFlag) — mirrors the existing `sync_queue` pattern used for
  other tables.
- **Sync:** photo files themselves upload to the backend (multipart) only when
  online and only if the caregiver has enabled cloud backup for photos (opt-in —
  see privacy note below); the app works fully offline using the local copy
  regardless of backup status.
- **Consuming screens:** `MemoryAlbumScreen`, `FaceNameMatchScreen`, and
  `LocalCultureMatchScreen` read from `photo_assets` instead of the current
  Phase 1 `PlaceholderPhoto` stub — swap is a data-source change only, no
  change to game logic or UI flow.
- **Local culture content:** unlike the other two games, Local Culture Match
  content (festival/food/clothing items) may be partially pre-bundled
  (non-personal, reusable across patients) rather than fully caregiver-uploaded
  — caregiver upload only needed for any patient-specific regional content.

---

## 3. Backend (Express.js)

### 3.1 Structure
```
/src
  /routes
    patients.js
    caregivers.js
    sessions.js
    vitals.js
    alerts.js
    reminders.js
  /models        (Mongoose schemas)
  /controllers
  /middleware    (auth, validation)
  /services      (analytics aggregation)
  server.js
```

### 3.2 Key API Endpoints
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/login` | Caregiver/health-worker login |
| POST | `/api/patients` | Register patient profile |
| GET | `/api/patients/:id/summary` | Cognitive trend + activity summary |
| POST | `/api/sessions` | Bulk-sync offline game session records |
| POST | `/api/vitals` | Bulk-sync offline vitals readings |
| GET | `/api/vitals/:patientId/history` | Vitals history for dashboard |
| POST | `/api/alerts` | Sync emergency alert events (for audit trail) |
| GET | `/api/alerts/:patientId` | Alert history |
| POST | `/api/reminders` | Create/update reminder schedule |
| GET | `/api/caregivers/:id/patients` | Multi-patient view for health workers |
| POST | `/api/photo-assets` | Upload a caregiver photo (multipart) — only called if cloud backup is opted in |
| GET | `/api/photo-assets/:patientId` | Fetch a patient's backed-up photos (e.g. for re-provisioning a new device) |

### 3.3 Data Models (Mongoose, simplified)
- **Patient**: name, age, language, baseline vital ranges, caregiver refs, backup
  contact.
- **Caregiver**: name, phone, linked patients.
- **GameSession**: patientId, gameType, score, difficultyLevel, timestamp,
  synced flag.
- **VitalsReading**: patientId, hr, spo2, motionFlag, tier, timestamp.
- **AlertEvent**: patientId, tier, actionTaken (sms/call/alarm), timestamp,
  resolvedFlag.
- **Reminder**: patientId, type (medicine/hydration/activity/appointment),
  schedule, lastFired.
- **PhotoAsset**: patientId, fileUrl, label, relationship, gameTags,
  uploadedByCaregiverId, timestamp.

### 3.4 Non-Functional Requirements
- API must tolerate large batched syncs (many queued records arriving at once
  after extended offline periods) — use bulk insert endpoints, not one-record
  round trips.
- No safety-critical logic lives on the backend — it is a system of record, not a
  control system.
- Basic auth (JWT) for caregiver/health-worker accounts; patient devices don't
  need individual login for MVP (device-bound patient profile).

---

## 4. Security & Privacy
- Vitals and cognitive data are sensitive — encrypt local SQLite at rest
  (`react-native-sqlite-storage` with SQLCipher, or `expo-secure-store` for
  keys) and use HTTPS for all sync traffic.
- Minimal PII stored; caregiver phone numbers stored only for alerting purposes.
- Access control: a caregiver can only view patients explicitly linked to their
  account.
- **Family photos are sensitive by nature** — they typically depict people other
  than the patient (children, grandchildren, sometimes minors) who haven't
  separately consented to appearing in the app. Cloud backup of photos is
  opt-in only (§2.9); local-only storage is the default. Caregiver consent
  should be captured at upload time, not assumed.

## 5. Testing Strategy
- Unit tests for the difficulty engine and threshold engine (pure logic, easy to
  test in isolation).
- Manual airplane-mode test protocol for the full emergency pipeline (see
  `implementation-plan.md`, Phase 5).
- BLE integration tested against both the custom wearable prototype and a
  simulated-vitals mode (for demo reliability if hardware fails on stage).

## 6. Open Technical Decisions
- Final wearable: custom ESP32 prototype vs. an off-the-shelf BLE-accessible
  smartwatch — pending hardware availability.
- Final MVP regional language for ASR/TTS — pending AI4Bharat/Vosk coverage check.
- WatermelonDB vs. plain SQLite — pending team familiarity/time constraints.
