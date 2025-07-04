import { NextRequest, NextResponse } from 'next/server'
import { AgentPresetService } from '@/lib/agent-preset-service'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * @swagger
 * /api/admin/initialize-presets:
 *   post:
 *     summary: Initializes or updates system agent presets.
 *     description: An admin-only endpoint to populate the database with default system agent presets. Requires the authenticated user to have the 'admin' role.
 *     tags:
 *       - Admin
 *       - Agent Presets
 *     security:
 *       - bearerAuth: [] # Requires active session with admin role
 *     responses:
 *       200:
 *         description: System presets initialized successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: System presets initialized successfully
 *       401:
 *         description: Unauthorized - User not authenticated.
 *       403:
 *         description: Forbidden - User does not have admin privileges.
 *       500:
 *         description: Internal Server Error - Failed to initialize presets.
 */
export async function POST(request: NextRequest) {
  try {
    // Check for admin role in session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      console.warn(`User ${session.user.id} (role: ${session.user.role}) attempted admin action: initialize presets.`);
      return NextResponse.json({ error: 'Forbidden: Admin privileges required.' }, { status: 403 });
    }
    
    // User is authenticated and is an admin, proceed.
    console.log(`Admin user ${session.user.id} initializing system presets.`);
    await AgentPresetService.initializeSystemPresets();
    
    return NextResponse.json({ success: true, message: 'System presets initialized successfully' });
  } catch (error: any) {
    console.error('Error initializing system presets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 