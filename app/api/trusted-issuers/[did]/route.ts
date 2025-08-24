// app/api/trusted-issuers/[did]/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DELETE /api/trusted-issuers/:did
export async function DELETE(
  _req: Request,
  { params }: { params: { did: string } }
) {
  try {
    const { did } = params;
    if (!did) {
      return NextResponse.json({ ok: false, error: 'missing-did' }, { status: 400 });
    }

    await prisma.trustedIssuer.delete({ where: { did } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[trusted-issuers] DELETE failed:', err);
    return NextResponse.json({ ok: false, error: 'db-error' }, { status: 500 });
  }
}
