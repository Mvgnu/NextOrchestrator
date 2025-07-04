import { NextRequest, NextResponse } from 'next/server'
import { ContextService } from '@/lib/context-service'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

/**
 * @swagger
 * /api/contexts/{id}/digest:
 *   post:
 *     summary: Saves a digest to an existing context
 *     description: Updates a context with a generated digest and saves it to the database
 *     tags:
 *       - Contexts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Context ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - digest
 *             properties:
 *               digest:
 *                 type: string
 *                 description: The markdown digest to save
 *               metadata:
 *                 type: object
 *                 description: Optional metadata about the digest
 *     responses:
 *       200:
 *         description: Digest saved successfully
 *       400:
 *         description: Bad Request - Missing required fields
 *       401:
 *         description: Unauthorized - User not authenticated
 *       404:
 *         description: Context not found
 *       500:
 *         description: Internal Server Error
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify the user is authenticated
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const contextId = params.id
    const { digest, metadata } = await req.json()

    // Validate input
    if (!digest) {
      return NextResponse.json(
        { message: 'Digest is required' },
        { status: 400 }
      )
    }

    // Get the context to verify it exists and the user has access
    try {
      const context = await ContextService.getContext(contextId)
      
      if (!context) {
        return NextResponse.json(
          { message: 'Context not found' },
          { status: 404 }
        )
      }
      
      // Update the context with the digest
      const updated = await ContextService.updateContext(contextId, {
        content: digest,
        metadata: {
          ...(context.metadata as any || {}),
          digest_saved: true,
          digest_created_at: new Date().toISOString(),
          ...(metadata || {})
        }
      })

      return NextResponse.json({ 
        message: 'Digest saved successfully',
        context: updated
      })
    } catch (error) {
      console.error('Error accessing context:', error)
      return NextResponse.json(
        { message: 'Error accessing context' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error saving digest:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 