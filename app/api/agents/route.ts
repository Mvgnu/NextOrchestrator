import { NextRequest, NextResponse } from 'next/server'
import { AgentService } from '@/lib/agent-service'
import { auth } from "@/lib/auth"

/**
 * @swagger
 * /api/agents:
 *   get:
 *     summary: Retrieves all agents for the authenticated user.
 *     description: Fetches a list of all agents associated with the currently authenticated user.
 *     tags:
 *       - Agents
 *     security:
 *       - bearerAuth: [] # Or appropriate security scheme
 *     responses:
 *       200:
 *         description: A list of agents.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 agents:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Agent' # Assuming Agent schema definition
 *       401:
 *         description: Unauthorized - User not authenticated.
 *       500:
 *         description: Internal Server Error.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('project_id');
    
    // If project_id is provided, filter by project
    let agents;
    if (projectId) {
      agents = await AgentService.getProjectAgents(projectId, userId);
    } else {
      agents = await AgentService.getUserAgents(userId);
    }
    
    return NextResponse.json({ agents });
  } catch (error: any) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/agents:
 *   post:
 *     summary: Creates a new agent.
 *     description: Creates a new agent for the authenticated user based on the provided configuration.
 *     tags:
 *       - Agents
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             # Assuming AgentInsert schema includes 'provider' now
 *             $ref: '#/components/schemas/AgentInsert' 
 *             required:
 *               - name
 *               - model
 *               - system_prompt
 *               - project_id
 *               - provider # Make provider required
 *             properties:
 *               # ... other properties ...
 *               provider:
 *                 type: string
 *                 description: "The AI provider for the agent (e.g., openai, anthropic)"
 *     responses:
 *       201:
 *         description: Agent created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 agent:
 *                   $ref: '#/components/schemas/Agent'
 *       400:
 *         description: Bad Request - Missing required fields (including provider).
 *       401:
 *         description: Unauthorized - User not authenticated.
 *       500:
 *         description: Internal Server Error.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    
    const body = await request.json();
    
    if (!body.name || !body.model || !body.project_id || !body.system_prompt || !body.provider) {
      return NextResponse.json(
        { error: 'Missing required fields: name, model, project_id, system_prompt, provider' }, 
        { status: 400 }
      );
    }
    
    const temperature = body.temperature === undefined ? 0.7 : body.temperature;

    const agentData = {
      name: body.name,
      description: body.description,
      model: body.model,
      provider: body.provider,
      temperature: temperature,
      max_tokens: body.max_tokens,
      system_prompt: body.system_prompt,
      project_id: body.project_id,
      config: {
        model: body.model,
        provider: body.provider,
        temperature: temperature,
        max_tokens: body.max_tokens,
        memory_enabled: body.memory_enabled === undefined ? false : body.memory_enabled,
      },
      is_public: body.is_public === undefined ? false : body.is_public,
      user_id: userId,
    };

    console.log("Creating agent with data:", {
      ...agentData,
      system_prompt: agentData.system_prompt?.substring(0, 50) + (agentData.system_prompt?.length > 50 ? '...' : '')
    });

    const agent = await AgentService.createAgent(agentData as any);
    
    return NextResponse.json({ agent }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating agent:', error);
    const errorCode = error?.code
    const errorDetails = error?.details
    const errorMessage = error?.message || 'Unknown error'
    
    console.error(`Error Code: ${errorCode}, Details: ${errorDetails}, Message: ${errorMessage}`)

    return NextResponse.json({ 
      error: errorMessage,
      details: errorDetails,
      code: errorCode
    }, { status: 500 });
  }
} 