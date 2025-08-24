export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    return NextResponse.json({ ok: true, data: rec });
  } catch (err) {
    console.error('[settings] POST failed:', err);
    return NextResponse.json({ ok: false, error: 'db-error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const all = await prisma.appSetting.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ ok: true, data: all });
  } catch (err) {
    console.error('[settings] GET failed:', err);
    return NextResponse.json({ ok: false, error: 'db-error' }, { status: 500 });
  }
}
