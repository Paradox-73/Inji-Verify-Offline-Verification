export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type InjiResult = {
  id: string;
  vcId: string;
  status: 'valid' | 'invalid' | 'expired' | 'error';
  timestamp: string | Date;
  checks: unknown;
  errors?: unknown;
  metadata: {
    issuer?: string;
    type?: string;
    issuanceDate?: string;
    expirationDate?: string;
    subjectId?: string;
    [k: string]: unknown;
  };
  synced?: boolean;
};

type PostBody =
  | { vc: any; result: InjiResult } // preferred payload
  | InjiResult;                     // legacy fallback (no VC JSON)

// util
function asDate(v?: string | Date | null) {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PostBody;

    // --- Preferred: save VC row then the result with FK ---
    if ('vc' in body && 'result' in body) {
      const { vc, result } = body;

      // Extract helpful columns
      const vcId = vc?.id ?? result.vcId ?? crypto.randomUUID();
      const issuer =
        typeof vc?.issuer === 'string' ? vc.issuer : vc?.issuer?.id ?? result.metadata?.issuer ?? null;
      const types = Array.isArray(vc?.type) ? vc.type.join(',') : (vc?.type ?? result.metadata?.type ?? null);
      const subjectId = vc?.credentialSubject?.id ?? result.metadata?.subjectId ?? null;
      const validFrom = asDate(vc?.validFrom ?? vc?.issuanceDate ?? result.metadata?.issuanceDate);
      const validUntil = asDate(vc?.validUntil ?? vc?.expirationDate ?? result.metadata?.expirationDate);

      // Because vcId is NOT unique in your schema, we can't upsert by vcId.
      // Find existing by vcId; update by primary key id, else create.
      const existing = await prisma.verifiableCredential.findFirst({ where: { vcId: vcId as string } });

      const data = {
        vc,
        vcId: vcId as string,
        issuer: issuer ?? undefined,
        holderSubjectId: subjectId ?? undefined,
        types: types ?? undefined,
        validFrom,
        validUntil,
        credentialStatus: vc?.credentialStatus ?? undefined,
        credentialSchema: vc?.credentialSchema ?? undefined,
        refreshService: vc?.refreshService ?? undefined,
        termsOfUse: vc?.termsOfUse ?? undefined,
        evidence: vc?.evidence ?? undefined,
      };

      const vcRow = existing
        ? await prisma.verifiableCredential.update({ where: { id: existing.id }, data })
        : await prisma.verifiableCredential.create({ data });

      // Upsert result by its id and point FK to vcRow.id
      const resRow = await prisma.verificationResult.upsert({
        where: { id: result.id },
        update: {
          status: result.status,
          timestamp: new Date(result.timestamp),
          checks: result.checks ?? {},
          errors: result.errors ?? undefined,
          metadata: JSON.stringify(result.metadata ?? {}),
          vcId: vcId as string,
          vcDbId: vcRow.id,
          synced: true,
        },
        create: {
          id: result.id,
          status: result.status,
          timestamp: new Date(result.timestamp),
          checks: result.checks ?? {},
          errors: result.errors ?? undefined,
          metadata: JSON.stringify(result.metadata ?? {}),
          vcId: vcId as string,
          vcDbId: vcRow.id,
          synced: true,
        },
      });

      return NextResponse.json({ ok: true, data: resRow });
    }

    // --- Legacy path (no VC JSON) cannot satisfy the FK; reject clearly ---
    return NextResponse.json(
      { ok: false, error: 'vc-required', hint: 'POST { vc, result } so we can link vcDbId' },
      { status: 400 }
    );
  } catch (err) {
    console.error('[verifications] POST failed:', err);
    return NextResponse.json({ ok: false, error: 'db-error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    // include the linked VC so UI can render raw JSON, issuer, etc.
    const data = await prisma.verificationResult.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
      include: { vc: true },
    });
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error('[verifications] GET failed:', err);
    return NextResponse.json({ ok: false, error: 'db-error' }, { status: 500 });
  }
}
