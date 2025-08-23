'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  RefreshCw,
  Calendar
} from 'lucide-react'
import { NavigationMenu } from '@/components/ui/navigation-menu'
import VerificationResultComponent from '@/components/VerificationResult'
import { vcVerifier } from '@/lib/verify'
import { VerificationResult } from '@/lib/types'
import { format } from 'date-fns'
import toast, { Toaster } from 'react-hot-toast'

export default function History() {
  const [results, setResults] = useState<VerificationResult[]>([])
  const [filteredResults, setFilteredResults] = useState<VerificationResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadResults()
  }, [])

  useEffect(() => {
    filterResults()
  }, [searchQuery, statusFilter, results])

  const loadResults = async (): Promise<void> => {
    try {
      setIsLoading(true)
      const storedResults = await vcVerifier.getStoredResults()
      setResults(storedResults)
      toast.success(`Loaded ${storedResults.length} verification results`)
    } catch (error) {
      console.error('Failed to load results:', error)
      toast.error('Failed to load verification history')
    } finally {
      setIsLoading(false)
    }
  }

  const filterResults = (): void => {
    let filtered = results

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(result => 
        result.metadata.issuer.toLowerCase().includes(query) ||
        result.metadata.type.toLowerCase().includes(query) ||
        result.vcId.toLowerCase().includes(query) ||
        (result.metadata.subjectId && result.metadata.subjectId.toLowerCase().includes(query))
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(result => result.status === statusFilter)
    }

    setFilteredResults(filtered)
  }

  const handleExportAll = (): void => {
    try {
      const exportData = {
        results: filteredResults,
        exportedAt: new Date().toISOString(),
        totalResults: filteredResults.length,
        version: '1.0'
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vc-verification-history-${format(new Date(), 'yyyy-MM-dd')}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success(`Exported ${filteredResults.length} verification results`)
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export verification history')
    }
  }

  const handleExportSingle = (result: VerificationResult): void => {
    try {
      const exportData = {
        result,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vc-verification-${result.id}.json`
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

  const getStatusCounts = () => {
    const counts = {
      all: results.length,
      valid: 0,
      invalid: 0,
      expired: 0,
      error: 0
    }

    results.forEach(result => {
      if (result.status in counts) {
        counts[result.status as keyof typeof counts]++
      }
    })

    return counts
  }

  const statusCounts = getStatusCounts()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <h2 className="text-lg font-semibold mb-2">Loading History</h2>
            <p className="text-sm text-gray-600">
              Retrieving verification results...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 pb-24 md:pb-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Verification History
          </h1>
          <p className="text-gray-600">
            View and manage your credential verification results
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{statusCounts.all}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{statusCounts.valid}</div>
              <div className="text-sm text-gray-600">Valid</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{statusCounts.invalid}</div>
              <div className="text-sm text-gray-600">Invalid</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{statusCounts.expired}</div>
              <div className="text-sm text-gray-600">Expired</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{statusCounts.error}</div>
              <div className="text-sm text-gray-600">Errors</div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by issuer, type, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <div className="flex gap-2">
                {['all', 'valid', 'invalid', 'expired', 'error'].map(status => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>

              {/* Export Button */}
              <Button onClick={handleExportAll} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {filteredResults.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
              <p className="text-gray-600 mb-4">
                {results.length === 0 
                  ? "You haven't verified any credentials yet."
                  : "No results match your current search and filters."
                }
              </p>
              {results.length === 0 && (
                <Button onClick={() => window.location.href = '/'}>
                  Start Verifying Credentials
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {filteredResults.length} of {results.length} results
              </p>
            </div>
            
            {filteredResults.map((result) => (
              <VerificationResultComponent
                key={result.id}
                result={result}
                onExport={() => handleExportSingle(result)}
              />
            ))}
          </div>
        )}
      </div>

      <NavigationMenu />
      <Toaster position="top-center" />
    </div>
  )
}