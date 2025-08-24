import useSWR from 'swr';
import { backgroundSyncService } from '@/lib/background-sync';

const fetcher = (u: string) => fetch(u).then(r => r.json());

export function useVerifications() {
  const { data, isLoading, error, mutate } = useSWR('/api/sync/verifications', fetcher, {
    refreshInterval: 10_000, // optional
  });

  return {
    results: (data?.data ?? []) as any[],
    isLoading,
    error,
    refresh: mutate,
    async syncNow() {
      await backgroundSyncService.flush();
      await mutate();
    },
  };
}
