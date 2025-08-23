export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Expected body shape (adjust as needed):
// {
//   vcId: string,
//   status: string,
//   timestamp?: string|number, // optional, defaults to now
//   checks?: any,
//   errors?: any,
//   metadata?: any
// }
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // basic guardrails
    if (!body?.vcId || !body?.status) {
      return NextResponse.json({ ok: false, error: 'vcId and status are required' }, { status: 400 });
    }

    const rec = await prisma.verificationResult.create({
      data: {
        vcId: body.vcId,
        status: body.status,
        timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
        checks: body.checks ?? {},
        errors: body.errors ?? null,
        metadata: body.metadata ?? {},
        // synced defaults to false
      },
    });

    return NextResponse.json({ ok: true, id: rec.id });
  } catch (err) {
    console.error('[api] verification-results failed:', err);
    return NextResponse.json({ ok: false, error: 'write-failed' }, { status: 500 });
  }
}
