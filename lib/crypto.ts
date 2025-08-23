import CryptoJS from 'crypto-js'

// WebCrypto-based encryption utilities for secure storage
export class EncryptionService {
  private static instance: EncryptionService
  private key: CryptoKey | null = null

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService()
    }
    return EncryptionService.instance
  }

  async initialize(passphrase?: string): Promise<void> {
    try {
      const keyMaterial = passphrase 
        ? await this.deriveKeyFromPassphrase(passphrase)
        : await this.generateKey()
      
      this.key = keyMaterial
    } catch (error) {
      console.error('Encryption service initialization failed:', error)
      throw new Error('Failed to initialize encryption')
    }
  }

  private async generateKey(): Promise<CryptoKey> {
    return await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    )
  }

  private async deriveKeyFromPassphrase(passphrase: string): Promise<CryptoKey> {
    const encoder = new TextEncoder()
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(passphrase),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )

    const salt = encoder.encode('inji-vc-verifier-salt-v1') // Fixed salt for consistency
    
    return await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
  }

  async encrypt(data: string): Promise<{ encrypted: string; hmac: string }> {
    if (!this.key) {
      throw new Error('Encryption service not initialized')
    }

    try {
      const encoder = new TextEncoder()
      const dataBytes = encoder.encode(data)
      
      // Generate random IV
      const iv = window.crypto.getRandomValues(new Uint8Array(12))
      
      // Encrypt data
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        this.key,
        dataBytes
      )

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength)
      combined.set(iv, 0)
      combined.set(new Uint8Array(encryptedBuffer), iv.length)
      
      const encryptedBase64 = btoa(String.fromCharCode(...combined))
      
      // Generate HMAC for integrity
      const hmac = await this.generateHMAC(encryptedBase64)
      
      return {
        encrypted: encryptedBase64,
        hmac: hmac
      }
    } catch (error) {
      console.error('Encryption failed:', error)
      throw new Error('Failed to encrypt data')
    }
  }

  async decrypt(encryptedData: string, hmac: string): Promise<string> {
    if (!this.key) {
      throw new Error('Encryption service not initialized')
    }

    try {
      // Verify HMAC first
      const validHmac = await this.verifyHMAC(encryptedData, hmac)
      if (!validHmac) {
        throw new Error('HMAC verification failed - data may be tampered')
      }

      // Decode base64
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      )
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, 12)
      const encryptedBuffer = combined.slice(12)
      
      // Decrypt
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        this.key,
        encryptedBuffer
      )

      const decoder = new TextDecoder()
      return decoder.decode(decryptedBuffer)
    } catch (error) {
      console.error('Decryption failed:', error)
      throw new Error('Failed to decrypt data')
    }
  }

  private async generateHMAC(data: string): Promise<string> {
    if (!this.key) {
      throw new Error('Encryption service not initialized')
    }

    try {
      // Export key for HMAC generation
      const keyBuffer = await window.crypto.subtle.exportKey('raw', this.key)
      
      // Import as HMAC key
      const hmacKey = await window.crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )

      const encoder = new TextEncoder()
      const signature = await window.crypto.subtle.sign(
        'HMAC',
        hmacKey,
        encoder.encode(data)
      )

      return btoa(String.fromCharCode(...new Uint8Array(signature)))
    } catch (error) {
      console.error('HMAC generation failed:', error)
      throw new Error('Failed to generate HMAC')
    }
  }

  private async verifyHMAC(data: string, hmac: string): Promise<boolean> {
    try {
      const expectedHmac = await this.generateHMAC(data)
      return expectedHmac === hmac
    } catch (error) {
      console.error('HMAC verification failed:', error)
      return false
    }
  }
}

export const encryptionService = EncryptionService.getInstance()