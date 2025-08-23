'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertTriangle, Loader2, QrCode } from 'lucide-react'
import QRScanner from '@/components/QRScanner'
import VerificationResult from '@/components/VerificationResult'
import { vcVerifier } from '@/lib/verify'
import { encryptionService } from '@/lib/crypto'
import { backgroundSyncService } from '@/lib/background-sync'
import { VerifiableCredential, VerificationResult as VResult } from '@/lib/types'
import toast, { Toaster } from 'react-hot-toast'

export default function ScanPage() {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [currentResult, setCurrentResult] = useState<VResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initializeServices()
  }, [])

  const initializeServices = async (): Promise<void> => {
    try {
      await encryptionService.initialize()
      backgroundSyncService.startPeriodicSync()
      setIsInitialized(true)
      toast.success('VC Verifier initialized successfully')
    } catch (error) {
      console.error('Failed to initialize services:', error)
      setError('Failed to initialize verification services')
      toast.error('Initialization failed')
    }
  }

  const handleCredentialScanned = async (credential: VerifiableCredential): Promise<void> => {
    setIsScanning(false)
    setIsVerifying(true)
    setError(null)
    setCurrentResult(null)

    try {
      toast.loading('Verifying credential...', { id: 'verification' })
      
      const result = await vcVerifier.verifyCredential(credential)
      setCurrentResult(result)

      await backgroundSyncService.queueForSync('verification-result', result)

      if (result.status === 'valid') {
        toast.success('Credential verified successfully!', { id: 'verification' })
      } else if (result.status === 'expired') {
        toast.error('Credential has expired', { id: 'verification' })
      } else if (result.status === 'invalid') {
        toast.error('Credential verification failed', { id: 'verification' })
      } else {
        toast.error('Verification error occurred', { id: 'verification' })
      }
    } catch (error) {
      console.error('Verification failed:', error)
      setError(error instanceof Error ? error.message : 'Verification failed')
      toast.error('Verification failed', { id: 'verification' })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleScanError = (error: string): void => {
    setError(error)
    toast.error(error)
  }

  const startNewScan = (): void => {
    setCurrentResult(null)
    setError(null)
    setIsScanning(true)
  }

  const handleExportResult = (): void => {
    if (!currentResult) return

    try {
      const exportData = {
        result: currentResult,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vc-verification-${currentResult.id}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Verification result exported')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export result')
    }
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <h2 className="text-lg font-semibold mb-2">Initializing VC Verifier</h2>
            <p className="text-sm text-gray-600">
              Setting up secure verification environment...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Scan QR Code
          </h1>
          <p className="text-gray-600">
            Scan and verify Verifiable Credentials offline
          </p>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {!currentResult && !isVerifying && (
            <>
              {!isScanning ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <QrCode className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                    <h2 className="text-xl font-semibold mb-2">
                      Ready to Scan
                    </h2>
                    <p className="text-gray-600 mb-4">
                      Tap the button below to start scanning QR codes containing Verifiable Credentials
                    </p>
                    <Button onClick={startNewScan} size="lg" className="w-full">
                      Start QR Scanner
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <QRScanner
                  onCredentialScanned={handleCredentialScanned}
                  onError={handleScanError}
                  isActive={isScanning}
                />
              )}
            </>
          )}

          {isVerifying && (
            <Card>
              <CardContent className="p-6 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                <h2 className="text-lg font-semibold mb-2">
                  Verifying Credential
                </h2>
                <p className="text-gray-600">
                  Checking signature, schema, and trust status...
                </p>
              </CardContent>
            </Card>
          )}

          {currentResult && (
            <div className="space-y-4">
              <VerificationResult
                result={currentResult}
                onExport={handleExportResult}
              />
              
              <div className="text-center">
                <Button onClick={startNewScan} variant="outline" size="lg">
                  Scan Another Credential
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Toaster position="top-center" />
    </div>
  )
}