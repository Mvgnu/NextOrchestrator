import { NextRequest, NextResponse } from 'next/server'
import { ContextService } from '@/lib/context-service'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import logger from '@/lib/logger'

/**
 * @swagger
 * /api/contexts/digest:
 *   post:
 *     summary: Digests content into well-formatted markdown
 *     description: Processes raw content and converts it to structured markdown using AI
 *     tags:
 *       - Contexts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - title
 *             properties:
 *               content:
 *                 type: string
 *                 description: The raw content to digest
 *               title:
 *                 type: string
 *                 description: The title for the content
 *     responses:
 *       200:
 *         description: Content digested successfully
 *       400:
 *         description: Bad Request - Missing required fields
 *       401:
 *         description: Unauthorized - User not authenticated
 *       500:
 *         description: Internal Server Error
 */
export async function POST(req: NextRequest) {
  try {
    // Verify the user is authenticated
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { content, title } = await req.json()

    // Validate input
    if (!content || !title) {
      return NextResponse.json(
        { message: 'Content and title are required' },
        { status: 400 }
      )
    }

    // Process the content
    const digestedContent = await ContextService.digestToMarkdown(content, title)

    return NextResponse.json({ 
      message: 'Content digested successfully',
      digestedContent
    })
  } catch (error) {
    logger.error({ err: error }, 'Content digestion error')
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
} 