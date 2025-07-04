import { NextRequest, NextResponse } from 'next/server';
import getServerSession from 'next-auth';
import { authConfig } from '@/lib/auth';
import { applyFeedbackToAgent } from '@/app/services/feedbackService';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authConfig) as any;
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const agentId = params.id;
    const userId = session.user.id;
    const updatedAgent = await applyFeedbackToAgent(agentId, userId);
    return NextResponse.json({ agent: updatedAgent });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to apply feedback to agent' }, { status: 500 });
  }
} 