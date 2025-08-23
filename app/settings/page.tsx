'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Save, 
  RefreshCw, 
  Shield, 
  Wifi, 
  Server, 
  Database,
  AlertTriangle,
  CheckCircle,
  Trash2
} from 'lucide-react'
import {NavigationMenu} from '@/components/ui/navigation-menu'
import { SettingsSchema } from '@/lib/types'
import type { Settings } from '@/lib/types'
import { backgroundSyncService } from '@/lib/background-sync'
import { db } from '@/lib/db'
import toast, { Toaster } from 'react-hot-toast'

const DEFAULT_SETTINGS: Settings = {
  syncEndpoint: 'https://api.example.com/vc-sync',
  wifiOnlySync: true,
  autoSync: true,
  encryptionEnabled: true,
  maxStorageEntries: 1000,
  cacheTTL: 604800, // 7 days
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'error' | null>(null)
  const [storageStats, setStorageStats] = useState({
    verificationResults: 0,
    trustedIssuers: 0,
    syncQueue: 0,
    storageUsed: 0
  })

  useEffect(() => {
    loadSettings()
    loadStorageStats()
  }, [])

  const loadSettings = async (): Promise<void> => {
    try {
      setIsLoading(true)
      const stored = localStorage.getItem('inji-vc-settings')
      if (stored) {
        const parsed = JSON.parse(stored)
        const validated = SettingsSchema.parse(parsed)
        setSettings(validated)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const loadStorageStats = async (): Promise<void> => {
    try {
      const [results, issuers, queue] = await Promise.all([
        db.verificationResults.count(),
        db.trustedIssuers.count(),
        db.syncQueue.count()
      ])

      // Estimate storage usage (rough calculation)
      const estimatedUsage = (results * 2) + (issuers * 1) + (queue * 1) // KB

      setStorageStats({
        verificationResults: results,
        trustedIssuers: issuers,
        syncQueue: queue,
        storageUsed: estimatedUsage
      })
    } catch (error) {
      console.error('Failed to load storage stats:', error)
    }
  }

  const saveSettings = async (): Promise<void> => {
    try {
      setIsSaving(true)

      // Validate settings
      const validated = SettingsSchema.parse(settings)

      // Save to localStorage
      localStorage.setItem('inji-vc-settings', JSON.stringify(validated))

      // Queue settings sync
      await backgroundSyncService.queueForSync('settings-sync', validated)

      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const testConnection = async (): Promise<void> => {
    if (!settings.syncEndpoint) {
      toast.error('Please enter a sync endpoint URL')
      return
    }

    try {
      setConnectionStatus('testing')
      
      const response = await fetch(settings.syncEndpoint + '/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      if (response.ok) {
        setConnectionStatus('success')
        toast.success('Connection test successful')
      } else {
        setConnectionStatus('error')
        toast.error('Connection test failed')
      }
    } catch (error) {
      console.error('Connection test failed:', error)
      setConnectionStatus('error')
      toast.error('Connection test failed')
    }
  }

  const clearAllData = async (): Promise<void> => {
    const confirmed = window.confirm(
      'Are you sure you want to clear all data? This cannot be undone.'
    )

    if (!confirmed) return

    try {
      await Promise.all([
        db.verificationResults.clear(),
        db.trustedIssuers.clear(),
        db.revocationCache.clear(),
        db.syncQueue.clear()
      ])

      await loadStorageStats()
      toast.success('All data cleared successfully')
    } catch (error) {
      console.error('Failed to clear data:', error)
      toast.error('Failed to clear data')
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <h2 className="text-lg font-semibold mb-2">Loading Settings</h2>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-4 pb-24 md:pb-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Settings
          </h1>
          <p className="text-gray-600">
            Configure your VC Verifier preferences and sync options
          </p>
        </div>

        <div className="space-y-6">
          {/* Sync Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="w-5 h-5 mr-2" />
                Sync Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="syncEndpoint">Sync Endpoint URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="syncEndpoint"
                    type="url"
                    placeholder="https://api.example.com/vc-sync"
                    value={settings.syncEndpoint || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      syncEndpoint: e.target.value
                    }))}
                  />
                  <Button 
                    variant="outline" 
                    onClick={testConnection}
                    disabled={connectionStatus === 'testing' || !settings.syncEndpoint}
                  >
                    {connectionStatus === 'testing' ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      'Test'
                    )}
                  </Button>
                </div>
                
                {connectionStatus === 'success' && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-700">
                      Connection test successful
                    </AlertDescription>
                  </Alert>
                )}
                
                {connectionStatus === 'error' && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <AlertDescription className="text-red-700">
                      Connection test failed. Check your endpoint URL and network connection.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Auto Sync</Label>
                  <p className="text-sm text-gray-600">
                    Automatically sync results when online
                  </p>
                </div>
                <Switch
                  checked={settings.autoSync}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    autoSync: checked
                  }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Wi-Fi Only Sync</Label>
                  <p className="text-sm text-gray-600">
                    Only sync when connected to Wi-Fi
                  </p>
                </div>
                <Switch
                  checked={settings.wifiOnlySync}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    wifiOnlySync: checked
                  }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Enable Encryption</Label>
                  <p className="text-sm text-gray-600">
                    Encrypt verification results in local storage
                  </p>
                </div>
                <Switch
                  checked={settings.encryptionEnabled}
                  onCheckedChange={(checked) => setSettings(prev => ({
                    ...prev,
                    encryptionEnabled: checked
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cacheTTL">Cache TTL (seconds)</Label>
                <Input
                  id="cacheTTL"
                  type="number"
                  min="3600"
                  max="2592000"
                  value={settings.cacheTTL}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    cacheTTL: parseInt(e.target.value) || DEFAULT_SETTINGS.cacheTTL
                  }))}
                />
                <p className="text-sm text-gray-600">
                  How long to cache revocation status (1 hour to 30 days)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Storage Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Storage Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maxStorage">Max Storage Entries</Label>
                <Input
                  id="maxStorage"
                  type="number"
                  min="10"
                  max="10000"
                  value={settings.maxStorageEntries}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    maxStorageEntries: parseInt(e.target.value) || DEFAULT_SETTINGS.maxStorageEntries
                  }))}
                />
                <p className="text-sm text-gray-600">
                  Maximum number of verification results to store locally
                </p>
              </div>

              {/* Storage Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm font-medium">Verification Results</div>
                  <div className="text-lg font-bold text-blue-600">
                    {storageStats.verificationResults}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm font-medium">Trusted Issuers</div>
                  <div className="text-lg font-bold text-green-600">
                    {storageStats.trustedIssuers}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm font-medium">Sync Queue</div>
                  <div className="text-lg font-bold text-orange-600">
                    {storageStats.syncQueue}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm font-medium">Storage Used</div>
                  <div className="text-lg font-bold text-purple-600">
                    {formatBytes(storageStats.storageUsed * 1024)}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={clearAllData}
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Data
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            onClick={saveSettings}
            disabled={isSaving}
            className="w-full"
            size="lg"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>

      <NavigationMenu />
      <Toaster position="top-center" />
    </div>
  )
}