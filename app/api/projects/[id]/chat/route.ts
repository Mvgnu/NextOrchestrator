import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { AgentService } from '@/lib/agent-service';
import { ProjectService } from '@/lib/project-service';
import { synthesisService, ChatMessage, AgentResponseChunk } from '@/app/services/synthesisService';
// Update ContextService import path and type
import { ContextService, Context } from '@/lib/context-service'; 
// Remove old ContextDigest type import if it was there implicitly
// import { ContextDigest } from '@/app/services/contextService'; 

// Helper function to create a streaming response
function createStreamingResponse(stream: AsyncGenerator<AgentResponseChunk>): Response {
  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const jsonChunk = JSON.stringify(chunk);
          controller.enqueue(encoder.encode(`data: ${jsonChunk}\n\n`));
        }
      } catch (error) {
        console.error('Error in streaming response:', error);
        const errorChunk: AgentResponseChunk = {
          type: 'error',
          agentId: 'system', // Use a system ID for stream-level errors
          error: error instanceof Error ? error.message : 'Stream encountered an error',
        };
        try {
             controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
        } catch (enqueueError) {
            console.error("Failed to enqueue error chunk:", enqueueError);
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } } 
) {
  const projectId = params.id;

  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // 2. Authorization
    // Verify the user actually owns the project (or has explicit access)
    const hasProjectAccess = await ProjectService.userHasAccessToProject(
      userId,
      projectId
    )
    if (!hasProjectAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Parse Request Body
    let body: { query: string; agentId: string; contextIds: string[]; history: ChatMessage[] };
    try { body = await req.json(); } 
    catch (e) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { query, agentId, contextIds, history } = body;
    if (!query || !agentId || !Array.isArray(contextIds) || !Array.isArray(history)) {
        return NextResponse.json({ error: 'Missing required fields: query, agentId, contextIds, history' }, { status: 400 });
    }

    // 4. Fetch Agent Configuration (Check ownership/project match)
    const agent = await AgentService.getAgent(agentId);
    if (!agent || agent.project_id !== projectId || agent.user_id !== userId) {
         return NextResponse.json({ error: 'Agent not found or access denied' }, { status: 404 });
    }

    // 5. Fetch Actual Context Rows based on selected IDs
    // Filter contextIds to ensure they are valid strings before fetching
    const validContextIds = contextIds.filter(id => typeof id === 'string' && id.length > 0);
    
    let contexts: Context[] = []; // Changed from ContextRow[] to Context[]
    if (validContextIds.length > 0) {
         // Fetch contexts in bulk using the new service method
         contexts = await ContextService.getContextsByIds(validContextIds, userId);
         
         // We might want to warn the user if some selected contexts weren't found/accessible
         if(contexts.length !== validContextIds.length) {
            console.warn(`User ${userId} requested ${validContextIds.length} contexts but only ${contexts.length} were accessible/found.`);
         }
    } else {
        // No contexts selected
        contexts = [];
    }

    // Prepare contexts for synthesis service, ensuring content is string
    const preparedContexts = contexts.map(ctx => ({
      ...ctx,
      content: ctx.content || '', // Ensure content is a string
      metadata: ctx.metadata || {} // Ensure metadata is an object, not null/undefined
    }));

    // 6. Call Streaming Service with ContextRow[]
    const stream = synthesisService.streamAgentTurn(
      agent,
      query,
      preparedContexts, // Use prepared contexts
      history
    );

    // 7. Return Streaming Response
    return createStreamingResponse(stream);

  } catch (error: any) {
    console.error('Error in POST /api/projects/[id]/chat:', error);
    return NextResponse.json(
        { error: error.message || 'Internal Server Error' },
        { status: 500 }
    );
  }
} 