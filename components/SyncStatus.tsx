'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Wifi, WifiOff, RefreshCw, CheckCircle, Clock } from 'lucide-react'
import { backgroundSyncService } from '@/lib/background-sync'

export default function SyncStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [pendingItems, setPendingItems] = useState(0)

  useEffect(() => {
    const updateStatus = () => {
      setIsOnline(backgroundSyncService.getOnlineStatus())
    }

    updateStatus()
    
    window.addEventListener('online', updateStatus)
    window.addEventListener('offline', updateStatus)

    // Check for pending sync items periodically
    const checkPendingItems = async () => {
      // This would query the sync queue in a real implementation
      // For now, we'll simulate it
      setPendingItems(Math.floor(Math.random() * 5))
    }

    const interval = setInterval(checkPendingItems, 5000)

    return () => {
      window.removeEventListener('online', updateStatus)
      window.removeEventListener('offline', updateStatus)
      clearInterval(interval)
    }
  }, [])

  const handleManualSync = async () => {
    if (!isOnline) return

    setIsSyncing(true)
    try {
      await backgroundSyncService.triggerSync()
      setLastSync(new Date())
      setPendingItems(0)
    } catch (error) {
      console.error('Manual sync failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isOnline ? (
              <div className="flex items-center space-x-2">
                <Wifi className="w-5 h-5 text-green-500" />
                <span className="font-medium text-green-700">Online</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <WifiOff className="w-5 h-5 text-orange-500" />
                <span className="font-medium text-orange-700">Offline</span>
              </div>
            )}

            <div className="flex items-center space-x-2">
              {pendingItems > 0 ? (
                <>
                  <Clock className="w-4 h-4 text-orange-500" />
                  <Badge variant="outline" className="text-orange-700 border-orange-200">
                    {pendingItems} pending
                  </Badge>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <Badge variant="outline" className="text-green-700 border-green-200">
                    Synced
                  </Badge>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {lastSync && (
              <span className="text-xs text-gray-600">
                Last sync: {lastSync.toLocaleTimeString()}
              </span>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSync}
              disabled={!isOnline || isSyncing}
            >
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isSyncing ? 'Syncing...' : 'Sync'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}