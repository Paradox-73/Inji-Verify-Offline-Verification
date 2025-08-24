// app/api/sync/flush/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function POST() {
  // Client queue is in IndexedDB; server can't flush it.
  return NextResponse.json({ ok: true, note: 'client queue flush is local to the browser' });
}
