import { query, dbPool } from './db';

export type AgentContextRole = 'primary' | 'auxiliary' | 'specialist';

export interface AgentContextAssignment {
  id: string; // uuid
  context_id: string; // uuid
  agent_id: string; // uuid
  user_id: string; // uuid (who made/owns the assignment)
  role: AgentContextRole;
  priority?: number | null;
  custom_instructions?: string | null;
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

// DTO for creating assignments, as user_id and context_id will come from context/session
export interface AgentContextAssignmentCreateDto {
  agent_id: string;
  role: AgentContextRole;
  priority?: number | null;
  custom_instructions?: string | null;
}

export const AgentContextService = {
  /**
   * Get all assignments for a specific context, for a given user (checks context ownership).
   */
  async getAssignmentsForContext(contextId: string, userId: string): Promise<AgentContextAssignment[]> {
    const sql = `
      SELECT ca.* 
      FROM context_agents ca
      JOIN contexts c ON ca.context_id = c.id
      WHERE ca.context_id = $1 AND c.user_id = $2 
      ORDER BY ca.priority ASC, ca.created_at ASC;
    `;
    // This query ensures that we only fetch assignments for contexts owned by the requesting user.
    // The user_id in context_agents table tracks who created the specific assignment link.
    try {
      const { rows } = await query(sql, [contextId, userId]);
      return rows;
    } catch (error) {
      console.error('Error fetching agent assignments for context:', error);
      throw new Error('Failed to fetch agent assignments');
    }
  },

  /**
   * Sets all agent assignments for a specific context for a given user.
   * This will replace all existing assignments for that context linked to that user.
   */
  async setAssignmentsForContext(
    contextId: string,
    userId: string, // User performing the operation & owner of the context/assignments
    assignments: AgentContextAssignmentCreateDto[]
  ): Promise<AgentContextAssignment[]> {
    const poolClient = await dbPool.connect(); // Get a client from the dbPool
    try {
      await poolClient.query('BEGIN');

      // Verify the user owns the context
      const contextCheckSql = 'SELECT id FROM contexts WHERE id = $1 AND user_id = $2';
      const contextCheckResult = await poolClient.query(contextCheckSql, [contextId, userId]);
      if (contextCheckResult.rows.length === 0) {
        throw new Error('Context not found or user does not have permission.');
      }

      // Delete existing assignments for this context
      const deleteSql = `DELETE FROM context_agents WHERE context_id = $1`;
      await poolClient.query(deleteSql, [contextId]);

      if (assignments.length === 0) {
        await poolClient.query('COMMIT');
        return [];
      }

      const insertClauses: string[] = [];
      const values: any[] = [];
      
      for (const assignment of assignments) {
        const rowValues = [
          contextId,
          assignment.agent_id,
          userId,
          assignment.role,
          assignment.priority === undefined ? 5 : assignment.priority,
          assignment.custom_instructions || null
        ];
        insertClauses.push(
          `(${rowValues.map((_, i) => `$${values.length + i + 1}`).join(', ')})`
        );
        values.push(...rowValues);
      }

      const insertSql = `
        INSERT INTO context_agents (context_id, agent_id, user_id, role, priority, custom_instructions)
        VALUES ${insertClauses.join(', ')}
        RETURNING *;
      `;
      
      const { rows: newAssignments } = await poolClient.query(insertSql, values);
      await poolClient.query('COMMIT');
      return newAssignments;
    } catch (error) {
      await poolClient.query('ROLLBACK');
      console.error('Error setting agent assignments for context:', error);
      throw new Error('Failed to set agent assignments');
    } finally {
      poolClient.release(); // Release client back to the pool
    }
  },
}; 