// SHA-256 vcHash helper for credential integrity
export class HashService {
  static async sha256(data: string): Promise<string> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = new Uint8Array(hashBuffer)
    
    // Convert to hex string
    return Array.from(hashArray)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('')
  }

  static async vcHash(credential: any): Promise<string> {
    // Create a canonical representation of the credential for hashing
    const canonicalCredential = {
      '@context': credential['@context'],
      id: credential.id,
      type: credential.type,
      issuer: credential.issuer,
      issuanceDate: credential.issuanceDate,
      expirationDate: credential.expirationDate,
      credentialSubject: credential.credentialSubject,
      // Exclude proof for hash calculation
    }

    const canonicalString = JSON.stringify(canonicalCredential, Object.keys(canonicalCredential).sort())
    return await this.sha256(canonicalString)
  }

  static async verifyIntegrity(credential: any, expectedHash: string): Promise<boolean> {
    try {
      const calculatedHash = await this.vcHash(credential)
      return calculatedHash === expectedHash
    } catch (error) {
      console.error('Integrity verification failed:', error)
      return false
    }
  }
}

export const hashService = HashService