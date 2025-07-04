import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as ProjectService from '@/lib/project-service';
// Remove Supabase-specific type import
// import type { Database } from '@/types/supabase';
// Assuming Project type is defined elsewhere, potentially derived or explicitly typed
// import { Project } from '@/types/project';

// The ProjectUpdate type derived from Supabase is no longer needed
// type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         created_at: { type: string, format: date-time }
 *         name: { type: string }
 *         description: { type: string, nullable: true }
 *         user_id: { type: string, format: uuid }
 *         updated_at: { type: string, format: date-time }
 *       required: [id, created_at, name, user_id, updated_at]
 */

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Retrieves a specific project by ID.
 *     description: Fetches the details of a project if the authenticated user has access.
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: The ID of the project to retrieve.
 *     security: [{bearerAuth: []}]
 *     responses:
 *       200: { description: Project details retrieved successfully, content: { application/json: { schema: { $ref: '#/components/schemas/Project' } } } }
 *       401: { description: Unauthorized - User not authenticated. }
 *       403: { description: Forbidden - User does not have access to the project. }
 *       404: { description: Not Found - Project not found. }
 *       500: { description: Internal Server Error. }
 */
export async function GET(
    req: NextRequest, // req might be unused but required by Next.js convention
    { params }: { params: { id: string } }
) {
    try {
        const projectId = params.id
        
        // Verify the user is authenticated
        const session = await getServerSession(authOptions)
        
        if (!session?.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get project
        const project = await ProjectService.getProject(projectId, session.user.id)

        return NextResponse.json({ project })
    } catch (error) {
        console.error('Error fetching project:', error)
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * @swagger
 * /api/projects/{id}:
 *   patch:
 *     summary: Updates a specific project.
 *     description: Updates the name and/or description of a project owned by the authenticated user.
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: The ID of the project to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The new name for the project.
 *               description:
 *                 type: string
 *                 description: The new description for the project.
 *     security: [{bearerAuth: []}]
 *     responses:
 *       200: { description: Project updated successfully, content: { application/json: { schema: { $ref: '#/components/schemas/Project' } } } }
 *       400: { description: Bad Request - Invalid input data. }
 *       401: { description: Unauthorized - User not authenticated. }
 *       403: { description: Forbidden - User does not have access to the project. }
 *       404: { description: Not Found - Project not found. }
 *       500: { description: Internal Server Error. }
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const projectId = params.id
        
        // Verify the user is authenticated
        const session = await getServerSession(authOptions)
        
        if (!session?.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }

        const updates = await req.json()

        // Update project
        const project = await ProjectService.updateProject(projectId, session.user.id, updates)

        return NextResponse.json({ 
            message: 'Project updated successfully',
            project
        })
    } catch (error) {
        console.error('Project update error:', error)
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
}


/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Deletes a specific project.
 *     description: Deletes a project and potentially its associated data (contexts, agents - depending on DB cascade rules) if owned by the authenticated user.
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: The ID of the project to delete.
 *     security: [{bearerAuth: []}]
 *     responses:
 *       204: { description: Project deleted successfully. }
 *       401: { description: Unauthorized - User not authenticated. }
 *       403: { description: Forbidden - User does not have access to the project. }
 *       404: { description: Not Found - Project not found. }
 *       500: { description: Internal Server Error. }
 */
export async function DELETE(
    req: NextRequest, // req is unused but required by Next.js convention
    { params }: { params: { id: string } }
) {
    try {
        const projectId = params.id
        
        // Verify the user is authenticated
        const session = await getServerSession(authOptions)
        
        if (!session?.user) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Delete project
        await ProjectService.deleteProject(projectId, session.user.id)

        return NextResponse.json({ 
            message: 'Project deleted successfully'
        })
    } catch (error) {
        console.error('Project deletion error:', error)
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        )
    }
} 