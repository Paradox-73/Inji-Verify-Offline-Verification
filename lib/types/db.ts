// lib/types/db.ts
// Mirrors your Prisma models (server). No Prisma imports here.

export interface DbTrustedIssuer {
  id: string;             // did
  name: string;
  publicKey: string;
  revocationEndpoint?: string | null;
  trusted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbVerificationResult {
  id: string;
  vcId: string;
  status: 'valid' | 'invalid' | 'error' | 'expired';
  timestamp: Date;
  checks: unknown;     // JSON
  errors?: unknown;    // JSON | null
  metadata: unknown;   // JSON
  synced: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbAppSetting {
  id: string;
  key: string;
  value: unknown; // JSON
  createdAt: Date;
  updatedAt: Date;
}
