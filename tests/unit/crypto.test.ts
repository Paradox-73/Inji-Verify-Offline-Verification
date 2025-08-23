import { describe, it, expect, beforeEach } from 'vitest'
import { EncryptionService } from '@/lib/crypto'

// Mock WebCrypto for testing
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      generateKey: vi.fn().mockResolvedValue({}),
      encrypt: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
      decrypt: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
      exportKey: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
      importKey: vi.fn().mockResolvedValue({}),
      sign: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
      deriveKey: vi.fn().mockResolvedValue({})
    },
    getRandomValues: vi.fn().mockReturnValue(new Uint8Array(12))
  }
})

describe('EncryptionService', () => {
  let encryptionService: EncryptionService

  beforeEach(async () => {
    encryptionService = EncryptionService.getInstance()
    await encryptionService.initialize()
  })

  it('should create a singleton instance', () => {
    const instance1 = EncryptionService.getInstance()
    const instance2 = EncryptionService.getInstance()
    expect(instance1).toBe(instance2)
  })

  it('should initialize without errors', async () => {
    const service = EncryptionService.getInstance()
    await expect(service.initialize()).resolves.not.toThrow()
  })

  it('should encrypt and decrypt data', async () => {
    const testData = 'test data to encrypt'
    
    const encrypted = await encryptionService.encrypt(testData)
    expect(encrypted.encrypted).toBeDefined()
    expect(encrypted.hmac).toBeDefined()
    
    const decrypted = await encryptionService.decrypt(encrypted.encrypted, encrypted.hmac)
    expect(decrypted).toBe(testData)
  })

  it('should fail decryption with invalid HMAC', async () => {
    const testData = 'test data'
    const encrypted = await encryptionService.encrypt(testData)
    
    await expect(
      encryptionService.decrypt(encrypted.encrypted, 'invalid-hmac')
    ).rejects.toThrow('Failed to decrypt data')
  })
})