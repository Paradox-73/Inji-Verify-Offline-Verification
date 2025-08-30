/*
  Warnings:

  - You are about to drop the `TrustedIssuer` table. If the table is not empty, all the data it contains will be lost.
  - The primary key for the `AppSetting` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The required column `id` was added to the `AppSetting` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `updatedAt` to the `VerificationResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vcDbId` to the `VerificationResult` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TrustedIssuer";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "VerifiableCredential" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vc" JSONB NOT NULL,
    "vcId" TEXT,
    "issuer" TEXT,
    "holderSubjectId" TEXT,
    "types" TEXT,
    "validFrom" DATETIME,
    "validUntil" DATETIME,
    "credentialStatus" JSONB,
    "credentialSchema" JSONB,
    "refreshService" JSONB,
    "termsOfUse" JSONB,
    "evidence" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AppSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_AppSetting" ("createdAt", "key", "updatedAt", "value") SELECT "createdAt", "key", "updatedAt", "value" FROM "AppSetting";
DROP TABLE "AppSetting";
ALTER TABLE "new_AppSetting" RENAME TO "AppSetting";
CREATE UNIQUE INDEX "AppSetting_key_key" ON "AppSetting"("key");
CREATE TABLE "new_VerificationResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checks" JSONB NOT NULL,
    "errors" JSONB,
    "metadata" JSONB NOT NULL,
    "synced" BOOLEAN NOT NULL DEFAULT false,
    "vcDbId" TEXT NOT NULL,
    "vcId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "VerificationResult_vcDbId_fkey" FOREIGN KEY ("vcDbId") REFERENCES "VerifiableCredential" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_VerificationResult" ("checks", "createdAt", "errors", "id", "metadata", "status", "synced", "timestamp", "vcId") SELECT "checks", "createdAt", "errors", "id", "metadata", "status", "synced", "timestamp", "vcId" FROM "VerificationResult";
DROP TABLE "VerificationResult";
ALTER TABLE "new_VerificationResult" RENAME TO "VerificationResult";
CREATE INDEX "VerificationResult_status_idx" ON "VerificationResult"("status");
CREATE INDEX "VerificationResult_vcId_idx" ON "VerificationResult"("vcId");
CREATE INDEX "VerificationResult_timestamp_idx" ON "VerificationResult"("timestamp");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "VerifiableCredential_vcId_idx" ON "VerifiableCredential"("vcId");

-- CreateIndex
CREATE INDEX "VerifiableCredential_issuer_idx" ON "VerifiableCredential"("issuer");

-- CreateIndex
CREATE INDEX "VerifiableCredential_holderSubjectId_idx" ON "VerifiableCredential"("holderSubjectId");

-- CreateIndex
CREATE INDEX "VerifiableCredential_validFrom_idx" ON "VerifiableCredential"("validFrom");

-- CreateIndex
CREATE INDEX "VerifiableCredential_validUntil_idx" ON "VerifiableCredential"("validUntil");
