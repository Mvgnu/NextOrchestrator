import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AgentService, AgentUpdate, Agent } from '@/lib/agent-service';

/**
 * @swagger
 * components:
 *   schemas:
 *     Agent:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         project_id: { type: string, format: uuid }
 *         user_id: { type: string }
 *         name: { type: string }
 *         description: { type: string, nullable: true }
 *         system_prompt: { type: string, nullable: true }
 *         config: { type: object, nullable: true } # JSONB
 *         is_public: { type: boolean }
 *         created_at: { type: string, format: date-time }
 *         updated_at: { type: string, format: date-time }
 *     AgentUpdate:
 *       type: object
 *       properties:
 *         name: { type: string }
 *         description: { type: string, nullable: true }
 *         system_prompt: { type: string, nullable: true }
 *         config: { type: object, nullable: true } # JSONB
 *         is_public: { type: boolean }
 */

/**
 * @swagger
 * /api/agents/{id}:
 *   get:
 *     summary: Retrieves a specific agent by ID.
 *     description: Fetches the details of an agent if it's public or owned by the authenticated user.
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: "uuid" }
 *         description: The ID of the agent to retrieve.
 *     security: [{bearerAuth: []}]
 *     responses:
 *       200: { description: Agent details retrieved successfully., content: { application/json: { schema: { $ref: '#/components/schemas/Agent' } } } }
 *       401: { description: Unauthorized - User not authenticated. }
 *       403: { description: Forbidden - User does not have access to the agent. }
 *       404: { description: Not Found - Agent not found. }
 *       500: { description: Internal Server Error. }
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const agentId = params.id;
        const agent: Agent | null = await AgentService.getAgent(agentId);

        if (!agent) {
            return NextResponse.json({ message: 'Agent not found' }, { status: 404 });
        }

        // Authorization: User can access if they own it or if it's public
        const hasAccess = agent.user_id === session.user.id || agent.is_public;
        if (!hasAccess) {
            // Additional check: if the agent is part of a project the user owns/has access to?
            // This depends on more complex project membership rules not yet defined for this check.
            // For now, direct ownership or public status is required.
            return NextResponse.json({ message: 'Forbidden - You do not have access to this agent' }, { status: 403 });
        }

        return NextResponse.json({ agent });
    } catch (error: any) {
        console.error('Error fetching agent:', error);
        return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
    }
}

/**
 * @swagger
 * /api/agents/{id}:
 *   patch:
 *     summary: Updates a specific agent.
 *     description: Updates an agent if it's owned by the authenticated user.
 *     tags: [Agents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: "uuid" }
 *         description: The ID of the agent to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AgentUpdate'
 *     security: [{bearerAuth: []}]
 *     responses:
 *       200: { description: Agent updated successfully., content: { application/json: { schema: { $ref: '#/components/schemas/Agent' } } } }
 *       400: { description: Bad Request - Invalid input data. }
 *       401: { description: Unauthorized - User not authenticated. }
 *       403: { description: Forbidden - User does not own the agent. }
 *       404: { description: Not Found - Agent not found. }
 *       500: { description: Internal Server Error. }
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const agentId = params.id;
        const updates: AgentUpdate = await req.json();

        // AgentService.updateAgent internally checks for user_id to ensure ownership.
        const updatedAgent = await AgentService.updateAgent(agentId, session.user.id, updates);

        if (!updatedAgent) {
            // This could be because the agent doesn't exist OR the user doesn't own it.
            // AgentService.updateAgent returns null if not found or not owned.
            // To give a more specific error, one might first fetch the agent, check ownership, then update.
            // However, the current service design combines this.
            const agentExists = await AgentService.getAgent(agentId);
            if (!agentExists) {
                return NextResponse.json({ message: 'Agent not found' }, { status: 404 });
            }
            // If it exists but wasn't updated, it implies a permission issue if logic is correct in service.
            return NextResponse.json({ message: 'Forbidden - You do not own this agent or update failed' }, { status: 403 });
        }

        return NextResponse.json({ agent: updatedAgent });
    } catch (error: any) {
        console.error('Error updating agent:', error);
        return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
    }
} 