import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { ContextService } from '@/lib/context-service';

/**
 * @swagger
 * /api/projects/{id}/tags:
 *   get:
 *     summary: Retrieves all unique tags for a specific project.
 *     description: Fetches a list of unique tags from contexts within the specified project, for the authenticated user.
 *     tags: [Projects, Contexts, Tags]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: "uuid" }
 *         description: The ID of the project to retrieve tags for.
 *     security: [{bearerAuth: []}]
 *     responses:
 *       200:
 *         description: A list of unique tags.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tags: { type: array, items: { type: string } }
 *       401: { description: Unauthorized - User not authenticated. }
 *       403: { description: Forbidden - User does not have access to this project's tags. }
 *       404: { description: Not Found - Project not found. }
 *       500: { description: Internal Server Error. }
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } } // Changed projectId to id
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;
        const projectId = params.id; // Use params.id

        if (!projectId) {
            return NextResponse.json({ message: 'Project ID is required' }, { status: 400 });
        }

        const tags = await ContextService.getProjectTags(projectId, userId); 

        return NextResponse.json({ tags });

    } catch (error: any) {
        console.error(`Error fetching tags for project ${params.id}:`, error); // Use params.id
        if (error.message.toLowerCase().includes('not found')) {
            return NextResponse.json({ message: 'Project not found or no tags available.' }, { status: 404 });
        }
        return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
    }
} 