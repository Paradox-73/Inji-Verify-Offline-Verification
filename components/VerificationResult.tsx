'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Download,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import type { VerificationResult } from '@/lib/types'
import { format, isValid } from 'date-fns'

interface VerificationResultProps {
  result: VerificationResult
  /** Optional: full VC JSON to display richer details */
  vc?: any
  onViewDetails?: () => void
  onExport?: () => void
}

export default function VerificationResult({
  result,
  vc,
  onViewDetails,
  onExport
}: VerificationResultProps) {
  const [showRaw, setShowRaw] = useState(false)

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

  // ---- Safe value helpers (prefer metadata, fall back to VC) ----
  const issuer =
    result.metadata?.issuer ??
    (typeof vc?.issuer === 'string' ? vc?.issuer : vc?.issuer?.id) ??
    '-'

  const typesText = (() => {
    if (result.metadata?.type) return result.metadata.type
    if (Array.isArray(vc?.type)) return vc.type.join(', ')
    if (typeof vc?.type === 'string') return vc.type
    return '-'
  })()

  const subjectId =
    result.metadata?.subjectId ??
    vc?.credentialSubject?.id ??
    '-'

  const issuedStr =
    result.metadata?.issuanceDate ??
    vc?.validFrom ??
    vc?.issuanceDate ??
    ''

  const expStr =
    result.metadata?.expirationDate ??
    vc?.validUntil ??
    vc?.expirationDate ??
    ''

  const formatMaybeDate = (value: string | Date | undefined | null) => {
    if (!value) return '-'
    const d = typeof value === 'string' ? new Date(value) : value
    return isValid(d) ? format(d, 'MMM dd, yyyy') : '-'
  }

  const proof = vc?.proof
  const hasProof =
    proof && (proof.type || proof.verificationMethod || proof.created || proof.proofPurpose)

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <CardTitle className="text-lg">{getStatusText()}</CardTitle>
              <p className="text-sm text-gray-600">
                {formatMaybeDate(result.timestamp)} at{' '}
                {isValid(new Date(result.timestamp))
                  ? format(new Date(result.timestamp), 'HH:mm')
                  : '--:--'}
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
            <p className="text-sm text-gray-700 truncate" title={issuer}>
              {issuer || '-'}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">Type</span>
            </div>
            <p className="text-sm text-gray-700">
              {typesText}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">Issued</span>
            </div>
            <p className="text-sm text-gray-700">
              {formatMaybeDate(issuedStr)}
            </p>
          </div>

          {expStr ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium">Expires</span>
              </div>
              <p className="text-sm text-gray-700">
                {formatMaybeDate(expStr)}
              </p>
            </div>
          ) : null}

          {subjectId && subjectId !== '-' && (
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium">Subject ID</span>
              </div>
              <p className="text-sm text-gray-700 break-all">
                {subjectId}
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
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Proof (from VC) */}
        {hasProof && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-2">Proof</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
              <div><span className="font-medium">Type:</span> {proof?.type ?? '-'}</div>
              <div><span className="font-medium">Purpose:</span> {proof?.proofPurpose ?? '-'}</div>
              <div className="md:col-span-2">
                <span className="font-medium">Verification Method:</span>{' '}
                {proof?.verificationMethod ?? '-'}
              </div>
              <div className="md:col-span-2">
                <span className="font-medium">Created:</span>{' '}
                {formatMaybeDate(proof?.created)}
              </div>
            </div>
          </div>
        )}

        {/* Errors */}
        {result.errors && result.errors.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-2 text-red-600">Errors</h4>
            <div className="space-y-1">
              {result.errors.map((err, i) => (
                <div key={i} className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-700">{err}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raw VC JSON (collapsible) */}
        {vc && (
          <div className="border-t pt-4">
            <button
              type="button"
              onClick={() => setShowRaw(s => !s)}
              className="flex items-center text-sm font-semibold mb-2 hover:opacity-80"
            >
              {showRaw ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
              Raw VC JSON
            </button>
            {showRaw && (
              <pre className="text-xs bg-gray-50 border rounded p-3 overflow-auto max-h-80">
                {JSON.stringify(vc, null, 2)}
              </pre>
            )}
          </div>
        )}

        {/* Sync + actions */}
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
