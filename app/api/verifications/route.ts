import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { VerificationResultSchema } from '@/lib/types'
import { prisma } from '@/lib/prisma'

// API route for syncing verification results
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate the verification result
    const result = VerificationResultSchema.parse(body)
    
    // Store in database
    await prisma.verificationResult.create({
      data: {
        id: result.id,
        vcId: result.vcId,
        status: result.status,
        timestamp: result.timestamp,
        checks: JSON.stringify(result.checks),
        errors: result.errors ? JSON.stringify(result.errors) : null,
        metadata: JSON.stringify(result.metadata),
        synced: true,
      }
    })

    console.log('Verification result synced:', {
      id: result.id,
      status: result.status,
      timestamp: result.timestamp,
      issuer: result.metadata.issuer
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Verification result synced successfully'
    })
  } catch (error) {
    console.error('Sync error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid verification result data' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    const results = await prisma.verificationResult.findMany({
      take: limit,
      skip: offset,
      orderBy: { timestamp: 'desc' }
    })

    const total = await prisma.verificationResult.count()

    return NextResponse.json({
      success: true,
      data: results.map(result => ({
        ...result,
        checks: JSON.parse(result.checks),
        errors: result.errors ? JSON.parse(result.errors) : null,
        metadata: JSON.parse(result.metadata)
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })
  } catch (error) {
    console.error('Failed to fetch verification results:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch verification results' },
      { status: 500 }
    )
  }
}