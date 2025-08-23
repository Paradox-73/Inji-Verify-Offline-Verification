import { z } from 'zod'

// Core VC verification types
export const VerifiableCredentialSchema = z.object({
  '@context': z.array(z.string()),
  id: z.string(),
  type: z.array(z.string()),
  issuer: z.union([z.string(), z.object({ id: z.string() })]),
  issuanceDate: z.string(),
  expirationDate: z.string().optional(),
  credentialSubject: z.record(z.any()),
  proof: z.object({
    type: z.string(),
    created: z.string(),
    verificationMethod: z.string(),
    proofPurpose: z.string(),
    proofValue: z.string(),
  }),
})

export const VerificationResultSchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  vcId: z.string(),
  status: z.enum(['valid', 'invalid', 'error', 'expired']),
  checks: z.object({
    signatureValid: z.boolean(),
    schemaValid: z.boolean(),
    notExpired: z.boolean(),
    notRevoked: z.boolean(),
    trustedIssuer: z.boolean(),
  }),
  errors: z.array(z.string()).optional(),
  metadata: z.object({
    issuer: z.string(),
    type: z.string(),
    issuanceDate: z.string(),
    expirationDate: z.string().optional(),
    subjectId: z.string().optional(),
  }),
  synced: z.boolean().default(false),
})

export const SettingsSchema = z.object({
  syncEndpoint: z.string().url().optional(),
  wifiOnlySync: z.boolean().default(true),
  autoSync: z.boolean().default(true),
  encryptionEnabled: z.boolean().default(true),
  maxStorageEntries: z.number().min(10).max(10000).default(1000),
  cacheTTL: z.number().min(3600).max(86400 * 30).default(86400 * 7), // 7 days default
})

export type VerifiableCredential = z.infer<typeof VerifiableCredentialSchema>
export type VerificationResult = z.infer<typeof VerificationResultSchema>
export type Settings = z.infer<typeof SettingsSchema>

// Additional types for database schema
export interface TrustedIssuer {
  id: string
  name: string
  publicKey: string
  revocationEndpoint?: string
  addedDate: Date
  trusted: boolean
}

export interface RevocationCache {
  vcId: string
  isRevoked: boolean
  cachedAt: Date
  ttl: Date
}

export interface SyncQueue {
  id: string
  type: 'verification-result' | 'settings-sync'
  data: string // Encrypted JSON
  retryCount: number
  createdAt: Date
  lastAttempt?: Date
}

// Error taxonomy for clear UX feedback
export enum VerificationError {
  INVALID_QR_CODE = 'INVALID_QR_CODE',
  INVALID_VC_FORMAT = 'INVALID_VC_FORMAT',
  SIGNATURE_VERIFICATION_FAILED = 'SIGNATURE_VERIFICATION_FAILED',
  SCHEMA_VALIDATION_FAILED = 'SCHEMA_VALIDATION_FAILED',
  CREDENTIAL_EXPIRED = 'CREDENTIAL_EXPIRED',
  CREDENTIAL_REVOKED = 'CREDENTIAL_REVOKED',
  UNTRUSTED_ISSUER = 'UNTRUSTED_ISSUER',
  NETWORK_ERROR = 'NETWORK_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  CRYPTO_ERROR = 'CRYPTO_ERROR',
}

export const ErrorMessages: Record<VerificationError, string> = {
  [VerificationError.INVALID_QR_CODE]: 'QR code could not be read or decoded',
  [VerificationError.INVALID_VC_FORMAT]: 'Invalid Verifiable Credential format',
  [VerificationError.SIGNATURE_VERIFICATION_FAILED]: 'Digital signature verification failed',
  [VerificationError.SCHEMA_VALIDATION_FAILED]: 'Credential schema validation failed',
  [VerificationError.CREDENTIAL_EXPIRED]: 'Credential has expired',
  [VerificationError.CREDENTIAL_REVOKED]: 'Credential has been revoked',
  [VerificationError.UNTRUSTED_ISSUER]: 'Credential issuer is not trusted',
  [VerificationError.NETWORK_ERROR]: 'Network connection error',
  [VerificationError.STORAGE_ERROR]: 'Local storage error',
  [VerificationError.CRYPTO_ERROR]: 'Cryptographic operation failed',
}