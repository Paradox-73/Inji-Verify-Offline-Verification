# 🌐 Inji Verify – Offline Verifiable Credential Verification (PWA + Backend)

This project implements an **offline-first verifier** for W3C/MOSIP Verifiable Credentials (VCs) using the **Inji Verify SDK**.  
It supports scanning QR codes, verifying credentials offline, storing results locally, and syncing them to a backend when online.  

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
