# Product Requirements Document (PRD)
## AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients in NER

**Version:** 1.0
**Status:** Draft — SIH 2026
**Team Stack:** React Native (mobile), Express.js (backend), MongoDB

---

## 1. Problem Statement

Elderly dementia patients in the North Eastern Region (NER) face limited access to
neurological care, cognitive therapy, and long-term support due to remote geography
and thin healthcare infrastructure. Patients experience memory decline, confusion,
anxiety, and social isolation. Caregivers struggle to continuously monitor and
engage with patients, especially across distances. Existing digital therapeutic
tools are neither affordable nor culturally/linguistically suited to NER.

## 2. Goals

1. Provide an engaging, adaptive cognitive-training experience elderly users can use
   independently, with voice support in regional languages.
2. Give caregivers visibility into cognitive trends and daily wellbeing without
   requiring constant connectivity.
3. Detect physical health emergencies (via a connected wearable) and respond with an
   escalating action plan, even with no internet access.
4. Work reliably in low-connectivity or fully offline conditions, syncing
   opportunistically.

## 3. Target Users

- **Primary:** Elderly individuals (60+) with mild-to-moderate dementia, living in
  rural/remote NER areas, often with low digital literacy.
- **Secondary:** Family caregivers, typically not co-located with the patient.
- **Tertiary:** Community health workers / ASHA workers who may support multiple
  patients.

## 4. Scope — Core Features

### 4.1 Cognitive Gaming & Memory Assistance
- Interactive games: memory recall, attention/concentration tasks, daily routine
  recall, pattern & object recognition.
- AI-driven adaptive difficulty based on patient performance history.
- Multilingual, voice-assisted interaction (regional NER languages where feasible,
  Hindi/English as fallback).
- Culturally familiar visuals, sounds, and themes.

### 4.2 Reminders
- Medicines, hydration, daily activities, medical appointments — locally scheduled,
  no internet required to fire.

### 4.3 Caregiver Dashboard
- Cognitive performance trends, activity levels, alerts, and reminder adherence.
- Synced opportunistically from the patient's device.

### 4.4 Offline-First Operation
- Full functionality (games, reminders, vitals monitoring, emergency response)
  without an internet connection.
- Background sync to cloud backend when connectivity is available.

### 4.5 Smartwatch Vitals Monitoring & Emergency Response
- Companion wearable (or supported smartwatch) streams vitals (heart rate, SpO2,
  fall/motion) to the app over Bluetooth (no internet dependency).
- On-device threshold engine classifies readings into Normal / Low / High / Lethal.
- Tiered, no-internet-required response:
  1. **Low emergency:** SMS to caregiver (via GSM/cellular SMS, not data).
  2. **High emergency:** Continuous automated calling to caregiver, with retry and
     escalation to a backup contact.
  3. **Lethal emergency:** Immediate on-device loud alarm + vibration + full-screen
     alert, which never depends on any network signal.

### 4.6 Accessibility
- Simple, high-contrast, large-text UI designed for elderly and low-literacy users.
- Works on entry-level Android tablets/phones.

## 5. Out of Scope (MVP / Hackathon)
- Clinical diagnosis or treatment recommendations.
- Support for every NER language at launch — MVP targets one well-supported
  language (e.g. Assamese or Hindi) plus English, with an architecture that allows
  more to be added later.
- Integration with hospital EMR systems.
- Training custom ASR/TTS models from scratch (pretrained/offline models are used
  instead — see Techspec).

## 6. Key Assumptions & Constraints
- Target devices: entry-to-mid-range Android tablets/phones with a SIM (voice/SMS
  capable, data optional).
- No dedicated GPU/training hardware locally; Google Colab used for any model
  fine-tuning.
- "Offline" means no internet/data required for core safety features; SMS/calls
  still require basic cellular signal, which is a known, disclosed limitation.
- Wearable is either a custom low-cost prototype (ESP32 + vitals sensor) or a
  BLE-accessible off-the-shelf device — decision tracked in Techspec.

## 7. Success Metrics (for demo/evaluation)
- Games playable fully offline with adaptive difficulty visibly changing across
  sessions.
- Voice interaction functioning offline in at least one regional language.
- Reminder fires correctly with no connectivity.
- Simulated vitals breach correctly triggers all three emergency tiers in an
  offline (airplane-mode) test.
- Caregiver dashboard reflects patient data after reconnecting from an offline
  session.

## 8. User Stories (representative)
- *As an elderly patient*, I want to play memory games with voice guidance in my
  language, so I can engage without needing to read or type.
- *As an elderly patient*, I want to be reminded to take my medicine and drink
  water, so I don't forget even when alone.
- *As a caregiver*, I want to be texted immediately if my parent's vitals look
  concerning, even if I'm not near a data connection myself, so I never miss an
  emergency.
- *As a caregiver*, I want to see how my parent's cognitive performance has
  trended over the past weeks, so I can decide if a clinical visit is needed.
- *As a community health worker*, I want a dashboard across multiple patients, so
  I can prioritize home visits.

## 9. Risks
- NER regional language ASR/TTS coverage is limited or absent for some languages —
  mitigate by scoping MVP language support and disclosing the gap transparently.
- Cellular signal (not just data) may be entirely absent in some areas — lethal-tier
  local alarm is designed to not depend on any network.
- Wearable hardware reliability for a hackathon prototype — mitigate with a
  simulated-vitals fallback mode for demo purposes.

## 10. References
- Detailed technical approach: `Techspec.md`
- Build sequencing: `implementation-plan.md`
