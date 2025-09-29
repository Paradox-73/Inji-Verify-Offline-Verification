# 🌐 Inji Verify – Offline Verifiable Credential Verification (PWA + Backend)

This project implements an **offline-first verifier** for W3C/MOSIP Verifiable Credentials (VCs) using the **Inji Verify SDK**.  
It supports scanning QR codes, verifying credentials offline, storing results locally, and syncing them to a backend when online.. 

---

## ✨ Features Implemented
- **QR Code Scanning**: Using [`zxing-wasm`](https://github.com/Sec-ant/zxing-wasm) in the React frontend.
- **Offline Verification**:
  - Signature validation using cached issuer DID keys.
  - Provisional results when DID/status are not yet resolved.
- **Connectivity-Aware Flow**:
  - Immediate offline result.
  - Deferred DID resolution and revocation check when online.
- **Local Storage (IndexedDB via Dexie)**:
  - Stores `credentials`, `verificationResults`, `issuers`, `revocationCache`, `outbox`.
- **Background Sync**:
  - Outbox jobs processed when online.
  - Service Worker triggers reconciliation.
- **Revocation Handling (Good-to-have)**:
  - Pre-cached allow/deny lists of revoked credentials or issuers.
- **Backend (Express + Prisma)**:
  - Prisma/Postgres database with idempotent **UPSERT** (no duplicates).
  - API for syncing verification results.
  - Optional endpoint to serve pre-cached revocation lists.
- **Prisma Database Schema**:
  - Stores raw VC JSON.
  - Extracted fields: issuer, subject, types, validity, proof.
  - Unique `fingerprint` (SHA-256) for de-duplication.
  - Linked `verificationResults` with `signatureOK`, `status`, `mode`, timestamps.

---

## 🗂 Project Structure
/frontend
├── src/
│ ├── pages/Scan.tsx # QR scanner UI
│ ├── lib/
│ │ ├── verify.ts # core verify logic
│ │ ├── outbox.ts # background sync worker
│ │ ├── didCache.ts # DID document cache
│ │ ├── revocationCache.ts# optional revocation cache
│ │ ├── indexedDb.ts # Dexie schema
│ │ └── uniqueKey.ts # stable credential key
│ └── service-worker.ts # Background sync + triggers
└── package.json

/backend
├── prisma/schema.prisma # Prisma schema (VC + VerificationResult)
├── src/
│ ├── routes/verifyUpsert.ts# UPSERT API for credentials
│ ├── routes/revocation.ts # Optional: serve revocation lists
│ ├── middleware/validatePayload.ts
│ └── server.ts # Express entrypoint
├── docker-compose.yml # Services (backend, DB)
└── package.json

---

## ⚙️ Prerequisites
- Node.js (≥ 18)
- pnpm / yarn / npm
- Docker + Docker Compose (for backend DB and services)
- Prisma CLI (`npx prisma`)

---

## 🚀 Getting Started

### 1. Clone repo
```bash
git clone https://github.com/your-org/inji-verify-offline.git
cd inji-verify-offline

Environment setup

Create .env in /frontend:

VITE_SYNC_ENDPOINT=http://localhost:3000/api/verify/upsert
VITE_REVOCATION_JSON_URL=http://localhost:3000/api/revocation.json


Create .env in /backend:

DATABASE_URL=postgresql://user:password@localhost:5432/injiverify

Backend (Express + Prisma)
Run DB + backend
cd backend
docker compose up -d             # start Postgres + backend
docker compose logs -f backend   # follow logs

Prisma commands
# Apply migrations
npx prisma migrate dev --name "init"

# Generate Prisma client
npx prisma generate

# Open Prisma Studio (GUI)
npx prisma studio


Frontend (React PWA)
Install & run
cd frontend
npm install       # or npm install / yarn install
npm dev           # starts Vite dev server

How to Use

Scan a VC QR

Open frontend UI → scan with webcam/phone camera.

Immediate offline result shown:

✅ Signature OK · ⚠ Revocation unknown

⚠ Signature unknown (offline)

Go Online

Background Sync triggers.

Outbox jobs resolve DID, check revocation, and sync results to backend.

Check results

View synced results in backend DB via Prisma Studio or API.

States include:

online_verified

revoked

provisional

key_mismatch / expired

Commands Cheat Sheet
Backend
docker compose up -d              # start backend + DB
docker compose down               # stop all services
npx prisma migrate dev             # apply DB schema
npx prisma studio                  # open DB GUI

Frontend
npm dev                          # run frontend locally
npm build && pnpm preview        # production build


What We Implemented

Offline-first verification pipeline (signature check, provisional results).

Outbox pattern for deferred online verification.

DID cache (issuer documents, with TTL).

Revocation cache (good-to-have) (local JSON whitelist/blacklist).

Idempotent sync to backend (UPSERT by fingerprint).

Prisma DB schema with raw VC JSON + extracted fields.

UI states for offline/online, revoked, expired, provisional.

Audit trail (createdAt, updatedAt, status timestamps).


Next Steps / Bonus

DID resolution offline cache (bonus).

Multi-VC scanning.

Export logs (CSV/JSON).

Native mobile wrapper (Android/iOS).

Performance benchmarking.


Example VC Payload (for testing)

{
  "issuanceDate": "2025-09-23T05:02:24.720Z",
  "credentialSubject": {
    "fullName": "John Doe",
    "gender": "Male",
    "primaryCropType": "Maize",
    "secondaryCropType": "Rice",
    "mobileNumber": "9876543210",
    "postalCode": "453000",
    "landArea": "3 hectares",
    "farmerID": "987654321",
    "dateOfBirth": "25-05-1990",
    "villageOrTown": "Koramangala",
    "district": "Bangalore",
    "state": "Karnataka",
    "landOwnershipType": "Owner",
    "face": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  },
  "type": ["VerifiableCredential", "FarmerCredential"],
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://piyush7034.github.io/my-files/farmer.json",
    "https://w3id.org/security/suites/ed25519-2020/v1"
  ],
  "issuer": "did:web:piyush7034.github.io:my-files:piyush",
  "expirationDate": "2027-09-23T05:02:24.720Z",
  "proof": {
    "type": "Ed25519Signature2020",
    "created": "2025-09-22T23:32:24Z",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:web:piyush7034.github.io:my-files:piyush#mI5Tk0t...",
    "proofValue": "z4CSUxdD3EgUfzDTHdCNBbAyFVNqqShwCZYRC6sjpPxvr8i..."
  }
}

