import { NextRequest, NextResponse } from 'next/server'
import * as ProjectService from '@/lib/project-service'
import { auth } from "@/lib/auth"

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Retrieves all projects for the authenticated user.
 *     description: Fetches a list of all projects associated with the currently authenticated user.
 *     tags:
 *       - Projects
 *     security:
 *       - bearerAuth: [] # Or appropriate security scheme
 *     responses:
 *       200:
 *         description: A list of projects.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projects:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project' # Assuming Project schema definition
 *       401:
 *         description: Unauthorized - User not authenticated.
 *       500:
 *         description: Internal Server Error.
 */
export async function GET(req: Request) {
  try {
    // Verify the user is authenticated
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get projects for the current user
    const projects = await ProjectService.getProjects(session.user.id)

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Creates a new project.
 *     description: Creates a new project for the authenticated user.
 *     tags:
 *       - Projects
 *     security:
 *       - bearerAuth: [] # Or appropriate security scheme
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the new project.
 *               description:
 *                 type: string
 *                 description: An optional description for the project.
 *     responses:
 *       201:
 *         description: Project created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project:
 *                   $ref: '#/components/schemas/Project' # Assuming Project schema definition
 *       400:
 *         description: Bad Request - Missing required project name.
 *       401:
 *         description: Unauthorized - User not authenticated.
 *       500:
 *         description: Internal Server Error.
 */
export async function POST(req: Request) {
  try {
    // Verify the user is authenticated
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { name, description } = await req.json()

    // Validate input
    if (!name) {
      return NextResponse.json(
        { message: 'Project name is required' },
        { status: 400 }
      )
    }

    // Create project
    const project = await ProjectService.createProject({
      name,
      description,
      user_id: session.user.id
    })

    return NextResponse.json({ 
      message: 'Project created successfully',
      project
    })
  } catch (error) {
    console.error('Project creation error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 