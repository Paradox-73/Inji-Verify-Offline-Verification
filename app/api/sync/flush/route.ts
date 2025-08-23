export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

// If you later add a server-side queue, call it here.
// For now, this endpoint simply echoes:
export async function POST() {
  return NextResponse.json({ ok: true, note: 'client queue flush is local to the browser' });
}
