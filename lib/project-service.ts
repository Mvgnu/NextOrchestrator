// import { createClient } from '@supabase/supabase-js' // Removed Supabase
// import type { Database } from '@/types/supabase' // Removed Supabase type
// import { v4 as uuidv4 } from 'uuid'; // No longer needed for ID generation here

import { query } from './db'; // Import our PostgreSQL query function

// Define a local Project type based on our schema
export interface Project {
  id: string; // uuid
  user_id: string; // text
  name: string; // varchar(255)
  description?: string | null; // text
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

interface ProjectCreate {
  name: string;
  description?: string | null;
  user_id: string;
}

// Export ProjectUpdate interface
export interface ProjectUpdate {
  name?: string;
  description?: string | null;
}

/**
 * Get all projects for a user
 */
export async function getProjects(userId: string): Promise<Project[]> {
  const sql = `SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC`;
  try {
    const { rows } = await query(sql, [userId]);
    return rows;
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw new Error('Failed to fetch projects');
  }
}

/**
 * Get a single project by ID
 */
export async function getProject(projectId: string, userId: string): Promise<Project | null> {
  const sql = `SELECT * FROM projects WHERE id = $1 AND user_id = $2`;
  try {
    const { rows } = await query(sql, [projectId, userId]);
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching project:', error);
    throw new Error('Failed to fetch project');
  }
}

/**
 * Create a new project
 */
export async function createProject(project: ProjectCreate): Promise<Project> {
  const sql = `
    INSERT INTO projects (name, description, user_id)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  try {
    const { rows } = await query(sql, [project.name, project.description || null, project.user_id]);
    return rows[0];
  } catch (error) {
    console.error('Error creating project:', error);
    // Consider more specific error handling or re-throwing a custom error
    // For now, re-throw the original error message if available, or a generic one
    const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
    throw new Error(errorMessage);
  }
}

/**
 * Update an existing project
 */
export async function updateProject(projectId: string, userId: string, updates: ProjectUpdate): Promise<Project | null> {
  // Build the SET part of the query dynamically
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

  if (setClauses.length === 0) {
    // No actual fields to update, just fetch and return the current project
    // or throw an error indicating no update was performed.
    // For now, let's return the current project data if no updates were provided.
    // This behavior might need refinement based on desired API semantics.
    return getProject(projectId, userId);
  }

  setClauses.push(`updated_at = current_timestamp`);

  const sql = `
    UPDATE projects
    SET ${setClauses.join(', ')}
    WHERE id = $${paramCount++} AND user_id = $${paramCount++}
    RETURNING *;
  `;
  values.push(projectId, userId);

  try {
    const { rows } = await query(sql, values);
    return rows[0] || null;
  } catch (error) {
    console.error('Error updating project:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update project';
    throw new Error(errorMessage);
  }
}

/**
 * Delete a project
 */
export async function deleteProject(projectId: string, userId: string): Promise<boolean> {
  const sql = `DELETE FROM projects WHERE id = $1 AND user_id = $2`;
  try {
    const result = await query(sql, [projectId, userId]);
    return result.rowCount !== null && result.rowCount > 0; // Check for null before comparing
  } catch (error) {
    console.error('Error deleting project:', error);
    throw new Error('Failed to delete project');
  }
}

/**
 * Check if a user has access to a project
 */
export async function userHasAccessToProject(userId: string, projectId: string): Promise<boolean> {
  const sql = `SELECT id FROM projects WHERE id = $1 AND user_id = $2`;
  try {
    const { rows } = await query(sql, [projectId, userId]);
    return rows.length > 0;
  } catch (error) {
    console.error('Error checking project access:', error);
    return false; // Typically, if access check fails due to error, assume no access
  }
} 