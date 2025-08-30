// app/api/inji/[...path]/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const BASE = process.env.VERIFY_SERVICE_URL!; // must include /v1/verify

function joinUrl(base: string, path: string, search: string) {
  const url = new URL(base.replace(/\/$/, '') + '/' + path.replace(/^\//, ''));
  if (search) {
    const s = search.startsWith('?') ? search.slice(1) : search;
    for (const [k, v] of new URLSearchParams(s).entries()) url.searchParams.append(k, v);
  }
  return url.toString();
}

async function proxy(req: NextRequest, ctx: { params: { path?: string[] } }) {
  const target = joinUrl(BASE, (ctx.params.path ?? []).join('/'), new URL(req.url).search);
  // Convert incoming headers to a Headers object so we can delete problematic headers
  const incomingHeaders = new Headers(req.headers);
  ['host', 'content-length'].forEach((h) => incomingHeaders.delete(h));

  const init: RequestInit = {
    method: req.method,
    headers: incomingHeaders,
    redirect: 'manual',
    body:
      req.method === 'GET' || req.method === 'HEAD'
        ? undefined
        : await req.arrayBuffer(),
  };

  const res = await fetch(target, init);
  const headers = new Headers(res.headers);
  headers.delete('content-encoding');
  headers.delete('content-length');
  headers.set('access-control-allow-origin', '*');

  return new NextResponse(res.body, { status: res.status, headers });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
