import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ContextService, ContextUpdate, Context, ContextMetadata } from '@/lib/context-service'; // Assuming ContextUpdate is exported

/**
 * @swagger
 * components:
 *   schemas:
 *     Context:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         project_id: { type: string, format: uuid }
 *         user_id: { type: string }
 *         name: { type: string }
 *         content: { type: string, nullable: true }
 *         digest: { type: string, nullable: true }
 *         metadata: { $ref: '#/components/schemas/ContextMetadata', nullable: true }
 *         created_at: { type: string, format: date-time }
 *         updated_at: { type: string, format: date-time }
 *     ContextMetadata:
 *       type: object
 *       properties:
 *         category: { type: string, enum: [documentation, research, notes, meeting, reference, other] }
 *         tags: { type: array, items: { type: string } }
 *         shared_from: { type: string }
 *         references: { type: array, items: { type: string } }
 *         last_accessed: { type: string, format: date-time }
 *         access_count: { type: number }
 *       additionalProperties: true # Allows other arbitrary properties
 *     ContextUpdate:
 *       type: object
 *       properties:
 *         name: { type: string }
 *         content: { type: string, nullable: true }
 *         digest: { type: string, nullable: true }
 *         metadata: { $ref: '#/components/schemas/ContextMetadata', nullable: true }
 */

/**
 * @swagger
 * /api/contexts/{id}:
 *   get:
 *     summary: Retrieves a specific context by ID.
 *     description: Fetches the details of a context if it's owned by the authenticated user.
 *     tags: [Contexts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: "uuid" }
 *         description: The ID of the context to retrieve.
 *     security: [{bearerAuth: []}]
 *     responses:
 *       200: { description: Context details retrieved successfully., content: { application/json: { schema: { $ref: '#/components/schemas/Context' } } } }
 *       401: { description: Unauthorized - User not authenticated. }
 *       403: { description: Forbidden - User does not own the context. }
 *       404: { description: Not Found - Context not found. }
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

        const contextId = params.id;
        const context: Context | null = await ContextService.getContext(contextId);

        if (!context) {
            return NextResponse.json({ message: 'Context not found' }, { status: 404 });
        }

        // Authorization: User must own the context
        if (context.user_id !== session.user.id) {
            return NextResponse.json({ message: 'Forbidden - You do not own this context' }, { status: 403 });
        }

        return NextResponse.json({ context });
    } catch (error: any) {
        console.error('Error fetching context:', error);
        return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
    }
}

/**
 * @swagger
 * /api/contexts/{id}:
 *   patch:
 *     summary: Updates a specific context.
 *     description: Updates a context if it's owned by the authenticated user.
 *     tags: [Contexts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: "uuid" }
 *         description: The ID of the context to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContextUpdate'
 *     security: [{bearerAuth: []}]
 *     responses:
 *       200: { description: Context updated successfully., content: { application/json: { schema: { $ref: '#/components/schemas/Context' } } } }
 *       400: { description: Bad Request - Invalid input data. }
 *       401: { description: Unauthorized - User not authenticated. }
 *       403: { description: Forbidden - User does not own the context. }
 *       404: { description: Not Found - Context not found. }
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

        const contextId = params.id;
        const updates: ContextUpdate = await req.json();

        // First, verify ownership before attempting update
        const existingContext = await ContextService.getContext(contextId);
        if (!existingContext) {
            return NextResponse.json({ message: 'Context not found' }, { status: 404 });
        }
        if (existingContext.user_id !== session.user.id) {
            return NextResponse.json({ message: 'Forbidden - You do not own this context' }, { status: 403 });
        }

        // ContextService.updateContext does not check ownership internally, so we do it above.
        const updatedContext = await ContextService.updateContext(contextId, updates);

        if (!updatedContext) {
            // This could happen if the context was deleted between the GET and PATCH, though unlikely
            return NextResponse.json({ message: 'Context not found or update failed' }, { status: 404 });
        }

        return NextResponse.json({ context: updatedContext });
    } catch (error: any) {
        console.error('Error updating context:', error);
        return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
    }
}

/**
 * @swagger
 * /api/contexts/{id}:
 *   delete:
 *     summary: Deletes a specific context.
 *     description: Deletes a context if it's owned by the authenticated user.
 *     tags: [Contexts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: "uuid" }
 *         description: The ID of the context to delete.
 *     security: [{bearerAuth: []}]
 *     responses:
 *       200: { description: Context deleted successfully. }
 *       401: { description: Unauthorized - User not authenticated. }
 *       403: { description: Forbidden - User does not own the context. }
 *       404: { description: Not Found - Context not found. }
 *       500: { description: Internal Server Error. }
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const contextId = params.id;

        // First, verify ownership before attempting delete
        const existingContext = await ContextService.getContext(contextId);
        if (!existingContext) {
            return NextResponse.json({ message: 'Context not found' }, { status: 404 });
        }
        if (existingContext.user_id !== session.user.id) {
            return NextResponse.json({ message: 'Forbidden - You do not own this context' }, { status: 403 });
        }
        
        // ContextService.deleteContext does not check ownership internally.
        const deleted = await ContextService.deleteContext(contextId);

        if (deleted) {
            return NextResponse.json({ message: 'Context deleted successfully' });
        } else {
            // This typically means the context wasn't found, which should have been caught above.
            // Or some other DB error occurred during deletion.
            return NextResponse.json({ message: 'Context not found or could not be deleted' }, { status: 404 });
        }
    } catch (error: any) {
        console.error('Error deleting context:', error);
        return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
    }
} 