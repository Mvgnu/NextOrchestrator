import { query } from './db'; // Import our PostgreSQL query function
import logger from './logger'
// import supabase from './supabase'; // Removed Supabase
// import type { Database } from '@/types/supabase'; // Removed Supabase types
// import { SupabaseClient, createClient } from '@supabase/supabase-js'; // Removed Supabase

// Define local Agent type based on our schema
export interface Agent {
  id: string; // uuid
  project_id: string; // uuid, FK to projects
  user_id: string; // text
  name: string; // varchar(255)
  description?: string | null; // text
  system_prompt?: string | null; // text
  config?: any | null; // jsonb - using 'any' for now, can be a more specific type
  is_public: boolean;
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

// For create and update operations
export interface AgentCreate {
  user_id: string;
  project_id: string; // Added project_id
  name: string;
  description?: string | null;
  system_prompt?: string | null;
  config?: any | null;
  is_public?: boolean; // Defaults to false in DB
}

export interface AgentUpdate {
  name?: string;
  description?: string | null;
  system_prompt?: string | null;
  config?: any | null;
  is_public?: boolean;
}

/**
 * Agent-related database operations
 */
export const AgentService = {
  /**
   * Get all agents for a specific user
   */
  async getUserAgents(userId: string): Promise<Agent[]> {
    const sql = `SELECT * FROM agents WHERE user_id = $1 ORDER BY created_at DESC`;
    try {
      const { rows } = await query(sql, [userId]);
      return rows;
    } catch (error) {
      logger.error({ error }, 'Error fetching user agents')
      throw new Error('Failed to fetch user agents');
    }
  },

  /**
   * Get a single agent by ID
   */
  async getAgent(agentId: string): Promise<Agent | null> {
    const sql = `SELECT * FROM agents WHERE id = $1`;
    try {
      const { rows } = await query(sql, [agentId]);
      return rows[0] || null;
    } catch (error) {
      logger.error({ error }, 'Error fetching agent')
      throw new Error('Failed to fetch agent');
    }
  },

  /**
   * Create a new agent
   */
  async createAgent(agent: AgentCreate): Promise<Agent> {
    const sql = `
      INSERT INTO agents (user_id, project_id, name, description, system_prompt, config, is_public)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    try {
      const { rows } = await query(sql, [
        agent.user_id,
        agent.project_id, // Added project_id
        agent.name,
        agent.description || null,
        agent.system_prompt || null,
        agent.config || {},
        agent.is_public === undefined ? false : agent.is_public,
      ]);
      return rows[0];
    } catch (error) {
      logger.error({ error }, 'Error creating agent')
      const errorMessage = error instanceof Error ? error.message : 'Failed to create agent';
      throw new Error(errorMessage);
    }
  },

  /**
   * Update an existing agent
   */
  async updateAgent(agentId: string, userId: string, updates: AgentUpdate): Promise<Agent | null> {
    // userId is added to ensure user can only update their own agents, common practice.
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      setClauses.push(`description = $${paramCount++}`);
      values.push(updates.description || null);
    }
    if (updates.system_prompt !== undefined) {
      setClauses.push(`system_prompt = $${paramCount++}`);
      values.push(updates.system_prompt || null);
    }
    if (updates.config !== undefined) {
      setClauses.push(`config = $${paramCount++}`);
      values.push(updates.config || null);
    }
    if (updates.is_public !== undefined) {
      setClauses.push(`is_public = $${paramCount++}`);
      values.push(updates.is_public);
    }

    if (setClauses.length === 0) {
      // No actual fields to update, fetch current agent data (owned by user)
      const currentAgent = await this.getAgent(agentId);
      if (currentAgent && currentAgent.user_id === userId) {
        return currentAgent;
      }
      return null; // Or throw error if agent not found or not owned by user
    }

    setClauses.push(`updated_at = current_timestamp`);
    const sql = `
      UPDATE agents
      SET ${setClauses.join(', ')}
      WHERE id = $${paramCount++} AND user_id = $${paramCount++} -- Ensure user owns the agent
      RETURNING *;
    `;
    values.push(agentId, userId);

    try {
      const { rows } = await query(sql, values);
      return rows[0] || null;
    } catch (error) {
      logger.error({ error }, 'Error updating agent')
      const errorMessage = error instanceof Error ? error.message : 'Failed to update agent';
      throw new Error(errorMessage);
    }
  },

  /**
   * Delete an agent (ensure user owns the agent and it belongs to the specified project)
   */
  async deleteAgent(agentId: string, projectId: string, userId: string): Promise<boolean> {
    // This query ensures the agent belongs to the specified project AND is owned by the user.
    // If project ownership by the user is a separate concern, that should be checked before calling this.
    const sql = `DELETE FROM agents WHERE id = $1 AND project_id = $2 AND user_id = $3`;
    try {
      const result = await query(sql, [agentId, projectId, userId]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      logger.error({ error }, 'Error deleting agent')
      throw new Error('Failed to delete agent');
    }
  },

  /**
   * Check if a user has access to an agent (owns it or if it's public)
   */
  async userHasAccessToAgent(userId: string, agentId: string): Promise<boolean> {
    const sql = `SELECT id FROM agents WHERE id = $1 AND (user_id = $2 OR is_public = TRUE)`;
    try {
      const { rows } = await query(sql, [agentId, userId]);
      return rows.length > 0;
    } catch (error) {
      logger.error({ error }, 'Error checking agent access')
      // In case of error, safer to assume no access
      return false;
    }
  },

  /**
   * Get all agents for a specific project. Assumes the user owns the project
   * or otherwise has access to it.
   */
  async getProjectAgents(projectId: string, userId: string): Promise<Agent[]> {
    // Implementation for fetching agents associated with a specific project
    // This assumes the user (userId) must own the agents or have access via the project.
    // If project ownership is separate, you might first verify user has access to projectId.
    const sql = `
      SELECT a.* 
      FROM agents a
      JOIN projects p ON a.project_id = p.id
      WHERE a.project_id = $1 AND p.user_id = $2 -- Ensures user owns the project
      ORDER BY a.created_at DESC;
    `;
    // If agents are directly owned by user_id and also linked to project_id, 
    // and you want to list agents for a project if the user owns EITHER the project OR the agent:
    // (This might be too permissive depending on requirements)
    // const sql = `SELECT * FROM agents WHERE project_id = $1 AND user_id = $2 ORDER BY created_at DESC`;
    try {
      const { rows } = await query(sql, [projectId, userId]);
      return rows;
    } catch (error) {
      logger.error({ error }, `Error fetching agents for project ${projectId}`)
      throw new Error('Failed to fetch project agents');
    }
  }
}; 