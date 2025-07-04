import { NextRequest, NextResponse } from 'next/server';
import { analyzeFeedback } from '@/app/services/feedbackService';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get('agent_id');
  if (!agentId) {
    return NextResponse.json({ error: 'Missing agent_id' }, { status: 400 });
  }
  try {
    const analysis = await analyzeFeedback(agentId);
    return NextResponse.json({ analysis });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to analyze feedback' }, { status: 500 });
  }
} 