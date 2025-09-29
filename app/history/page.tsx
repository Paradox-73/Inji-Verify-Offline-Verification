'use client';
import React from 'react';
import { useVerifications } from '@/hooks/useVerifications';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import VerificationResult from '@/components/VerificationResult';
import { RefreshCw } from 'lucide-react';
import { downloadJson } from '@/lib/download';

export default function HistoryPage() {
  const { results, vcByResultId, isLoading, syncNow } = useVerifications();

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Verification History</h1>
        <Button variant="outline" onClick={syncNow}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Sync & Refresh
        </Button>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6">Loading…</CardContent></Card>
      ) : results.length === 0 ? (
        <Card><CardContent className="p-6 text-gray-600">No results yet.</CardContent></Card>
      ) : (
        results.map((r) => (
          <VerificationResult key={r.id} result={r} vc={vcByResultId[r.id]} onExport={() => {
              const exportData = {
                result: {
                  ...r,
                  // make sure any Date-like values are strings
                  timestamp: typeof r.timestamp === 'string'
                    ? r.timestamp
                    : new Date(r.timestamp as any).toISOString(),
                },
                vc: vcByResultId[r.id] ?? null,
                exportedAt: new Date().toISOString(),
                version: '1.0',
              };
              downloadJson(`vc-verification-${r.id}.json`, exportData);
            }} />
        ))
      )}
    </div>
  );
}
