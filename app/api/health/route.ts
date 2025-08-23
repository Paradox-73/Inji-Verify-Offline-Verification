import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    
    const stats = {
      verificationResults: await prisma.verificationResult.count(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      status: 'healthy'
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: 'Database connection failed',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      },
      { status: 503 }
    )
  }
}