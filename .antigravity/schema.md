# Database Schema: Patients & Caretakers

**Database:** MongoDB
**Relationship:** One-to-Many — one Caretaker monitors many Patients; each Patient belongs to exactly one Caretaker.

---

## Collections Overview

| Collection   | Purpose                                      |
|--------------|-----------------------------------------------|
| `caretakers` | Stores caretaker (guardian/nurse/family) accounts |
| `patients`   | Stores patient records, each linked to one caretaker |

Reference-based modeling is used (rather than embedding) since:
- Patients can be queried/updated independently of caretakers.
- The list of patients per caretaker can grow unbounded — embedding would risk hitting MongoDB's 16MB document size limit.
- Caretakers and patients have independent lifecycles (a caretaker account can exist without patients yet, and patient history should persist even if reassigned).

---

## 1. `caretakers` Collection

```json
{
  "_id": ObjectId("665f1a2b3c4d5e6f7a8b9c0d"),
  "fullName": "Anita Sharma",
  "email": "anita.sharma@example.com",
  "phone": "+91-9876543210",
  "passwordHash": "$2b$12$....",
  "role": "family_member",          // enum: "family_member" | "nurse" | "guardian" | "professional_caregiver"
  "relationshipToPatients": "Multiple",  // optional summary label
  "profileImageUrl": "https://cdn.example.com/avatars/anita.jpg",
  "isActive": true,
  "isEmailVerified": true,
  "notificationPreferences": {
    "email": true,
    "sms": false,
    "push": true
  },
  "address": {
    "line1": "42 MG Road",
    "city": "Delhi",
    "state": "Delhi",
    "postalCode": "110001",
    "country": "IN"
  },
  "createdAt": ISODate("2025-01-10T08:00:00Z"),
  "updatedAt": ISODate("2026-08-20T14:32:00Z"),
  "lastLoginAt": ISODate("2026-08-27T09:15:00Z")
}
```

### Field Notes
| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | auto | Primary key |
| `fullName` | String | ✅ | |
| `email` | String | ✅ | Unique index |
| `phone` | String | ✅ | Unique index recommended |
| `passwordHash` | String | ✅ | Never store plaintext |
| `role` | String (enum) | ✅ | Type of caretaker |
| `profileImageUrl` | String | ❌ | |
| `isActive` | Boolean | ✅ | Soft-disable flag |
| `isEmailVerified` | Boolean | ✅ | |
| `notificationPreferences` | Object | ❌ | |
| `address` | Object | ❌ | |
| `createdAt` / `updatedAt` | Date | ✅ | Timestamps |
| `lastLoginAt` | Date | ❌ | |

### Indexes
```js
db.caretakers.createIndex({ email: 1 }, { unique: true })
db.caretakers.createIndex({ phone: 1 }, { unique: true })
```

---

## 2. `patients` Collection

```json
{
  "_id": ObjectId("665f1b3c4d5e6f7a8b9c0d1e"),
  "caretakerId": ObjectId("665f1a2b3c4d5e6f7a8b9c0d"),  // FK -> caretakers._id (required, single value)
  "fullName": "Ramesh Kumar",
  "dateOfBirth": ISODate("1948-03-15T00:00:00Z"),
  "gender": "male",                 // enum: "male" | "female" | "other" | "prefer_not_to_say"
  "bloodGroup": "B+",
  "profileImageUrl": "https://cdn.example.com/avatars/ramesh.jpg",
  "contact": {
    "phone": "+91-9123456780",
    "email": "ramesh.kumar@example.com"
  },
  "address": {
    "line1": "12 Nehru Nagar",
    "city": "Delhi",
    "state": "Delhi",
    "postalCode": "110002",
    "country": "IN"
  },
  "relationshipToCaretaker": "Son",  // free text describing relation, e.g. "Son", "Daughter", "Assigned Nurse"
  "medicalInfo": {
    "conditions": ["Hypertension", "Type 2 Diabetes"],
    "allergies": ["Penicillin"],
    "medications": [
      {
        "name": "Metformin",
        "dosage": "500mg",
        "frequency": "Twice daily"
      }
    ],
    "primaryPhysician": "Dr. Neha Verma",
    "emergencyContact": {
      "name": "Sunita Kumar",
      "phone": "+91-9988776655",
      "relation": "Daughter"
    }
  },
  "vitalsMonitoring": {
    "enabled": true,
    "lastRecordedAt": ISODate("2026-08-27T07:00:00Z")
  },
  "status": "active",               // enum: "active" | "inactive" | "deceased" | "discharged"
  "notes": "Requires reminder for evening medication.",
  "createdAt": ISODate("2025-02-01T10:00:00Z"),
  "updatedAt": ISODate("2026-08-27T07:05:00Z")
}
```

