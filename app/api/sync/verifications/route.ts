export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // expect a full verification result; keep it simple first
    const {
      id,
      vcId,
      status,
      timestamp,
      checks = {},
      errors = null,
      metadata = {},
    } = body || {};

    if (!id || !vcId || !status || !timestamp) {
      return NextResponse.json({ ok: false, error: 'missing-fields' }, { status: 400 });
    }

    // NOTE: if you originally stored JSON as string, change your Prisma schema
    // to Json for checks/errors/metadata (recommended). This uses Json directly.
    const rec = await prisma.verificationResult.upsert({
      where: { id },
      update: { vcId, status, timestamp: new Date(timestamp), checks, errors, metadata, synced: true },
      create: { id, vcId, status, timestamp: new Date(timestamp), checks, errors, metadata, synced: true },
    });

    return NextResponse.json({ ok: true, data: rec });
  } catch (err) {
    console.error('[verifications] POST failed:', err);
    return NextResponse.json({ ok: false, error: 'db-error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const data = await prisma.verificationResult.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error('[verifications] GET failed:', err);
    return NextResponse.json({ ok: false, error: 'db-error' }, { status: 500 });
  }
}
