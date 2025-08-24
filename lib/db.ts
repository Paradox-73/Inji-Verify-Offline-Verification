// lib/db.ts
import Dexie, { Table } from 'dexie'

// ------------ Local-only (IndexedDB) shapes ------------
export interface LocalTrustedIssuer {
  id: string;           // did
  name: string;
  publicKey: string;
  revocationEndpoint?: string;
  addedDate: Date;      // local-only field
  trusted: boolean;
}

export interface LocalRevocationCache {
  vcId: string;
  isRevoked: boolean;
  cachedAt: Date;
  ttl: Date;
}

export interface LocalSyncQueue {
  id: string;
  type: 'verification-result' | 'settings-sync';
  data: string;           // encrypted JSON
  retryCount: number;
  createdAt: Date;
  lastAttempt?: Date;
}

// Optional: if you want to keep encrypted local copies of results
export interface EncryptedVerificationResult {
  id: string;
  timestamp: Date;
  encryptedData: string; // AES-GCM encrypted JSON
  hmac: string;          // HMAC-SHA256
  synced: boolean;
  syncAttempts: number;
  lastSyncAttempt?: Date;
}

export class InjilDatabase extends Dexie {
  verificationResults!: Table<EncryptedVerificationResult>
  trustedIssuers!: Table<LocalTrustedIssuer>
  revocationCache!: Table<LocalRevocationCache>
  syncQueue!: Table<LocalSyncQueue>

  constructor() {
    super('InjiVCVerifierDB')
    this.version(1).stores({
      verificationResults: 'id, timestamp, synced, lastSyncAttempt',
      trustedIssuers: 'id, name, trusted, addedDate',
      revocationCache: 'vcId, isRevoked, cachedAt, ttl',
      syncQueue: 'id, type, retryCount, createdAt, lastAttempt',
    })
  }
}

export const db = new InjilDatabase()
