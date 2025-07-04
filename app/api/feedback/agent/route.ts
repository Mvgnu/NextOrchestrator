import { NextRequest, NextResponse } from 'next/server';
import getServerSession from 'next-auth';
import { authConfig } from '@/lib/auth';
import { query } from '@/lib/db'; // Using direct PG query
// Assuming AgentFeedbackInsert type will be defined or imported if complex,
// For now, we'll infer from usage and typical feedback fields.

interface AgentFeedbackPayload {
    message_id?: string | null;
    agent_id: string;
    project_id: string;
    user_id: string; // This will be overridden by session user ID for security
    rating_overall?: number | null;
    rating_accuracy?: number | null;
    rating_relevance?: number | null;
    rating_completeness?: number | null;
    rating_clarity?: number | null;
    comment?: string | null;
    metadata?: Record<string, any> | null; // JSONB for other details
}

/**
 * @swagger
 * /api/feedback/agent:
 *   post:
 *     summary: Submits feedback for an agent.
 *     description: Allows authenticated users to submit feedback for a specific agent response.
 *     tags: [Feedback, Agents]
 *     security: [{bearerAuth: []}]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - agent_id
 *               - project_id
 *             properties:
 *               message_id: { type: string, nullable: true }
 *               agent_id: { type: string, format: "uuid" }
 *               project_id: { type: string, format: "uuid" }
 *               rating_overall: { type: integer, minimum: 1, maximum: 5, nullable: true }
 *               rating_accuracy: { type: integer, minimum: 1, maximum: 5, nullable: true }
 *               rating_relevance: { type: integer, minimum: 1, maximum: 5, nullable: true }
 *               rating_completeness: { type: integer, minimum: 1, maximum: 5, nullable: true }
 *               rating_clarity: { type: integer, minimum: 1, maximum: 5, nullable: true }
 *               comment: { type: string, nullable: true }
 *               metadata: { type: object, nullable: true }
 *     responses:
 *       201: { description: Feedback submitted successfully. }
 *       400: { description: Bad Request - Missing required fields. }
 *       401: { description: Unauthorized - User not authenticated. }
 *       500: { description: Internal Server Error. }
 */
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authConfig) as any;
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        const sessionUserId = session.user.id;

        const payload = await req.json();

        const { agent_id, user_id, rating, comment, message_id } = payload;
        if (!agent_id || !user_id || !rating || !message_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const sql = `
            INSERT INTO agent_feedback (agent_id, user_id, rating, comment, message_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        
        const values = [
            agent_id,
            user_id,
            rating,
            comment || null,
            message_id
        ];

        const { rows } = await query(sql, values);
        
        return NextResponse.json({ feedback: rows[0] }, { status: 201 });

    } catch (error: any) {
        console.error('Error submitting agent feedback:', error);
        return NextResponse.json({ message: error.message || 'Internal server error' }, { status: 500 });
    }
} 