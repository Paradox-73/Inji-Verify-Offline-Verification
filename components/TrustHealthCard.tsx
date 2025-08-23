'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface TrustHealthCardProps {
  totalIssuers: number
  trustedIssuers: number
  untrustedIssuers: number
}

export default function TrustHealthCard({ 
  totalIssuers, 
  trustedIssuers, 
  untrustedIssuers 
}: TrustHealthCardProps) {
  const getHealthStatus = () => {
    if (totalIssuers === 0) return 'warning'
    if (trustedIssuers === 0) return 'error'
    if (trustedIssuers > 0) return 'healthy'
    return 'warning'
  }

  const getHealthIcon = () => {
    const status = getHealthStatus()
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Shield className="w-5 h-5 text-gray-500" />
    }
  }

  const getHealthMessage = () => {
    const status = getHealthStatus()
    switch (status) {
      case 'healthy':
        return 'Trust cache is healthy and ready for offline verification'
      case 'warning':
        return totalIssuers === 0 
          ? 'No trusted issuers configured. Add issuers to enable verification.'
          : 'Some issuers are untrusted. Review your trust settings.'
      case 'error':
        return 'No trusted issuers available. Verification will fail.'
      default:
        return 'Trust cache status unknown'
    }
  }

  const getHealthBadge = () => {
    const status = getHealthStatus()
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Healthy</Badge>
      case 'warning':
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Warning</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Error</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            {getHealthIcon()}
            <span className="ml-2">Trust Cache Health</span>
          </div>
          {getHealthBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{totalIssuers}</div>
            <div className="text-sm text-gray-600">Total Issuers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{trustedIssuers}</div>
            <div className="text-sm text-gray-600">Trusted</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{untrustedIssuers}</div>
            <div className="text-sm text-gray-600">Untrusted</div>
          </div>
        </div>
        
        <div className="text-sm text-gray-600 text-center">
          {getHealthMessage()}
        </div>
      </CardContent>
    </Card>
  )
}