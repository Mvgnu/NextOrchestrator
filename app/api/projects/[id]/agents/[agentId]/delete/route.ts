import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AgentService } from '@/lib/agent-service'

/**
 * @swagger
 * /api/projects/{id}/agents/{agentId}/delete:
 *   delete:
 *     summary: Deletes a specific agent within a project.
 *     description: Deletes an agent belonging to a specific project, provided the authenticated user owns the agent and it belongs to the project.
 *     tags:
 *       - Agents
 *       - Projects
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the project containing the agent.
 *       - in: path
 *         name: agentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the agent to delete.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Agent deleted successfully.
 *       302:
 *         description: Redirects back to the project page upon successful deletion.
 *       401:
 *         description: Unauthorized - User not authenticated.
 *       404:
 *         description: Not Found - Project or Agent not found, or user does not own the project.
 *       500:
 *         description: Internal Server Error - Failed to delete agent or unexpected error.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; agentId: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json(
      { error: 'You must be signed in to perform this action' },
      { status: 401 }
    )
  }

  const userId = session.user.id;
  const projectId = params.id;
  const agentIdToDelete = params.agentId;

  try {
    const deleted = await AgentService.deleteAgent(agentIdToDelete, projectId, userId);

    if (deleted) {
      return NextResponse.json(
        { message: 'Agent deleted successfully' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Agent not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }

  } catch (error) {
    console.error('Error deleting agent:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred while deleting the agent' },
      { status: 500 }
    )
  }
} 