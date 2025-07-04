import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AgentService } from '@/lib/agent-service'
import { AgentContextService, AgentContextAssignmentCreateDto } from '@/lib/agent-context-service'

/**
 * @swagger
 * /api/contexts/agents:
 *   post:
 *     summary: Assign agents to a context
 *     description: Creates or updates agent assignments for a specific context
 *     tags:
 *       - Contexts
 *       - Agents
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - context_id
 *               - assignments
 *             properties:
 *               context_id:
 *                 type: string
 *                 description: The ID of the context
 *               assignments:
 *                 type: array
 *                 description: Agent assignments
 *                 items:
 *                   type: object
 *                   required:
 *                     - agent_id
 *                     - role
 *                   properties:
 *                     agent_id:
 *                       type: string
 *                       description: The ID of the agent
 *                     role:
 *                       type: string
 *                       enum: [primary, auxiliary, specialist]
 *                       description: The role of the agent for this context
 *                     priority:
 *                       type: number
 *                       description: Priority level (1-10)
 *                     custom_instructions:
 *                       type: string
 *                       description: Custom instructions for this agent-context pairing
 *     responses:
 *       200:
 *         description: Assignments saved successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const userId = session.user.id
    const body = await req.json()
    const { context_id, assignments } = body;
    
    if (!context_id || !assignments || !Array.isArray(assignments)) {
      return NextResponse.json(
        { message: 'Missing required fields: context_id, assignments array' },
        { status: 400 }
      )
    }

    // Validate structure of each assignment object
    const validatedAssignments: AgentContextAssignmentCreateDto[] = [];
    for (const assign of assignments) {
      if (!assign.agent_id || !assign.role) {
        return NextResponse.json(
          { message: 'Each assignment must have agent_id and role' },
          { status: 400 }
        );
      }
      validatedAssignments.push({
        agent_id: assign.agent_id,
        role: assign.role,
        priority: assign.priority, // Will be handled by service default if undefined
        custom_instructions: assign.custom_instructions
      });
    }
    
    // Verify this user has access to the agents they're trying to assign
    const userAgents = await AgentService.getUserAgents(userId)
    const userAgentIds = new Set(userAgents.map(agent => agent.id))
    
    const allAgentsBelongToUser = validatedAssignments.every(
      assignment => userAgentIds.has(assignment.agent_id)
    )
    
    if (!allAgentsBelongToUser) {
      return NextResponse.json(
        { message: 'Unauthorized: Cannot assign agents you do not own' },
        { status: 403 }
      )
    }
    
    // Call the service to set assignments
    const savedAssignments = await AgentContextService.setAssignmentsForContext(
      context_id,
      userId,
      validatedAssignments
    );
    
    return NextResponse.json({
      message: 'Agent assignments saved successfully',
      context_id,
      assignments: savedAssignments
    });

  } catch (error: any) {
    console.error('Error in agent assignment:', error);
    // Provide more specific error message if available (e.g., from service exceptions)
    const errorMessage = error.message || 'Internal server error';
    const statusCode = error.message === 'Context not found or user does not have permission.' ? 404 : 500;
    return NextResponse.json(
      { message: errorMessage },
      { status: statusCode }
    );
  }
}

/**
 * @swagger
 * /api/contexts/agents:
 *   get:
 *     summary: Get agent assignments for a context
 *     description: Retrieves all agent assignments for a specific context
 *     tags:
 *       - Contexts
 *       - Agents
 *     parameters:
 *       - in: query
 *         name: context_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the context
 *     responses:
 *       200:
 *         description: Assignments retrieved successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const userId = session.user.id;
    const searchParams = req.nextUrl.searchParams
    const contextId = searchParams.get('context_id')
    
    if (!contextId) {
      return NextResponse.json(
        { message: 'Context ID is required' },
        { status: 400 }
      )
    }
    
    // Call the service to get assignments
    const assignments = await AgentContextService.getAssignmentsForContext(contextId, userId);
    
    return NextResponse.json({
      message: 'Agent assignments retrieved',
      context_id: contextId,
      assignments
    });

  } catch (error: any) {
    console.error('Error fetching agent assignments:', error);
    const errorMessage = error.message || 'Internal server error';
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
} 