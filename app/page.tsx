'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  QrCode, 
  History, 
  Shield, 
  Settings, 
  Wifi, 
  WifiOff,
  CheckCircle,
  Clock,
  Database
} from 'lucide-react'
import SyncStatus from '@/components/SyncStatus'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Inji VC Verifier
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Offline Verifiable Credential Verification
          </p>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Offline Ready
          </Badge>
        </div>

        {/* Sync Status */}
        <div className="mb-8">
          <SyncStatus />
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link href="/scan">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-200">
              <CardHeader className="text-center">
                <div className="mx-auto bg-blue-100 p-4 rounded-full w-fit mb-4">
                  <QrCode className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Scan QR Code</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-4">
                  Scan and verify Verifiable Credentials using your camera
                </p>
                <Button className="w-full" size="lg">
                  Start Scanning
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/history">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-green-200">
              <CardHeader className="text-center">
                <div className="mx-auto bg-green-100 p-4 rounded-full w-fit mb-4">
                  <History className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">View History</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-600 mb-4">
                  Browse your verification history and export results
                </p>
                <Button variant="outline" className="w-full" size="lg">
                  View History
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link href="/trust">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Shield className="w-5 h-5 mr-2 text-orange-600" />
                  Trust Cache
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Manage trusted credential issuers for offline verification
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/settings">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Settings className="w-5 h-5 mr-2 text-gray-600" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Configure sync endpoints, Wi-Fi preferences, and security
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Key Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="bg-blue-50 p-3 rounded-full w-fit mx-auto mb-3">
                  <WifiOff className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Offline First</h3>
                <p className="text-sm text-gray-600">
                  Verify credentials without internet connection
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-green-50 p-3 rounded-full w-fit mx-auto mb-3">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Secure Storage</h3>
                <p className="text-sm text-gray-600">
                  Encrypted local storage with tamper detection
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-purple-50 p-3 rounded-full w-fit mx-auto mb-3">
                  <Database className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Auto Sync</h3>
                <p className="text-sm text-gray-600">
                  Automatic background sync when online
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}