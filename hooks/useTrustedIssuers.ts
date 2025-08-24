// hooks/useTrustedIssuers.ts
export async function addTrustedIssuer(input: {
  did: string; name: string; publicKey: string;
  revocationEndpoint?: string | null; trusted?: boolean;
}) {
  const res = await fetch('/api/trusted-issuers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!res.ok || !json.ok) throw new Error(json.error || 'Failed to add issuer');
  return json.data;
}

export async function getTrustedIssuers() {
  const res = await fetch('/api/trusted-issuers', { cache: 'no-store' });
  const json = await res.json();
  if (!res.ok || !json.ok) throw new Error(json.error || 'Failed to load issuers');
  return json.data as Array<any>;
}

export async function deleteTrustedIssuer(did: string) {
  const res = await fetch(`/api/trusted-issuers/${encodeURIComponent(did)}`, { method: 'DELETE' });
  const json = await res.json();
  if (!res.ok || !json.ok) throw new Error(json.error || 'Failed to delete issuer');
}
