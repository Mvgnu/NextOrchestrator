import { NextRequest, NextResponse } from 'next/server';
import { ApiUsageService } from '@/lib/api-usage-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Mark this route as dynamic since it uses headers and server-side session
export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/agent-performance:
 *   get:
 *     summary: Fetches agent performance data for the authenticated user.
 *     description: Retrieves aggregated performance metrics (ratings, usage, cost) for agents associated with the logged-in user, filterable by timeframe and specific agent ID.
 *     tags:
 *       - Agent Performance
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *           default: 30d
 *         description: The time period for which to fetch data (Last 7, 30, or 90 days).
 *       - in: query
 *         name: agentId
 *         schema:
 *           type: string
 *         description: Optional. The ID of a specific agent to filter results for.
 *     responses:
 *       200:
 *         description: Successfully retrieved agent performance data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AgentPerformanceSummary' # Assuming a schema definition exists
 *       401:
 *         description: Unauthorized - User not authenticated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Internal Server Error - Failed to fetch data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: An error occurred while fetching agent performance data
 */
export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const timeframe = searchParams.get('timeframe') || '30d';
    const agentId = searchParams.get('agentId') || undefined;
    
    // Calculate date range based on timeframe
    const now = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }
    
    // Fetch agent performance data
    const performanceData = await ApiUsageService.getAgentPerformanceData(
      session.user.id,
      startDate,
      now,
      agentId
    );
    
    return NextResponse.json({ 
      data: performanceData
    });
  } catch (error: any) {
    console.error('Error fetching agent performance data:', error);
    
    return NextResponse.json(
      { error: error.message || 'An error occurred while fetching agent performance data' },
      { status: 500 }
    );
  }
}
