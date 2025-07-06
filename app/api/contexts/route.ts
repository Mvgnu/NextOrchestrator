import { NextRequest, NextResponse } from 'next/server'
import { ContextService } from '@/lib/context-service'
import { auth } from "@/lib/auth"
import logger from '@/lib/logger'

/**
 * @swagger
 * /api/contexts:
 *   get:
 *     summary: Retrieves contexts for a project, with optional search and filtering.
 *     description: Fetches contexts associated with a project for the current user. Supports search by keyword, filtering by categories and tags, and pagination.
 *     tags:
 *       - Contexts
 *     parameters:
 *       - in: query
 *         name: project_id
 *         required: true
 *         schema: { type: string }
 *         description: ID of the project to fetch contexts for.
 *       - in: query
 *         name: search
 *         required: false
 *         schema: { type: string }
 *         description: Keyword to search in context names and content.
 *       - in: query
 *         name: categories
 *         required: false
 *         style: form
 *         explode: false
 *         schema: { type: array, items: { type: string } }
 *         description: Comma-separated list of categories to filter by.
 *       - in: query
 *         name: tags
 *         required: false
 *         style: form
 *         explode: false
 *         schema: { type: array, items: { type: string } }
 *         description: Comma-separated list of tags to filter by.
 *       - in: query
 *         name: limit
 *         required: false
 *         schema: { type: integer, default: 10 }
 *         description: Number of contexts to return per page.
 *       - in: query
 *         name: offset
 *         required: false
 *         schema: { type: integer, default: 0 }
 *         description: Number of contexts to skip (for pagination).
 *     responses:
 *       200:
 *         description: A list of contexts and total count.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contexts: { type: array, items: { $ref: '#/components/schemas/Context' } }
 *                 total: { type: integer }
 *       401:
 *         description: Unauthorized - User not authenticated.
 *       400:
 *         description: Bad Request - Project ID is required.
 *       500:
 *         description: Internal Server Error.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const projectId = searchParams.get('project_id');
    
    if (!projectId) {
      return NextResponse.json({ message: 'Project ID is required' }, { status: 400 });
    }

    const search = searchParams.get('search') || undefined;
    const categoriesParam = searchParams.get('categories');
    const categories = categoriesParam ? categoriesParam.split(',') as any[] : undefined; // ContextCategory[] type in service
    const tagsParam = searchParams.get('tags');
    const tags = tagsParam ? tagsParam.split(',') : undefined;
    const limit = searchParams.has('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined;
    const offset = searchParams.has('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined;

    const options = {
      search,
      categories,
      tags,
      limit,
      offset,
    };

    // Remove undefined properties from options so defaults in service layer apply
    Object.keys(options).forEach(key => options[key as keyof typeof options] === undefined && delete options[key as keyof typeof options]);

    const result = await ContextService.searchProjectContexts(projectId, options);

    return NextResponse.json(result); // Expect { contexts: [], total: 0 }
  } catch (error) {
    logger.error({ err: error }, 'Error fetching contexts');
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/contexts:
 *   post:
 *     summary: Create a new context
 *     description: Creates a new context for the authenticated user
 *     tags:
 *       - Contexts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - project_id
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the context
 *               description:
 *                 type: string
 *                 description: Optional description
 *               content:
 *                 type: string
 *                 description: Optional context content (markdown)
 *               project_id:
 *                 type: string
 *                 description: The ID of the project to add the context to
 *               metadata:
 *                 type: object
 *                 description: Metadata for the context
 *     responses:
 *       201:
 *         description: Context created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    logger.debug({ session }, 'API /contexts session')
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const userId = session.user.id
    const body = await req.json()
    
    if (!body.name || !body.project_id) {
      return NextResponse.json(
        { message: 'Name and project_id are required' },
        { status: 400 }
      )
    }

    // Ensure metadata is an object if provided, or default to empty object
    const metadata = (typeof body.metadata === 'object' && body.metadata !== null) ? body.metadata : {};

    const contextData = {
      name: body.name,
      description: body.description,
      content: body.content || '',
      project_id: body.project_id,
      metadata: metadata, // Use validated or default metadata
      user_id: userId
    }
    
    logger.debug({ data: {
      ...contextData,
      content: contextData.content?.substring(0, 100) + (contextData.content?.length > 100 ? '...' : '')
    } }, 'Creating context')

    const context = await ContextService.createContext(contextData)
    
    return NextResponse.json(
      { message: 'Context created successfully', context },
      { status: 201 }
    )
  } catch (error: any) {
    logger.error({ err: error }, 'Error creating context')
    // Generalized error logging
    const errorCode = error?.code // For PG errors or other system errors
    const errorDetails = error?.details // Standard property for some errors
    const errorMessage = error?.message || 'Unknown error'
    
    logger.error({ code: errorCode, details: errorDetails }, errorMessage)

    return NextResponse.json(
      { 
        message: 'Error creating context', 
        error: errorMessage,
        details: errorDetails, 
        code: errorCode
      },
      { status: 500 }
    )
  }
} 