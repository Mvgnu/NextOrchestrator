import { NextRequest, NextResponse } from 'next/server';
import getServerSession from 'next-auth';
import { authConfig } from '@/lib/auth';
import { AgentService } from '@/lib/agent-service';
import { AgentExecutor } from '@/lib/agent-executor';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authConfig) as any;
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const agentId = params.id;
    const userId = session.user.id;
    const body = await req.json();
    const { userMessage, context } = body;
    if (!userMessage) {
      return NextResponse.json({ message: 'Missing userMessage' }, { status: 400 });
    }
    const agent = await AgentService.getAgent(agentId);
    if (!agent) {
      return NextResponse.json({ message: 'Agent not found' }, { status: 404 });
    }
    if (agent.user_id !== userId && !agent.is_public) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    // Prepare agent object for executor
    const execAgent = {
      id: agent.id,
      name: agent.name,
      model: agent.config?.model || 'gpt-4',
      provider: agent.config?.provider || 'openai',
      basePrompt: agent.system_prompt || '',
      temperature: agent.config?.temperature,
      maxTokens: agent.config?.max_tokens,
    };
    const response = await AgentExecutor.executeAgent(execAgent, userMessage, context, userId, agent.project_id);
    return NextResponse.json({ response });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed to re-invoke agent' }, { status: 500 });
  }
} 