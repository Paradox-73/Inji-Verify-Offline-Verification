/* eslint-disable no-console */
// lib/qr-scanner.ts
// Thin wrapper around @zxing/browser to scan QR codes into a container div.
// Converts scanned text to a VerifiableCredential object (if JSON), else throws.

import type { VerifiableCredential } from '@/lib/types';

type ScannerControls = {
  stop(): void;
} | null;

class QRScannerService {
  private videoEl: HTMLVideoElement | null = null;
  private controls: ScannerControls = null;
  private running = false;

  get isRunning() {
    return this.running;
  }

  /**
   * Start scanning into the given container element ID.
   * Will create/attach a <video> element inside that container.
   */
  async startScanning(
    containerId: string,
    onCredentialScanned: (credential: VerifiableCredential) => void,
    onError: (error: string) => void,
    opts?: { deviceId?: string }
  ): Promise<void> {
    if (typeof window === 'undefined') return;
    if (this.running) return;

    // Lazy import to keep bundle lean
    const { BrowserQRCodeReader } = await import('@zxing/browser');

    // Ensure container
    const container = document.getElementById(containerId);
    if (!container) {
      onError(`QR container #${containerId} not found`);
      return;
    }

    // Create (or reuse) video element
    if (!this.videoEl) {
      this.videoEl = document.createElement('video');
      this.videoEl.setAttribute('playsinline', 'true');
      this.videoEl.style.width = '100%';
      this.videoEl.style.height = '100%';
    }

    // Clear container and attach video
    container.innerHTML = '';
    container.appendChild(this.videoEl);

    try {
      // If no device specified, pick the first camera
      let deviceId = opts?.deviceId;
      if (!deviceId) {
        const devices = await BrowserQRCodeReader.listVideoInputDevices();
        if (!devices?.length) {
          onError('No camera devices found');
          return;
        }
        // Prefer back camera when possible
        const backLike = devices.find(d =>
          /back|rear|environment/i.test(`${d.label}`),
        );
        deviceId = (backLike ?? devices[0]).deviceId;
      }

      const reader = new BrowserQRCodeReader();

      this.controls = await reader.decodeFromVideoDevice(
        deviceId,
        this.videoEl,
        (result, err, controls) => {
          // Save controls so we can stop later
          if (!this.controls) this.controls = controls;

          if (result) {
            // We got a QR payload as text
            const text = result.getText();
            try {
              const parsed = this.parseToVC(text);
              onCredentialScanned(parsed);
              // stop after successful read
              controls.stop();
              this.running = false;
            } catch (e) {
              console.warn('QR parse error:', e);
              onError(
                e instanceof Error ? e.message : 'Scanned QR is not a valid VC JSON',
              );
              // keep scanning; remove the line below if you want to stop on any result
              // controls.stop(); this.running = false;
            }
          } else if (err) {
            // ZXing emits a lot of decode attempts—only log hard errors
            // console.debug('decode tick', err);
          }
        },
      );

      this.running = true;
    } catch (e) {
      console.error('Failed to start scanner:', e);
      onError('Failed to start camera scanner');
      await this.stopScanning();
    }
  }

  /**
   * Stop scanning and release camera.
   */
  async stopScanning(): Promise<void> {
    try {
      if (this.controls) {
        this.controls.stop();
      }
    } catch (e) {
      console.warn('Error stopping scanner:', e);
    } finally {
      this.controls = null;
      this.running = false;
      // Leave the <video> element in the DOM; stream is already stopped by controls.stop()
    }
  }

  /**
   * Turn QR text content into a VerifiableCredential (expects JSON).
   * Extend this if your QR sometimes encodes URLs or base64 blobs.
   */
  private parseToVC(text: string): VerifiableCredential {
    // If it looks like a data URL or custom scheme, normalize here first.
    // e.g., if (text.startsWith('data:') || text.startsWith('inji:')) { ... }

    let obj: unknown;
    try {
      obj = JSON.parse(text);
    } catch {
      throw new Error('QR payload is not valid JSON');
    }

    // Very light sanity check—your vcVerifier will do full validation later
    if (
      !obj ||
      typeof obj !== 'object' ||
      !('@context' in (obj as any)) ||
      !('type' in (obj as any)) ||
      !('credentialSubject' in (obj as any))
    ) {
      throw new Error('QR JSON does not look like a Verifiable Credential');
    }

    return obj as VerifiableCredential;
  }
}

export const qrScannerService = new QRScannerService();
