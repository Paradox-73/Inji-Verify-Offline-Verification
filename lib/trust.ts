// Lightweight client-side types and helpers.
// Do NOT import Prisma types into client code.

export type TrustedIssuer = {
  id: string;                    // DID
  name: string;
  publicKey: string;
  revocationEndpoint?: string | null;
  trusted: boolean;
  createdAt: string;             // ISO when coming over HTTP
  updatedAt: string;             // ISO when coming over HTTP
};

export async function listTrustedIssuers(): Promise<TrustedIssuer[]> {
  const res = await fetch('/api/trusted-issuers', { cache: 'no-store' });
  const json = await res.json();
  if (!res.ok || !json.ok) throw new Error(json.error || 'Failed to load');
  return json.data as TrustedIssuer[];
}

export async function upsertTrustedIssuer(input: {
  did: string;
  name: string;
  publicKey: string;
  revocationEndpoint?: string;
  trusted?: boolean;
}): Promise<TrustedIssuer> {
  const res = await fetch('/api/trusted-issuers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!res.ok || !json.ok) throw new Error(json.error || 'Failed to add issuer');
  return json.data as TrustedIssuer;
}

export async function deleteTrustedIssuer(did: string): Promise<void> {
  const res = await fetch(`/api/trusted-issuers/${encodeURIComponent(did)}`, {
    method: 'DELETE',
  });
  const json = await res.json();
  if (!res.ok || !json.ok) throw new Error(json.error || 'Failed to delete');
}
