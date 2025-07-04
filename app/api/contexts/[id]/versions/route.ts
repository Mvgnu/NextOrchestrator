import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ContextService } from '@/lib/context-service';

/**
 * @swagger
 * /api/contexts/{contextId}/versions:
 *   post:
 *     summary: Creates a new version for a context.
 *     description: Creates a new version for the specified context, owned by the authenticated user.
 *     tags: [Contexts, Versions]
 *     parameters:
 *       - in: path
 *         name: contextId
 *         required: true
 *         schema: { type: string, format: "uuid" }
 *         description: The ID of the context to version.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - versionName
 *             properties:
 *               versionName:
 *                 type: string
 *                 description: The name for the new version.
 *               versionDescription:
 *                 type: string
 *                 description: Optional description for the version.
 *               versionMetadata:
 *                 type: object
 *                 description: Optional metadata for the version (e.g., tags).
 *     security: [{bearerAuth: []}]
 *     responses:
 *       201: { description: Version created successfully. }
 *       400: { description: Bad Request - Missing required fields or invalid context. }
 *       401: { description: Unauthorized - User not authenticated. }
 *       403: { description: Forbidden - User does not own the context. }
 *       404: { description: Not Found - Context not found. }
 *       500: { description: Internal Server Error. }
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { contextId: string } } 
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        const userId = session.user.id;
        const contextId = params.contextId;

        const body = await req.json();
        const { versionName, versionDescription, versionMetadata } = body;

        if (!versionName) {
            return NextResponse.json({ message: 'Version name is required' }, { status: 400 });
        }

        // Verify user owns the context before creating a version for it
        const context = await ContextService.getContext(contextId);
        if (!context) {
            return NextResponse.json({ message: 'Context not found' }, { status: 404 });
        }
        if (context.user_id !== userId) {
            return NextResponse.json({ message: 'Forbidden - You do not own this context' }, { status: 403 });
        }

        const newVersion = await ContextService.createVersion(
            contextId,
            versionName,
            userId, // Pass userId for version ownership
            versionDescription,
            context.project_id, // Pass project_id from the context
            versionMetadata 
        );

        return NextResponse.json({ version: newVersion }, { status: 201 });

    } catch (error: any) {
        console.error(`Error creating version for context ${params.contextId}:`, error);
        // More specific error messages based on error type might be useful here
        if (error.message.includes('Context not found')) {
             return NextResponse.json({ message: 'Context not found' }, { status: 404 });
        }
        return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
    }
} 