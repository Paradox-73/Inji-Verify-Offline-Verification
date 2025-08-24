// lib/trustCache.ts
/* eslint-disable no-console */
import { db, LocalTrustedIssuer, LocalRevocationCache } from '@/lib/db'

// Trust cache manager logic
export class TrustCacheManager {
  private static instance: TrustCacheManager

  static getInstance(): TrustCacheManager {
    if (!TrustCacheManager.instance) {
      TrustCacheManager.instance = new TrustCacheManager()
    }
    return TrustCacheManager.instance
  }

  async addTrustedIssuer(issuer: Omit<LocalTrustedIssuer, 'addedDate'>): Promise<void> {
    try {
      const trustedIssuer: LocalTrustedIssuer = {
        ...issuer,
        addedDate: new Date(),
      }

      await db.trustedIssuers.add(trustedIssuer)
    } catch (error) {
      console.error('Failed to add trusted issuer:', error)
      throw new Error('Failed to add trusted issuer')
    }
  }

  async removeTrustedIssuer(issuerId: string): Promise<void> {
    try {
      await db.trustedIssuers.delete(issuerId)
    } catch (error) {
      console.error('Failed to remove trusted issuer:', error)
      throw new Error('Failed to remove trusted issuer')
    }
  }

  async isTrustedIssuer(issuerId: string): Promise<boolean> {
    try {
      const issuer = await db.trustedIssuers
        .where('id')
        .equals(issuerId)
        .and((issuer) => issuer.trusted)
        .first()

      return !!issuer
    } catch (error) {
      console.error('Failed to check trusted issuer:', error)
      return false
    }
  }

  async getTrustedIssuers(): Promise<LocalTrustedIssuer[]> {
    try {
      return await db.trustedIssuers.orderBy('addedDate').reverse().toArray()
    } catch (error) {
      console.error('Failed to get trusted issuers:', error)
      return []
    }
  }

  async updateIssuerTrust(issuerId: string, trusted: boolean): Promise<void> {
    try {
      await db.trustedIssuers.update(issuerId, { trusted })
    } catch (error) {
      console.error('Failed to update issuer trust:', error)
      throw new Error('Failed to update issuer trust')
    }
  }

  async cacheRevocationStatus(vcId: string, isRevoked: boolean, ttlHours: number = 24): Promise<void> {
    try {
      const ttl = new Date()
      ttl.setHours(ttl.getHours() + ttlHours)

      const cacheEntry: LocalRevocationCache = {
        vcId,
        isRevoked,
        cachedAt: new Date(),
        ttl,
      }

      await db.revocationCache.put(cacheEntry)
    } catch (error) {
      console.error('Failed to cache revocation status:', error)
      throw new Error('Failed to cache revocation status')
    }
  }

  async getRevocationStatus(vcId: string): Promise<boolean | null> {
    try {
      const cached = await db.revocationCache
        .where('vcId')
        .equals(vcId)
        .and((cache) => cache.ttl > new Date())
        .first()

      return cached ? cached.isRevoked : null
    } catch (error) {
      console.error('Failed to get revocation status:', error)
      return null
    }
  }

  async cleanExpiredCache(): Promise<void> {
    try {
      const now = new Date()
      await db.revocationCache.where('ttl').below(now).delete()
    } catch (error) {
      console.error('Failed to clean expired cache:', error)
    }
  }

  async getHealthStats(): Promise<{
  totalIssuers: number
  trustedIssuers: number
  untrustedIssuers: number
  cacheEntries: number
}> {
  try {
    const [total, trusted, cache] = await Promise.all([
      db.trustedIssuers.count(),
      // 👇 Do NOT use where('trusted').equals(true) — boolean isn't an IndexableType
      db.trustedIssuers.filter((i) => i.trusted === true).count(),
      db.revocationCache.count(),
    ]);

    return {
      totalIssuers: total,
      trustedIssuers: trusted,
      untrustedIssuers: total - trusted,
      cacheEntries: cache,
    };
  } catch (error) {
    console.error('Failed to get health stats:', error);
    return {
      totalIssuers: 0,
      trustedIssuers: 0,
      untrustedIssuers: 0,
      cacheEntries: 0,
    };
  }
}

}

export const trustCacheManager = TrustCacheManager.getInstance()
