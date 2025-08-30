// app/scan/page.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Loader2, QrCode } from 'lucide-react'
import VerificationResult from '@/components/VerificationResult'
import { backgroundSyncService } from '@/lib/background-sync'
import type { VerificationResult as VResult } from '@/lib/types'
import toast, { Toaster } from 'react-hot-toast'
import { QRCodeVerification } from '@mosip/react-inji-verify-sdk'

const VERIFY_SERVICE_URL = process.env.NEXT_PUBLIC_VERIFY_SERVICE_URL ?? '/api/inji'

function mapStatus(s: 'SUCCESS' | 'INVALID' | 'EXPIRED'): VResult['status'] {
  return s === 'SUCCESS' ? 'valid' : s === 'EXPIRED' ? 'expired' : 'invalid'
}

export default function ScanPage() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [currentResult, setCurrentResult] = useState<VResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scannerKey, setScannerKey] = useState(0)
  const [lastVc, setLastVc] = useState<any | null>(null);

  useEffect(() => {
    try {
      // @ts-ignore
      backgroundSyncService.start?.(30_000) || backgroundSyncService.startPeriodicSync?.(30_000)
      setIsInitialized(true)
      toast.success('Verifier ready')
    } catch (e) {
      console.error(e)
      setError('Failed to initialize')
      toast.error('Initialization failed')
    }
  }, [])

  const handleResults = async (
    results: Array<{ vc: unknown; vcStatus: 'SUCCESS' | 'INVALID' | 'EXPIRED' }>
  ) => {
    setError(null)
    setIsVerifying(true)
    toast.loading('Verifying credential...', { id: 'verification' })

    try {
      const toAppResults: VResult[] = results.map((r) => {
      const vc: any = r.vc ?? {}
      const status = mapStatus(r.vcStatus)
      return {
        id: crypto.randomUUID(),
        vcId: vc?.id ?? crypto.randomUUID(),
        status,
        timestamp: new Date(),
        checks: {
          signatureValid: r.vcStatus === 'SUCCESS',
          schemaValid: r.vcStatus !== 'INVALID',   // or just true if you prefer
          notExpired: r.vcStatus !== 'EXPIRED',
          notRevoked: true,                        // keep as placeholder or remove from UI
          trustedIssuer: undefined as any,         // set undefined or remove this field
        },
        errors: r.vcStatus === 'SUCCESS' ? [] : ['Verification failed'],
        metadata: {
          issuer: typeof vc?.issuer === 'string' ? vc.issuer : vc?.issuer?.id ?? '',
          type: Array.isArray(vc?.type) ? vc.type.join(',') : (vc?.type ?? ''),
          issuanceDate: vc?.validFrom ?? vc?.issuanceDate ?? '',
          expirationDate: vc?.validUntil ?? vc?.expirationDate ?? '',
          subjectId: vc?.credentialSubject?.id ?? '',
        },
        synced: false,
      }
    })


      setCurrentResult(toAppResults[0])
      setLastVc(results[0]?.vc ?? null);

      // 👇 Persist both VC and result
      for (let i = 0; i < results.length; i++) {
        const vc = results[i].vc
        const result = toAppResults[i]
        await backgroundSyncService.queueJson('/api/sync/verifications', { vc, result })
      }

      const s = toAppResults[0].status
      if (s === 'valid') toast.success('Credential verified!', { id: 'verification' })
      else if (s === 'expired') toast.error('Credential expired', { id: 'verification' })
      else toast.error('Credential is invalid', { id: 'verification' })
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : 'Verification failed')
      toast.error('Verification failed', { id: 'verification' })
    } finally {
      setIsVerifying(false)
    }
  }

  const startNewScan = () => {
    setError(null)
    setCurrentResult(null)
    setScannerKey((k) => k + 1)
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <h2 className="text-lg font-semibold mb-2">Initializing Verifier</h2>
            <p className="text-sm text-gray-600">Setting up camera & sync…</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Scan QR Code</h1>
          <p className="text-gray-600">Scan and verify Verifiable Credentials</p>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {!currentResult && !isVerifying && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <QrCode className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                <h2 className="text-xl font-semibold mb-2">Ready to Scan</h2>
                <p className="text-gray-600">Use camera or upload an image/PDF with a QR.</p>
              </div>

              <div key={scannerKey} className="flex flex-col items-center gap-4">
                <QRCodeVerification
                  verifyServiceUrl={VERIFY_SERVICE_URL}
                  onVCProcessed={handleResults}
                  onError={(e) => {
                    console.error('[Inji QR Verify] error:', e)
                    setError(e.message)
                    toast.error(e.message)
                  }}
                  triggerElement={<Button size="lg" className="w-full">Start QR Scanner</Button>}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {isVerifying && (
          <Card>
            <CardContent className="p-6 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
              <h2 className="text-lg font-semibold mb-2">Verifying Credential</h2>
              <p className="text-gray-600">Checking signature, expiry, and issuer trust…</p>
            </CardContent>
          </Card>
        )}

        {currentResult && (
          <div className="space-y-4">
            <VerificationResult
              result={currentResult}
              onExport={() => {
                try {
                  const exportData = {
                    result: currentResult,
                    exportedAt: new Date().toISOString(),
                    version: '1.0',
                  }
                  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `vc-verification-${currentResult.id}.json`
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  URL.revokeObjectURL(url)
                  toast.success('Verification result exported')
                } catch {
                  toast.error('Failed to export result')
                }
              }}
            />
            <div className="text-center">
              <Button onClick={startNewScan} variant="outline" size="lg">
                Scan Another Credential
              </Button>
            </div>
          </div>
        )}
      </div>

      <Toaster position="top-center" />
    </div>
  )
}
