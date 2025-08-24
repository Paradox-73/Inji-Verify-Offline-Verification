'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Camera, CameraOff, RefreshCw } from 'lucide-react'
import { qrScannerService } from '@/lib/qr-scanner'
import type { VerifiableCredential } from '@/lib/types'

interface QRScannerProps {
  // ✅ accept VC OR raw text now
  onCredentialScanned: (payload: VerifiableCredential | string) => void
  onError: (error: string) => void
  isActive: boolean
}

export default function QRScanner({ onCredentialScanned, onError, isActive }: QRScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)

  useEffect(() => {
    checkCameraPermission()
    return () => { if (isScanning) stopScanning() }
  }, [])

  useEffect(() => {
    if (isActive && !isScanning && hasPermission) startScanning()
    else if (!isActive && isScanning) stopScanning()
  }, [isActive, hasPermission])

  const checkCameraPermission = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop())
      setHasPermission(true)
    } catch (error) {
      console.error('Camera permission denied:', error)
      setHasPermission(false)
      onError('Camera permission is required for QR scanning')
    }
  }

  const startScanning = async (): Promise<void> => {
    if (!scannerRef.current || isScanning || !hasPermission) return
    try {
      setIsScanning(true)
      await qrScannerService.startScanning(
        'qr-scanner-container',
        onCredentialScanned,
        onError
      )
    } catch (error) {
      console.error('Failed to start scanning:', error)
      setIsScanning(false)
      onError('Failed to start camera scanner')
    }
  }

  const stopScanning = async (): Promise<void> => {
    if (!isScanning) return
    try {
      await qrScannerService.stopScanning()
      setIsScanning(false)
    } catch (error) {
      console.error('Failed to stop scanning:', error)
    }
  }

  const toggleScanning = (): void => {
    if (isScanning) stopScanning()
    else startScanning()
  }

  if (hasPermission === false) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <CameraOff className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Camera Access Required</h3>
          <p className="text-sm text-gray-600 mb-4">
            Please allow camera access to scan QR codes containing Verifiable Credentials.
          </p>
          <Button onClick={checkCameraPermission} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-4">
        <div className="relative">
          <div
            ref={scannerRef}
            id="qr-scanner-container"
            className="w-full bg-black rounded-lg overflow-hidden"
            style={{ minHeight: '300px' }}
          >
            {!isScanning && (
              <div className="flex items-center justify-center h-64 bg-gray-100">
                <div className="text-center">
                  <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-4">
                    Position QR code within the frame
                  </p>
                </div>
              </div>
            )}
          </div>

          {isScanning && (
            <div className="absolute inset-4 border-2 border-white rounded-lg pointer-events-none">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
            </div>
          )}

          <div className="mt-4 text-center">
            <Button
              onClick={toggleScanning}
              variant={isScanning ? "destructive" : "default"}
              className="w-full"
            >
              {isScanning ? (
                <>
                  <CameraOff className="w-4 h-4 mr-2" />
                  Stop Scanner
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Start Scanner
                </>
              )}
            </Button>
          </div>

          <div className="mt-4 text-center text-sm text-gray-600">
            <p>Hold steady and ensure good lighting for best results</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