### Field Notes
| Field | Type | Required | Notes |
|---|---|---|---|
| `_id` | ObjectId | auto | Primary key |
| `caretakerId` | ObjectId | ✅ | References `caretakers._id`. **Single value only** — enforces one caretaker per patient. |
| `fullName` | String | ✅ | |
| `dateOfBirth` | Date | ✅ | |
| `gender` | String (enum) | ❌ | |
| `bloodGroup` | String | ❌ | |
| `contact` | Object | ❌ | |
| `address` | Object | ❌ | |
| `relationshipToCaretaker` | String | ❌ | Descriptive only |
| `medicalInfo` | Object | ❌ | Sub-document — see below |
| `medicalInfo.conditions` | Array\<String\> | ❌ | |
| `medicalInfo.allergies` | Array\<String\> | ❌ | |
| `medicalInfo.medications` | Array\<Object\> | ❌ | Each with `name`, `dosage`, `frequency` |
| `medicalInfo.emergencyContact` | Object | ❌ | |
| `vitalsMonitoring.enabled` | Boolean | ❌ | Toggle for monitoring features |
| `status` | String (enum) | ✅ | |
| `notes` | String | ❌ | Free-form caretaker notes |
| `createdAt` / `updatedAt` | Date | ✅ | Timestamps |

### Indexes
```js
db.patients.createIndex({ caretakerId: 1 })        // fast lookup of all patients for a caretaker
db.patients.createIndex({ fullName: "text" })       // optional: search by name
db.patients.createIndex({ status: 1 })
```

---

## Relationship Enforcement (One-to-Many)

MongoDB doesn't enforce foreign keys natively, so the "one caretaker per patient" rule is enforced at the **application/schema-validation layer**:

1. **`caretakerId` is a single ObjectId field (not an array)** on the `patients` document — structurally this makes many-to-many impossible; each patient can only point to one caretaker at a time.
2. **Reassignment, not duplication** — if a patient needs a new caretaker, update `caretakerId` on the existing patient document rather than creating a second link.
3. **Optional: JSON Schema validation** at the collection level:

```js
db.createCollection("patients", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["caretakerId", "fullName", "dateOfBirth", "status"],
      properties: {
        caretakerId: {
          bsonType: "objectId",
          description: "must reference exactly one caretaker and is required"
        },
        status: {
          enum: ["active", "inactive", "deceased", "discharged"]
        }
      }
    }
  }
})
```

---

## Common Queries

**Get all patients for a caretaker:**
```js
db.patients.find({ caretakerId: ObjectId("665f1a2b3c4d5e6f7a8b9c0d") })
```

**Get a patient with their caretaker's details (aggregation join):**
```js
db.patients.aggregate([
  { $match: { _id: ObjectId("665f1b3c4d5e6f7a8b9c0d1e") } },
  {
    $lookup: {
      from: "caretakers",
      localField: "caretakerId",
      foreignField: "_id",
      as: "caretaker"
    }
  },
  { $unwind: "$caretaker" }
])
```

**Count patients per caretaker:**
```js
db.patients.aggregate([
  { $group: { _id: "$caretakerId", patientCount: { $sum: 1 } } }
])
```

---

## Entity Relationship Diagram (conceptual)

```
┌─────────────────────┐
│     caretakers       │
│----------------------│
│ _id  (PK)            │
│ fullName             │
│ email                │
│ phone                │
│ role                 │
│ ...                  │
└──────────┬───────────┘
           │ 1
           │
           │ has many
           │
           ▼ *
┌─────────────────────┐
│      patients        │
│----------------------│
│ _id  (PK)            │
│ caretakerId (FK) ────┼──> references caretakers._id
│ fullName             │
│ dateOfBirth          │
│ medicalInfo          │
│ status               │
│ ...                  │
└─────────────────────┘
```

---

## Notes on Design Choices

- **Why not embed patients inside the caretaker document?** A caretaker could have many patients over time (professional caregivers especially), which risks unbounded document growth and makes independent patient updates slower (requires rewriting the whole caretaker doc).
- **Why reference instead of embedding caretaker inside patient?** Caretaker info (contact, login credentials) changes independently and is queried on its own (e.g., login flow) — duplicating it per patient would cause data drift.
- **Soft deletes recommended**: Use `status`/`isActive` flags rather than hard-deleting records, to preserve medical history and audit trails.
