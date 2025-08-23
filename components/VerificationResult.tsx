'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import StatusBadge from '@/components/StatusBadge'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  User, 
  Building, 
  Calendar,
  Shield,
  Eye,
  Download
} from 'lucide-react'
import type  { VerificationResult }  from '@/lib/types'
import { format } from 'date-fns'

interface VerificationResultProps {
  result: VerificationResult
  onViewDetails?: () => void
  onExport?: () => void
}

export default function VerificationResult({ 
  result, 
  onViewDetails, 
  onExport 
}: VerificationResultProps) {
  const getStatusIcon = () => {
    switch (result.status) {
      case 'valid':
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case 'invalid':
        return <XCircle className="w-6 h-6 text-red-500" />
      case 'expired':
        return <Clock className="w-6 h-6 text-orange-500" />
      case 'error':
        return <AlertTriangle className="w-6 h-6 text-red-500" />
      default:
        return <AlertTriangle className="w-6 h-6 text-gray-400" />
    }
  }

  const getStatusText = () => {
    switch (result.status) {
      case 'valid':
        return 'Valid Credential'
      case 'invalid':
        return 'Invalid Credential'
      case 'expired':
        return 'Expired Credential'
      case 'error':
        return 'Verification Error'
      default:
        return 'Unknown Status'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-lg">{getStatusText()}</CardTitle>
              <p className="text-sm text-gray-600">
                {format(result.timestamp, 'MMM dd, yyyy at HH:mm')}
              </p>
            </div>
          </div>
          <StatusBadge status={result.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Credential Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Building className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">Issuer</span>
            </div>
            <p className="text-sm text-gray-700 truncate" title={result.metadata.issuer}>
              {result.metadata.issuer}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">Type</span>
            </div>
            <p className="text-sm text-gray-700">
              {result.metadata.type}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">Issued</span>
            </div>
            <p className="text-sm text-gray-700">
              {format(new Date(result.metadata.issuanceDate), 'MMM dd, yyyy')}
            </p>
          </div>

          {result.metadata.expirationDate && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium">Expires</span>
              </div>
              <p className="text-sm text-gray-700">
                {format(new Date(result.metadata.expirationDate), 'MMM dd, yyyy')}
              </p>
            </div>
          )}

          {result.metadata.subjectId && (
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium">Subject ID</span>
              </div>
              <p className="text-sm text-gray-700 break-all">
                {result.metadata.subjectId}
              </p>
            </div>
          )}
        </div>

        {/* Verification Checks */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold mb-3">Verification Checks</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(result.checks).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                {value ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Errors */}
        {result.errors && result.errors.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-2 text-red-600">Errors</h4>
            <div className="space-y-1">
              {result.errors.map((error, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sync Status */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${result.synced ? 'bg-green-500' : 'bg-orange-500'}`} />
              <span className="text-sm text-gray-600">
                {result.synced ? 'Synced to server' : 'Pending sync'}
              </span>
            </div>
            
            <div className="flex space-x-2">
              {onViewDetails && (
                <Button variant="outline" size="sm" onClick={onViewDetails}>
                  <Eye className="w-4 h-4 mr-1" />
                  Details
                </Button>
              )}
              {onExport && (
                <Button variant="outline" size="sm" onClick={onExport}>
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}