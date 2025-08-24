// lib/verify-any.ts
import type { VerifiableCredential, VerificationResult as VResult } from '@/lib/types';
import { vcVerifier } from '@/lib/verify';

/**
 * Optional: lightweight decoding for local/offline dev when Inji SDK isn't wired yet.
 */
const tryParseJson = (s: string) => { try { return JSON.parse(s) as unknown } catch { return null } };
const base64ToText = (b64: string) => { try { return atob(b64.replace(/-/g, '+').replace(/_/g, '/')) } catch { return null } };

function decodeStringToVC(text: string): VerifiableCredential | null {
  // 1) raw JSON
  let obj: any = tryParseJson(text);

  // 2) URL param
  if (!obj && /^https?:\/\//i.test(text)) {
    try {
      const url = new URL(text);
      const p = url.searchParams.get('vc') || url.searchParams.get('vp') || url.searchParams.get('credential');
      if (p) obj = tryParseJson(p) ?? tryParseJson(base64ToText(p) || '');
    } catch { /* ignore */ }
  }

  // 3) base64/base64url
  if (!obj && /^[A-Za-z0-9+/_-]+=*$/.test(text) && text.length > 20) {
    obj = tryParseJson(base64ToText(text) || '');
  }

  // 4) JWT/JWS
  if (!obj && /^eyJ[A-Za-z0-9-_]+?\./.test(text)) {
    const payloadB64 = text.split('.')[1];
    const decoded = base64ToText(payloadB64 || '');
    const payload = decoded ? tryParseJson(decoded) as any : null;
    obj = (payload && (payload.vc || payload.vp)) || payload || null;
  }

  // 5) inji: scheme
  if (!obj && /^inji:/i.test(text)) {
    const after = text.replace(/^inji:/i, '');
    obj = tryParseJson(after) ?? tryParseJson(base64ToText(after) || '');
  }

  if (obj && typeof obj === 'object' && obj['@context'] && obj['type'] && obj['credentialSubject']) {
    return obj as VerifiableCredential;
  }
  return null;
}

/**
 * The one function your UI calls after a scan.
 * - string: pass to Inji SDK if available; else try local decode+verify
 * - VC object: verify locally (until SDK is plugged end‑to‑end)
 */
export async function verifyAny(input: VerifiableCredential | string): Promise<VResult> {
  // If the Inji Verify SDK is available, prefer it for string payloads.
  const w = typeof window !== 'undefined' ? (window as any) : undefined;

  if (typeof input === 'string') {
    if (w?.injiVerify?.verify) {
      // Example shape; adapt to the actual SDK API when you wire it.
      // Expectation: returns { status, checks, errors, metadata, id, timestamp, vcId, synced }
      const sdkResult = await w.injiVerify.verify(input);
      return sdkResult as VResult;
    }

    // Fallback for local dev: try to decode and verify with your current verifier
    const vc = decodeStringToVC(input);
    if (vc) {
      return vcVerifier.verifyCredential(vc);
    }

    // Could not decode; return a structured error rather than throwing
    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      vcId: 'unknown',
      status: 'error',
      checks: {
        signatureValid: false,
        schemaValid: false,
        notExpired: false,
        notRevoked: false,
        trustedIssuer: false,
      },
      errors: ['Unrecognized payload for verification'],
      metadata: { issuer: 'unknown', type: 'unknown', issuanceDate: new Date().toISOString() },
      synced: false,
    };
  }

  // Already a VC object → verify locally for now
  return vcVerifier.verifyCredential(input);
}
