/* eslint-disable no-console */
// lib/qr-scanner.ts
// Thin wrapper around @zxing/browser to scan QR codes into a container div.
// Returns either a VerifiableCredential object (if obviously JSON) OR the raw text.
// The verification layer (Inji Verify / your vcVerifier) decides what to do.

import type { VerifiableCredential } from '@/lib/types';

type ScannerControls = { stop(): void } | null;

class QRScannerService {
  private videoEl: HTMLVideoElement | null = null;
  private controls: ScannerControls = null;
  private running = false;

  get isRunning() {
    return this.running;
  }

  async startScanning(
    containerId: string,
    // ✅ now accepts VC OR raw text
    onCredentialScanned: (payload: VerifiableCredential | string) => void,
    onError: (error: string) => void,
    opts?: { deviceId?: string }
  ): Promise<void> {
    if (typeof window === 'undefined') return;
    if (this.running) return;

    const { BrowserQRCodeReader } = await import('@zxing/browser');

    const container = document.getElementById(containerId);
    if (!container) {
      onError(`QR container #${containerId} not found`);
      return;
    }

    if (!this.videoEl) {
      this.videoEl = document.createElement('video');
      this.videoEl.setAttribute('playsinline', 'true');
      this.videoEl.style.width = '100%';
      this.videoEl.style.height = '100%';
    }

    container.innerHTML = '';
    container.appendChild(this.videoEl);

    try {
      let deviceId = opts?.deviceId;
      if (!deviceId) {
        const devices = await BrowserQRCodeReader.listVideoInputDevices();
        if (!devices?.length) {
          onError('No camera devices found');
          return;
        }
        const backLike = devices.find(d => /back|rear|environment/i.test(`${d.label}`));
        deviceId = (backLike ?? devices[0]).deviceId;
      }

      const reader = new BrowserQRCodeReader();

      this.controls = await reader.decodeFromVideoDevice(
  deviceId,
  this.videoEl,
  (result, _err, controls) => {
    if (!this.controls) this.controls = controls;
    if (!result) return;

    const text = result.getText();
    const normalized = this.normalizeToVCOrString(text);

    // Always notify the app
    onCredentialScanned(normalized);

    // ✅ Only stop camera if we actually recognized a VC object
    const isVC = typeof normalized === 'object' && normalized !== null;
    if (isVC) {
      controls.stop();
      this.running = false;
          }
        }
      );

      this.running = true;
    } catch (e) {
      console.error('Failed to start scanner:', e);
      onError('Failed to start camera scanner');
      await this.stopScanning();
    }
  }

  async stopScanning(): Promise<void> {
    try {
      this.controls?.stop();
    } catch (e) {
      console.warn('Error stopping scanner:', e);
    } finally {
      this.controls = null;
      this.running = false;
    }
  }

  /** Try to turn QR text into a VC; if not possible, return the raw string. Never throws. */
  private normalizeToVCOrString(text: string): VerifiableCredential | string {
    const tryParseJson = (s: string) => { try { return JSON.parse(s) as unknown; } catch { return null; } };

    // 1) Raw JSON
    let obj: unknown = tryParseJson(text);

    // 2) URL with ?vc= / ?vp= / ?credential=
    if (!obj && /^https?:\/\//i.test(text)) {
      try {
        const url = new URL(text);
        const param = url.searchParams.get('vc') || url.searchParams.get('vp') || url.searchParams.get('credential');
        if (param) {
          obj = tryParseJson(param) ?? (() => {
            try { return tryParseJson(atob(param.replace(/-/g, '+').replace(/_/g, '/'))); } catch { return null; }
          })();
        }
      } catch { /* ignore */ }
    }

    // 3) Base64/Base64URL candidate
    if (!obj && /^[A-Za-z0-9+/_-]+=*$/.test(text) && text.length > 20) {
      try {
        const decoded = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
        obj = tryParseJson(decoded);
      } catch { /* ignore */ }
    }

    // 4) JWT/JWS
    if (!obj && /^eyJ[A-Za-z0-9-_]+?\./.test(text)) {
      try {
        const payloadB64 = text.split('.')[1];
        const decoded = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
        const payload = tryParseJson(decoded) as any;
        obj = (payload && (payload.vc || payload.vp)) || payload || null;
      } catch { /* ignore */ }
    }

    // 5) Custom scheme like inji:
    if (!obj && /^inji:/i.test(text)) {
      const after = text.replace(/^inji:/i, '');
      obj = tryParseJson(after) ?? (() => {
        try { return tryParseJson(atob(after.replace(/-/g, '+').replace(/_/g, '/'))); } catch { return null; }
      })();
    }

    // If object looks like a VC, return it; else return raw string
    if (obj && typeof obj === 'object') {
      const o = obj as any;
      if (o['@context'] && o['type'] && o['credentialSubject']) {
        return obj as VerifiableCredential;
      }
    }
    return text;
  }
}

export const qrScannerService = new QRScannerService();
