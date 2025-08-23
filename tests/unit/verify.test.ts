import { describe, it, expect, beforeEach } from 'vitest'
import { VCVerifier } from '@/lib/verify'
import { VerifiableCredential } from '@/lib/types'

describe('VCVerifier', () => {
  let verifier: VCVerifier
  let mockCredential: VerifiableCredential

  beforeEach(() => {
    verifier = VCVerifier.getInstance()
    mockCredential = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      id: 'test-credential-id',
      type: ['VerifiableCredential', 'UniversityDegreeCredential'],
      issuer: 'did:example:issuer123',
      issuanceDate: '2023-01-01T00:00:00Z',
      expirationDate: '2025-01-01T00:00:00Z',
      credentialSubject: {
        id: 'did:example:subject456',
        degree: {
          type: 'BachelorDegree',
          name: 'Bachelor of Science'
        }
      },
      proof: {
        type: 'Ed25519Signature2020',
        created: '2023-01-01T00:00:00Z',
        verificationMethod: 'did:example:issuer123#key-1',
        proofPurpose: 'assertionMethod',
        proofValue: 'z3MvGX7...'
      }
    }
  })

  it('should create a singleton instance', () => {
    const instance1 = VCVerifier.getInstance()
    const instance2 = VCVerifier.getInstance()
    expect(instance1).toBe(instance2)
  })

  it('should verify a valid credential', async () => {
    const result = await verifier.verifyCredential(mockCredential)
    
    expect(result.status).toBe('invalid') // Will be invalid due to untrusted issuer
    expect(result.checks.schemaValid).toBe(true)
    expect(result.checks.notExpired).toBe(true)
    expect(result.checks.signatureValid).toBe(true)
    expect(result.checks.trustedIssuer).toBe(false)
    expect(result.checks.notRevoked).toBe(true)
  })

  it('should detect expired credentials', async () => {
    const expiredCredential = {
      ...mockCredential,
      expirationDate: '2020-01-01T00:00:00Z'
    }
    
    const result = await verifier.verifyCredential(expiredCredential)
    
    expect(result.status).toBe('expired')
    expect(result.checks.notExpired).toBe(false)
  })

  it('should detect invalid schema', async () => {
    const invalidCredential = {
      ...mockCredential,
      '@context': ['https://invalid-context.com']
    }
    
    const result = await verifier.verifyCredential(invalidCredential)
    
    expect(result.checks.schemaValid).toBe(false)
  })

  it('should detect missing proof', async () => {
    const credentialWithoutProof = {
      ...mockCredential,
      proof: {
        type: '',
        created: '',
        verificationMethod: '',
        proofPurpose: '',
        proofValue: ''
      }
    }
    
    const result = await verifier.verifyCredential(credentialWithoutProof)
    
    expect(result.checks.signatureValid).toBe(false)
  })
})