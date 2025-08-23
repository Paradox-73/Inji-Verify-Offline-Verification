import { VerifiableCredential, VerificationResult, VerificationError, ErrorMessages } from '@/lib/types'
import { db } from '@/lib/db'
import { encryptionService } from '@/lib/crypto'
import { trustCacheManager } from '@/lib/trustCache'
import { hashService } from '@/lib/hash'

// Inji Verify SDK integration wrapper
export class VCVerifier {
  private static instance: VCVerifier
  
  static getInstance(): VCVerifier {
    if (!VCVerifier.instance) {
      VCVerifier.instance = new VCVerifier()
    }
    return VCVerifier.instance
  }

  async verifyCredential(vc: VerifiableCredential): Promise<VerificationResult> {
    const result: VerificationResult = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      vcId: vc.id,
      status: 'invalid',
      checks: {
        signatureValid: false,
        schemaValid: false,
        notExpired: false,
        notRevoked: false,
        trustedIssuer: false,
      },
      errors: [],
      metadata: {
        issuer: typeof vc.issuer === 'string' ? vc.issuer : vc.issuer.id,
        type: vc.type.join(', '),
        issuanceDate: vc.issuanceDate,
        expirationDate: vc.expirationDate,
        subjectId: vc.credentialSubject.id,
      },
      synced: false,
    }

    try {
      // 1. Schema validation
      result.checks.schemaValid = await this.validateSchema(vc)
      if (!result.checks.schemaValid) {
        result.errors?.push(ErrorMessages[VerificationError.SCHEMA_VALIDATION_FAILED])
      }

      // 2. Expiration check
      result.checks.notExpired = await this.checkExpiration(vc)
      if (!result.checks.notExpired) {
        result.errors?.push(ErrorMessages[VerificationError.CREDENTIAL_EXPIRED])
      }

      // 3. Signature verification
      result.checks.signatureValid = await this.verifySignature(vc)
      if (!result.checks.signatureValid) {
        result.errors?.push(ErrorMessages[VerificationError.SIGNATURE_VERIFICATION_FAILED])
      }

      // 4. Issuer trust check
      result.checks.trustedIssuer = await trustCacheManager.isTrustedIssuer(result.metadata.issuer)
      if (!result.checks.trustedIssuer) {
        result.errors?.push(ErrorMessages[VerificationError.UNTRUSTED_ISSUER])
      }

      // 5. Revocation check (with TTL cache)
      result.checks.notRevoked = await this.checkRevocation(vc.id)
      if (!result.checks.notRevoked) {
        result.errors?.push(ErrorMessages[VerificationError.CREDENTIAL_REVOKED])
      }

      // Determine overall status
      const allChecksPass = Object.values(result.checks).every(check => check === true)
      if (allChecksPass) {
        result.status = 'valid'
        result.errors = []
      } else if (result.checks.notExpired === false) {
        result.status = 'expired'
      } else {
        result.status = 'invalid'
      }

      // Store result securely
      await this.storeResult(result)
      
      return result
    } catch (error) {
      console.error('Verification failed:', error)
      result.status = 'error'
      result.errors = [error instanceof Error ? error.message : 'Unknown verification error']
      
      await this.storeResult(result)
      return result
    }
  }

  private async validateSchema(vc: VerifiableCredential): Promise<boolean> {
    try {
      // Basic VC structure validation
      if (!vc['@context'] || !Array.isArray(vc['@context'])) return false
      if (!vc.type || !Array.isArray(vc.type)) return false
      if (!vc.issuer) return false
      if (!vc.issuanceDate) return false
      if (!vc.credentialSubject) return false
      if (!vc.proof) return false

      // Check required VC context
      if (!vc['@context'].includes('https://www.w3.org/2018/credentials/v1')) {
        return false
      }

      // Check required VC type
      if (!vc.type.includes('VerifiableCredential')) {
        return false
      }

      return true
    } catch (error) {
      console.error('Schema validation error:', error)
      return false
    }
  }

  private async checkExpiration(vc: VerifiableCredential): Promise<boolean> {
    if (!vc.expirationDate) return true // No expiration date means it doesn't expire
    
    try {
      const expirationDate = new Date(vc.expirationDate)
      const now = new Date()
      return expirationDate > now
    } catch (error) {
      console.error('Expiration check error:', error)
      return false
    }
  }

  private async verifySignature(vc: VerifiableCredential): Promise<boolean> {
    try {
      // This is a simplified signature verification
      // In a real implementation, this would:
      // 1. Resolve the verification method from the DID
      // 2. Get the public key
      // 3. Verify the proof signature against the credential
      
      if (!vc.proof || !vc.proof.proofValue) return false
      
      // For demo purposes, we'll simulate signature verification
      // based on the presence of required proof fields
      const hasRequiredFields = !!(
        vc.proof.type &&
        vc.proof.created &&
        vc.proof.verificationMethod &&
        vc.proof.proofPurpose &&
        vc.proof.proofValue
      )
      
      // Simulate cryptographic verification with a small delay
      await new Promise(resolve => setTimeout(resolve, 100))
      
      return hasRequiredFields
    } catch (error) {
      console.error('Signature verification error:', error)
      return false
    }
  }

  private async checkRevocation(vcId: string): Promise<boolean> {
    try {
      // Check cache first
      const cachedResult = await trustCacheManager.getRevocationStatus(vcId)
      
      if (cachedResult !== null) {
        return !cachedResult
      }

      // If not in cache or expired, assume not revoked for offline operation
      // In a real implementation, this would attempt to check online if possible
      return true
    } catch (error) {
      console.error('Revocation check error:', error)
      // If we can't check, assume not revoked
      return true
    }
  }

  private async storeResult(result: VerificationResult): Promise<void> {
    try {
      const resultJson = JSON.stringify(result)
      const encrypted = await encryptionService.encrypt(resultJson)
      
      await db.verificationResults.add({
        id: result.id,
        timestamp: result.timestamp,
        encryptedData: encrypted.encrypted,
        hmac: encrypted.hmac,
        synced: false,
        syncAttempts: 0,
      })
    } catch (error) {
      console.error('Failed to store verification result:', error)
      throw new Error(ErrorMessages[VerificationError.STORAGE_ERROR])
    }
  }

  async getStoredResults(): Promise<VerificationResult[]> {
    try {
      const encryptedResults = await db.verificationResults
        .orderBy('timestamp')
        .reverse()
        .limit(1000)
        .toArray()

      const decryptedResults: VerificationResult[] = []
      
      for (const encrypted of encryptedResults) {
        try {
          const decryptedJson = await encryptionService.decrypt(
            encrypted.encryptedData,
            encrypted.hmac
          )
          const result = JSON.parse(decryptedJson)
          decryptedResults.push(result)
        } catch (error) {
          console.error('Failed to decrypt result:', encrypted.id, error)
        }
      }

      return decryptedResults
    } catch (error) {
      console.error('Failed to retrieve stored results:', error)
      return []
    }
  }
}

export const vcVerifier = VCVerifier.getInstance()