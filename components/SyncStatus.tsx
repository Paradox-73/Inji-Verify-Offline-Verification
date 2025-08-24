// components/ui/syncstatus.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { backgroundSyncService } from '@/lib/background-sync';

type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export default function SyncStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [pendingItems, setPendingItems] = useState(0);

  useEffect(() => {
    const updateOnline = () => setIsOnline(navigator.onLine);
    updateOnline();
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);

    // subscribe to bg-sync status
    const unsub = backgroundSyncService.onStatus(async (s) => {
      setStatus(s);
      setPendingItems(await backgroundSyncService.getQueueSize());
      if (s === 'success') setLastSync(new Date());
    });

    // initial pending count
    backgroundSyncService.getQueueSize().then(setPendingItems);

    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
      unsub();
    };
  }, []);

  const handleManualSync = async () => {
    if (!navigator.onLine) return;
    setStatus('syncing');
    await backgroundSyncService.flush();
    setPendingItems(await backgroundSyncService.getQueueSize());
    setLastSync(new Date());
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <Wifi className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-700">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-orange-700">Offline</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {pendingItems > 0 ? (
                <>
                  <Clock className="w-4 h-4 text-orange-600" />
                  <Badge variant="outline" className="text-orange-700 border-orange-200">
                    {pendingItems} pending
                  </Badge>
                </>
              ) : status === 'syncing' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  <Badge variant="outline" className="text-blue-700 border-blue-200">
                    Syncing…
                  </Badge>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <Badge variant="outline" className="text-green-700 border-green-200">
                    Synced
                  </Badge>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastSync && (
              <span className="text-xs text-gray-600">
                Last sync: {lastSync.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualSync}
              disabled={!isOnline || status === 'syncing'}
            >
              {status === 'syncing' ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {status === 'syncing' ? 'Syncing…' : 'Sync'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
