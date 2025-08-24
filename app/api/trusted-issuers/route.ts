// app/api/trusted-issuers/route.ts
export const runtime = 'nodejs'; // server runtime (OK in dev)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/trusted-issuers  -> list all
export async function GET() {
  try {
    const issuers = await prisma.trustedIssuer.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ ok: true, data: issuers });
  } catch (err) {
    console.error('[trusted-issuers] GET failed:', err);
    return NextResponse.json({ ok: false, error: 'db-error' }, { status: 500 });
  }
}

// POST /api/trusted-issuers  -> create or update one
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: false, error: 'invalid-json' }, { status: 400 });
    }

    const { did, name, publicKey, revocationEndpoint, trusted } = body as {
      did?: string;
      name?: string;
      publicKey?: string;
      revocationEndpoint?: string | null;
      trusted?: boolean;
    };

    if (!did || !name || !publicKey) {
      return NextResponse.json(
        { ok: false, error: 'missing-fields', details: ['did','name','publicKey'] },
        { status: 400 }
      );
    }

    const rec = await prisma.trustedIssuer.upsert({
      where: { did },
      update: { name, publicKey, revocationEndpoint: revocationEndpoint ?? null, trusted: !!trusted },
      create: { did, name, publicKey, revocationEndpoint: revocationEndpoint ?? null, trusted: !!trusted },
    });

    return NextResponse.json({ ok: true, data: rec });
  } catch (err) {
    console.error('[trusted-issuers] POST failed:', err);
    return NextResponse.json({ ok: false, error: 'db-error' }, { status: 500 });
  }
}
