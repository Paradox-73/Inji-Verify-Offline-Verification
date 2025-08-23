export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Accept either { key, value } or an arbitrary object with key in it
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const key = (body?.key ?? 'default') as string;
    const value = body?.value ?? body;

    const rec = await prisma.appSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    return NextResponse.json({ ok: true, key: rec.key });
  } catch (err) {
    console.error('[api] settings failed:', err);
    return NextResponse.json({ ok: false, error: 'write-failed' }, { status: 500 });
  }
}
