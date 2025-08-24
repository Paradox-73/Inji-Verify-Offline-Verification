// app/api/sync/verification-results/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { VerificationResultSchema } from '@/lib/types';

const PayloadSchema = z.union([
  z.object({ result: VerificationResultSchema, resultId: z.string().optional() }),
  VerificationResultSchema, // allow sending the result directly
]);

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const parsed = PayloadSchema.parse(raw);
    const result = 'result' in parsed ? parsed.result : parsed;

    // Persist. If the same id arrives again, just update.
    await prisma.verificationResult.upsert({
      where: { id: result.id },
      update: {
        vcId: result.vcId,
        status: result.status,
        timestamp: result.timestamp,
        checks: JSON.stringify(result.checks),
        errors: result.errors ? JSON.stringify(result.errors) : undefined,
        metadata: JSON.stringify(result.metadata),
        synced: true,
      },
      create: {
        id: result.id,
        vcId: result.vcId,
        status: result.status,
        timestamp: result.timestamp,
        checks: JSON.stringify(result.checks),
        errors: result.errors ? JSON.stringify(result.errors) : undefined,
        metadata: JSON.stringify(result.metadata),
        synced: true,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api] verification-results failed:', err);
    if (err instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'invalid-payload' }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: 'write-failed' }, { status: 500 });
  }
}
