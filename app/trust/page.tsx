'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, RefreshCw } from 'lucide-react';
import {
  listTrustedIssuers,
  upsertTrustedIssuer,
  deleteTrustedIssuer,
  type TrustedIssuer,
} from '@/lib/trust';

export default function TrustedIssuersPage() {
  const [items, setItems] = useState<TrustedIssuer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    did: '',
    name: '',
    publicKey: '',
    revocationEndpoint: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await listTrustedIssuers();
      setItems(data);
    } catch (e) {
      console.error(e);
      alert('Failed to load issuers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    if (!form.did || !form.name || !form.publicKey) {
      alert('DID, Name, and Public Key are required');
      return;
    }
    setSaving(true);
    try {
      await upsertTrustedIssuer({
        did: form.did.trim(),
        name: form.name.trim(),
        publicKey: form.publicKey.trim(),
        revocationEndpoint: form.revocationEndpoint.trim() || undefined,
      });
      setForm({ did: '', name: '', publicKey: '', revocationEndpoint: '' });
      await load();
    } catch (e) {
      console.error(e);
      alert('Failed to add issuer');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (did: string) => {
    if (!confirm('Delete this issuer?')) return;
    try {
      await deleteTrustedIssuer(did);
      await load();
    } catch (e) {
      console.error(e);
      alert('Failed to delete issuer');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Trusted Issuers</h1>
            <Button variant="outline" onClick={load} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Issuer Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="IvanBhargava"
              />
            </div>
            <div>
              <Label htmlFor="did">DID *</Label>
              <Input
                id="did"
                value={form.did}
                onChange={(e) => setForm((f) => ({ ...f, did: e.target.value }))}
                placeholder="did:example:issuer"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="pk">Public Key (base64/PEM) *</Label>
              <Input
                id="pk"
                value={form.publicKey}
                onChange={(e) => setForm((f) => ({ ...f, publicKey: e.target.value }))}
                placeholder="Base64 or PEM public key"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="rev">Revocation Endpoint (optional)</Label>
              <Input
                id="rev"
                value={form.revocationEndpoint}
                onChange={(e) => setForm((f) => ({ ...f, revocationEndpoint: e.target.value }))}
                placeholder="https://issuer.example.com/revocation"
              />
            </div>
          </div>

          <div>
            <Button onClick={submit} disabled={saving}>
              <Plus className="w-4 h-4 mr-2" />
              {saving ? 'Saving…' : 'Add Trusted Issuer'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="text-sm text-gray-600">Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-gray-600">No issuers yet.</div>
          ) : (
            <div className="space-y-2">
              {items.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center justify-between border rounded-lg p-3"
                >
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{it.name}</div>
                    <div className="text-xs text-gray-600 truncate">{it.id}</div>
                    <div className="text-xs text-gray-600 truncate">
                      {it.publicKey.slice(0, 64)}…
                    </div>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => remove(it.id)}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
