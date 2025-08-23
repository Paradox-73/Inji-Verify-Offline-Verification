'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Building
} from 'lucide-react'
import TrustHealthCard from '@/components/TrustHealthCard'
import { db } from '@/lib/db'
import { TrustedIssuer } from '@/lib/types'
import toast, { Toaster } from 'react-hot-toast'

export default function TrustPage() {
  const [trustedIssuers, setTrustedIssuers] = useState<TrustedIssuer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newIssuer, setNewIssuer] = useState({
    name: '',
    did: '',
    publicKey: '',
    revocationEndpoint: ''
  })

  useEffect(() => {
    loadTrustedIssuers()
  }, [])

  const loadTrustedIssuers = async (): Promise<void> => {
    try {
      setIsLoading(true)
      const issuers = await db.trustedIssuers.orderBy('addedDate').reverse().toArray()
      setTrustedIssuers(issuers)
    } catch (error) {
      console.error('Failed to load trusted issuers:', error)
      toast.error('Failed to load trusted issuers')
    } finally {
      setIsLoading(false)
    }
  }

  const addTrustedIssuer = async (): Promise<void> => {
    if (!newIssuer.name || !newIssuer.did || !newIssuer.publicKey) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const issuer: TrustedIssuer = {
        id: newIssuer.did,
        name: newIssuer.name,
        publicKey: newIssuer.publicKey,
        revocationEndpoint: newIssuer.revocationEndpoint || undefined,
        addedDate: new Date(),
        trusted: true
      }

      await db.trustedIssuers.add(issuer)
      await loadTrustedIssuers()
      
      setNewIssuer({
        name: '',
        did: '',
        publicKey: '',
        revocationEndpoint: ''
      })

      toast.success('Trusted issuer added successfully')
    } catch (error) {
      console.error('Failed to add trusted issuer:', error)
      toast.error('Failed to add trusted issuer')
    }
  }

  const toggleIssuerTrust = async (issuerId: string, trusted: boolean): Promise<void> => {
    try {
      await db.trustedIssuers.update(issuerId, { trusted })
      await loadTrustedIssuers()
      toast.success(`Issuer ${trusted ? 'trusted' : 'untrusted'}`)
    } catch (error) {
      console.error('Failed to update issuer trust:', error)
      toast.error('Failed to update issuer trust')
    }
  }

  const removeIssuer = async (issuerId: string): Promise<void> => {
    const confirmed = window.confirm('Are you sure you want to remove this trusted issuer?')
    if (!confirmed) return

    try {
      await db.trustedIssuers.delete(issuerId)
      await loadTrustedIssuers()
      toast.success('Trusted issuer removed')
    } catch (error) {
      console.error('Failed to remove issuer:', error)
      toast.error('Failed to remove issuer')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <h2 className="text-lg font-semibold mb-2">Loading Trust Cache</h2>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Trust Cache Manager
          </h1>
          <p className="text-gray-600">
            Manage trusted credential issuers for offline verification
          </p>
        </div>

        {/* Trust Health Overview */}
        <TrustHealthCard 
          totalIssuers={trustedIssuers.length}
          trustedIssuers={trustedIssuers.filter(i => i.trusted).length}
          untrustedIssuers={trustedIssuers.filter(i => !i.trusted).length}
        />

        {/* Add New Issuer */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Add Trusted Issuer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issuerName">Issuer Name *</Label>
                <Input
                  id="issuerName"
                  placeholder="e.g., Government ID Authority"
                  value={newIssuer.name}
                  onChange={(e) => setNewIssuer(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issuerDid">DID *</Label>
                <Input
                  id="issuerDid"
                  placeholder="did:example:123456789abcdefghi"
                  value={newIssuer.did}
                  onChange={(e) => setNewIssuer(prev => ({ ...prev, did: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="publicKey">Public Key *</Label>
              <Input
                id="publicKey"
                placeholder="Base64 encoded public key"
                value={newIssuer.publicKey}
                onChange={(e) => setNewIssuer(prev => ({ ...prev, publicKey: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="revocationEndpoint">Revocation Endpoint (Optional)</Label>
              <Input
                id="revocationEndpoint"
                type="url"
                placeholder="https://issuer.example.com/revocation"
                value={newIssuer.revocationEndpoint}
                onChange={(e) => setNewIssuer(prev => ({ ...prev, revocationEndpoint: e.target.value }))}
              />
            </div>
            
            <Button onClick={addTrustedIssuer} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Trusted Issuer
            </Button>
          </CardContent>
        </Card>

        {/* Trusted Issuers List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Trusted Issuers ({trustedIssuers.length})
              </div>
              <Button variant="outline" size="sm" onClick={loadTrustedIssuers}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trustedIssuers.length === 0 ? (
              <div className="text-center py-8">
                <Building className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">No Trusted Issuers</h3>
                <p className="text-gray-600">
                  Add trusted credential issuers to enable offline verification
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {trustedIssuers.map((issuer) => (
                  <div key={issuer.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold">{issuer.name}</h3>
                          <Badge 
                            variant={issuer.trusted ? "default" : "secondary"}
                            className={issuer.trusted ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                          >
                            {issuer.trusted ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Trusted
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 mr-1" />
                                Untrusted
                              </>
                            )}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><strong>DID:</strong> {issuer.id}</p>
                          <p><strong>Added:</strong> {issuer.addedDate.toLocaleDateString()}</p>
                          {issuer.revocationEndpoint && (
                            <p><strong>Revocation:</strong> {issuer.revocationEndpoint}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleIssuerTrust(issuer.id, !issuer.trusted)}
                        >
                          {issuer.trusted ? (
                            <>
                              <XCircle className="w-4 h-4 mr-1" />
                              Untrust
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Trust
                            </>
                          )}
                        </Button>
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeIssuer(issuer.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Toaster position="top-center" />
    </div>
  )
}