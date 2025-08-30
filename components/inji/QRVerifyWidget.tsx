'use client';
import React from 'react';
import { QRCodeVerification } from '@mosip/react-inji-verify-sdk';
import { backgroundSyncService } from '@/lib/background-sync';
import { v4 as uuid } from 'uuid';

type VcStatus = 'SUCCESS' | 'INVALID' | 'EXPIRED';

const VERIFY_SERVICE_URL = process.env.NEXT_PUBLIC_VERIFY_SERVICE_URL!; // /api/inji

function mapStatus(s: VcStatus) {
  return s === 'SUCCESS' ? 'valid' : s === 'EXPIRED' ? 'expired' : 'invalid';
}

export default function QRVerifyWidget() {
  return (
    <QRCodeVerification
      verifyServiceUrl={VERIFY_SERVICE_URL}
      onVCProcessed={async (results) => {
        for (const r of results) {
            const vc: any = r.vc ?? {};
            const vr = {
            id: uuid(),
            vcId: vc.id ?? uuid(),
            status: mapStatus(r.vcStatus),
            timestamp: new Date(),
            checks: {
                signatureValid: r.vcStatus === 'SUCCESS',
                schemaValid: true,
                notExpired: r.vcStatus !== 'EXPIRED',
                notRevoked: true,
                trustedIssuer: true,
            },
            errors: r.vcStatus === 'SUCCESS' ? [] : ['Verification failed'],
            metadata: {
                issuer: typeof vc.issuer === 'string' ? vc.issuer : vc.issuer?.id ?? '',
                type: Array.isArray(vc.type) ? vc.type.join(',') : vc.type ?? '',
                issuanceDate: vc.validFrom ?? vc.issuanceDate ?? '',
                expirationDate: vc.validUntil ?? vc.expirationDate ?? '',
                subjectId: vc.credentialSubject?.id ?? '',
            },
            synced: false,
            };

            // ✅ Send BOTH VC and Result so the API can create the FK vcDbId
            await backgroundSyncService.queueJson('/api/sync/verifications', { vc, result: vr });
        }
        }}
      onError={(e: Error) => {
        console.error('[Inji QR Verify] error:', e);
        alert(`Scan error: ${e.message}`);
      }}
      triggerElement={<button className="btn btn-primary">Scan / Upload VC</button>}
    />
  );
}
