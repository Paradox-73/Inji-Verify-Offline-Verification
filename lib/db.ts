import Dexie, { Table } from 'dexie'
import { VerificationResult, TrustedIssuer, RevocationCache, SyncQueue } from '@/lib/types'

// Encrypted storage schema for IndexedDB
export interface EncryptedVerificationResult {
  id: string
  timestamp: Date
  encryptedData: string // AES-GCM encrypted JSON
  hmac: string // HMAC-SHA256 for integrity
  synced: boolean
  syncAttempts: number
  lastSyncAttempt?: Date
}

export class InjilDatabase extends Dexie {
  verificationResults!: Table<EncryptedVerificationResult>
  trustedIssuers!: Table<TrustedIssuer>
  revocationCache!: Table<RevocationCache>
  syncQueue!: Table<SyncQueue>

  constructor() {
    super('InjiVCVerifierDB')
    
    this.version(1).stores({
      verificationResults: 'id, timestamp, synced, lastSyncAttempt',
      trustedIssuers: 'id, name, trusted, addedDate',
      revocationCache: 'vcId, isRevoked, cachedAt, ttl',
      syncQueue: 'id, type, retryCount, createdAt, lastAttempt'
    })
  }
}

export const db = new InjilDatabase()