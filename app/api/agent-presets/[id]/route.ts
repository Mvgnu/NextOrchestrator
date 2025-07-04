import { NextRequest, NextResponse } from 'next/server'
import { AgentPresetService, AgentPresetUpdate, AgentPreset } from '@/lib/agent-preset-service'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * @swagger
 * components:
 *   schemas:
 *     AgentPreset:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         name: { type: string }
 *         description: { type: string }
 *         base_prompt: { type: string }
 *         category: { type: string }
 *         recommended_model: { type: string }
 *         recommended_provider: { type: string }
 *         icon: { type: string }
 *         temperature: { type: number, nullable: true }
 *         memory_toggle: { type: boolean, nullable: true }
 *         tone: { type: string, nullable: true }
 *         tags: { type: array, items: { type: string }, nullable: true }
 *         is_system: { type: boolean }
 *         user_id: { type: string, format: uuid, nullable: true }
 *         created_at: { type: string, format: date-time }
 *         updated_at: { type: string, format: date-time }
 *     AgentPresetUpdate:
 *       type: object
 *       properties:
 *         name: { type: string }
 *         description: { type: string }
 *         base_prompt: { type: string }
 *         category: { type: string }
 *         recommended_model: { type: string }
 *         recommended_provider: { type: string }
 *         icon: { type: string }
 *         temperature: { type: number, nullable: true }
 *         memory_toggle: { type: boolean, nullable: true }
 *         tone: { type: string, nullable: true }
 *         tags: { type: array, items: { type: string }, nullable: true }
 *         is_system: { type: boolean } # Note: Admin only for changing this
 *
 * @swagger
 * /api/agent-presets/{id}:
 *   get:
 *     summary: Retrieves a specific agent preset.
 *     description: Fetches the details of a specific agent preset by its ID, if the user has access.
 *     tags:
 *       - Agent Presets
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the agent preset to retrieve.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Agent preset details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 preset:
 *                   $ref: '#/components/schemas/AgentPreset'
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden - User does not have access to this preset.
 *       404:
 *         description: Preset not found.
 *       500:
 *         description: Internal Server Error.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
    
    const preset = await AgentPresetService.getPreset(params.id);
    
    if (!preset) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
    }
    
    // Check if the user has access (is owner or it's a system preset)
    const hasAccess = preset.is_system || preset.user_id === userId;
    // const hasAccess = await AgentPresetService.userHasAccessToPreset(userId, preset.id) // Original check - might be better if complex rules needed
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    return NextResponse.json({ preset });
  } catch (error: any) {
    console.error('Error fetching preset:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/agent-presets/{id}:
 *   put:
 *     summary: Updates an agent preset.
 *     description: Updates an existing agent preset owned by the user. System presets cannot be modified.
 *     tags:
 *       - Agent Presets
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the agent preset to update.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AgentPresetUpdate' # Assuming AgentPresetUpdate schema definition
 *     responses:
 *       200:
 *         description: Preset updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 preset:
 *                   $ref: '#/components/schemas/AgentPreset'
 *       400:
 *         description: Bad Request - Invalid data.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden - User does not own the preset or attempting to modify a system preset.
 *       404:
 *         description: Preset not found.
 *       500:
 *         description: Internal Server Error.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.role) { // ensure role is checked for admin operations
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const presetId = params.id;
    const updates: AgentPresetUpdate = await req.json();

    const existingPreset: AgentPreset | null = await AgentPresetService.getPreset(presetId);
    if (!existingPreset) {
      return NextResponse.json({ message: 'Agent preset not found' }, { status: 404 });
    }

    // Authorization: User must own the preset or be an admin to update system presets
    const canUpdate = (existingPreset.user_id === session.user.id && !existingPreset.is_system) || 
                      (existingPreset.is_system && session.user.role === 'admin');
    
    if (!canUpdate) {
      return NextResponse.json({ message: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }
    
    // Prevent changing is_system property unless user is admin.
    if (updates.is_system !== undefined && updates.is_system !== existingPreset.is_system && session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden - Cannot change is_system property' }, { status: 403 });
    }
    
    const updatedPreset = await AgentPresetService.updatePreset(presetId, updates);
    if (!updatedPreset) {
      return NextResponse.json({ message: 'Agent preset not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({ preset: updatedPreset });
  } catch (error: any) {
    console.error('Error updating agent preset:', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/agent-presets/{id}:
 *   delete:
 *     summary: Deletes an agent preset.
 *     description: Deletes an existing agent preset owned by the user. System presets cannot be deleted.
 *     tags:
 *       - Agent Presets
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the agent preset to delete.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Preset deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden - User does not own the preset or attempting to delete a system preset.
 *       404:
 *         description: Preset not found.
 *       500:
 *         description: Internal Server Error.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.role) { // ensure role is available for admin checks
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const presetId = params.id;
    const existingPreset: AgentPreset | null = await AgentPresetService.getPreset(presetId);

    if (!existingPreset) {
      return NextResponse.json({ message: 'Agent preset not found' }, { status: 404 });
    }

    let deleted = false;
    if (existingPreset.is_system) {
      // System presets can only be deleted by admins.
      // AgentPresetService.deletePreset is designed for user-owned presets.
      // A separate admin-specific service method or direct DB operation by an admin script would be needed.
      if (session.user.role === 'admin') {
        // This functionality is not yet in AgentPresetService.deletePreset for system presets.
        // It currently only deletes if user_id matches and is_system is false.
        console.warn(`Attempt by admin ${session.user.id} to delete system preset ${presetId}. Requires dedicated service logic.`);
        return NextResponse.json({ message: 'Forbidden - Admin deletion of system presets requires a dedicated service method.' }, { status: 403 });
      } else {
        return NextResponse.json({ message: 'Forbidden - Cannot delete system presets' }, { status: 403 });
      }
    } else if (existingPreset.user_id === session.user.id) {
      // Correctly call deletePreset with userId for non-system presets
      deleted = await AgentPresetService.deletePreset(presetId, session.user.id);
    } else {
      // User does not own this non-system preset
      return NextResponse.json({ message: 'Forbidden - Insufficient permissions' }, { status: 403 });
    }
   
    if (deleted) {
      return NextResponse.json({ message: 'Agent preset deleted successfully' });
    } else {
      // This path will be hit if it's a system preset (and not deletable by this logic) 
      // or if deletePreset returned false for the user-owned one.
      return NextResponse.json({ message: 'Agent preset not found, is a system preset, or could not be deleted by user.' }, { status: 404 });
    }
  } catch (error: any) {
    console.error('Error deleting agent preset:', error);
    return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
  }
} 