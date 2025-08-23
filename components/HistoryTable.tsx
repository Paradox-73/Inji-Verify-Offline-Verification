'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import StatusBadge from '@/components/StatusBadge'
import { Download, Eye } from 'lucide-react'
import { VerificationResult } from '@/lib/types'
import { format } from 'date-fns'

interface HistoryTableProps {
  results: VerificationResult[]
  onExport: (result: VerificationResult) => void
  onViewDetails?: (result: VerificationResult) => void
}

export default function HistoryTable({ results, onExport, onViewDetails }: HistoryTableProps) {
  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">No verification results found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verification History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {results.map((result) => (
            <div key={result.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <StatusBadge status={result.status} />
                    <span className="text-sm text-gray-600">
                      {format(result.timestamp, 'MMM dd, yyyy at HH:mm')}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <p><strong>Issuer:</strong> {result.metadata.issuer}</p>
                    <p><strong>Type:</strong> {result.metadata.type}</p>
                    <p><strong>Issued:</strong> {format(new Date(result.metadata.issuanceDate), 'MMM dd, yyyy')}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-2">
                    <div className={`w-2 h-2 rounded-full ${result.synced ? 'bg-green-500' : 'bg-orange-500'}`} />
                    <span className="text-xs text-gray-600">
                      {result.synced ? 'Synced' : 'Pending sync'}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  {onViewDetails && (
                    <Button variant="outline" size="sm" onClick={() => onViewDetails(result)}>
                      <Eye className="w-4 h-4 mr-1" />
                      Details
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => onExport(result)}>
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}