import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  return NextResponse.json({
    error: 'This endpoint has been replaced. Use /api/ai/playground with clustering prompts instead.',
    redirect: '/api/ai/playground'
  }, { status: 410 })
}

export async function GET() {
  return NextResponse.json({
    message: 'Clustering API has been replaced',
    redirect: '/api/ai/playground',
    info: 'Use the AI Playground with clustering-specific prompts and tools for semantic clustering.'
  })
}