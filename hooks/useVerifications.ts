'use client';
import useSWR from 'swr';

const fetcher = (u: string) => fetch(u).then(r => r.json());

type ApiRow = {
  id: string;
  vcId: string | null;
  status: 'valid' | 'invalid' | 'expired' | 'error';
  timestamp: string;
  checks: any;
  errors: any;
  metadata: any;
  synced: boolean;
  vc: {
    id: string;
    vcId: string | null;
    vc: any | null;
    issuer: string | null;
    holderSubjectId: string | null;
    types: string | null;
    validFrom: string | null;
    validUntil: string | null;
  } | null;
};

export function useVerifications() {
  const { data, isLoading, error, mutate } = useSWR('/api/sync/verifications', fetcher, {
    refreshInterval: 10_000,
  });

  const rows: ApiRow[] = data?.data ?? [];

  const results = rows.map(r => ({
    id: r.id,
    vcId: r.vcId ?? r.vc?.vcId ?? r.id,
    status: r.status,
    timestamp: new Date(r.timestamp),
    checks: r.checks ?? {},
    errors: r.errors ?? [],
    metadata: r.metadata ?? {
      issuer: r.vc?.issuer ?? '',
      type: r.vc?.types ?? '',
      issuanceDate: r.vc?.validFrom ?? '',
      expirationDate: r.vc?.validUntil ?? '',
      subjectId: r.vc?.holderSubjectId ?? '',
    },
    synced: r.synced,
  }));

  // quick map to get the raw VC JSON by result id
  const vcByResultId = rows.reduce<Record<string, any>>((acc, r) => {
    acc[r.id] = r.vc?.vc ?? null;
    return acc;
  }, {});

  async function syncNow() {
    // if you keep a client queue, flush here, then revalidate:
    await mutate();
  }

  return { results, vcByResultId, isLoading, error, refresh: mutate, syncNow };
}
