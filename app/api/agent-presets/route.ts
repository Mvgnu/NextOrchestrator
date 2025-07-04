import { NextRequest, NextResponse } from 'next/server'
import { AgentPresetService } from '@/lib/agent-preset-service'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * @swagger
 * /api/agent-presets:
 *   get:
 *     summary: Retrieves agent presets for the user.
 *     description: Fetches a list of all agent presets available to the authenticated user, including both system presets and user-created presets.
 *     tags:
 *       - Agent Presets
 *     security:
 *       - bearerAuth: [] # Or appropriate security scheme
 *     responses:
 *       200:
 *         description: A list of agent presets.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 presets:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AgentPreset' # Assuming AgentPreset schema definition
 *       401:
 *         description: Unauthorized - User not authenticated.
 *       500:
 *         description: Internal Server Error.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    
    const presets = await AgentPresetService.getUserPresets(userId);
    return NextResponse.json({ presets });
  } catch (error: any) {
    console.error('Error fetching agent presets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/agent-presets:
 *   post:
 *     summary: Creates a new agent preset.
 *     description: Creates a new custom agent preset for the authenticated user. Only users with the 'admin' role can create presets marked as `is_system: true`.
 *     tags:
 *       - Agent Presets
 *     security:
 *       - bearerAuth: [] # Session-based authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AgentPresetInsert'
 *     responses:
 *       201:
 *         description: Agent preset created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 preset:
 *                   $ref: '#/components/schemas/AgentPreset'
 *       400:
 *         description: Bad Request - Missing required fields.
 *       401:
 *         description: Unauthorized - User not authenticated.
 *       403:
 *         description: Forbidden - User attempting to create a system preset without admin privileges.
 *       500:
 *         description: Internal Server Error.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    
    const body = await request.json();
    
    // Validate required fields (align with AgentPresetInsert schema)
    if (
      !body.name ||
      !body.description ||
      !body.base_prompt ||
      !body.category ||
      !body.recommended_model ||
      !body.recommended_provider ||
      !body.icon
    ) {
      return NextResponse.json(
        { 
          error: 'Missing required fields: name, description, base_prompt, category, recommended_model, recommended_provider, icon' 
        }, 
        { status: 400 }
      );
    }
    
    // Ensure only admins can create system presets
    if (body.is_system && session.user.role !== 'admin') {
      // Check if the user has the 'admin' role from the session
      // For now, forbid any user from setting is_system to true
      console.warn(`User ${userId} (role: ${session.user.role}) attempted to create a system preset without admin privileges.`);
      return NextResponse.json(
        { error: 'Admin privileges required to create system presets' },
        { status: 403 } // Forbidden
      );
    }
    
    // If the preset is NOT marked as system, ensure user_id is set
    // If it IS system, user_id might be null (or keep it as the creating admin's ID - depends on requirements)
    const presetUserId = body.is_system && session.user.role === 'admin' ? null : userId;

    const presetData = {
      name: body.name,
      description: body.description,
      base_prompt: body.base_prompt,
      category: body.category,
      recommended_model: body.recommended_model,
      recommended_provider: body.recommended_provider,
      icon: body.icon,
      temperature: body.temperature === undefined ? 0.5 : body.temperature,
      memory_toggle: body.memory_toggle === undefined ? false : body.memory_toggle,
      tone: body.tone === undefined ? 'neutral' : body.tone,
      tags: body.tags || [],
      is_system: body.is_system === true && session.user.role === 'admin', // Only true if requested AND user is admin
      user_id: presetUserId, // Assign determined user ID (null for system, user ID otherwise)
    };

    const preset = await AgentPresetService.createPreset(presetData);
    
    return NextResponse.json({ preset }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating agent preset:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 