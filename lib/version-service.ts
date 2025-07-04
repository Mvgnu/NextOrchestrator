import { query, dbPool } from './db'; // Import dbPool directly
// import { Database } from '@/types/supabase'; // Removed Supabase type
// import supabase from '@/lib/supabase'; // Removed Supabase client
import { notFound } from 'next/navigation'; // Keep for now, may need adjustment

// Define local Version type based on our schema
export interface Version {
  id: string; // uuid
  name: string; // varchar(255)
  description?: string | null; // text
  content_id: string; // uuid
  content_type: string; // varchar(100)
  content_snapshot: any; // jsonb - can be more specific if snapshot structure is known
  metadata?: any | null; // jsonb
  project_id?: string | null; // uuid
  user_id?: string | null; // text
  is_current: boolean;
  created_at: string; // timestamptz
}

// For create operations (Insert)
export interface VersionCreate {
  name: string;
  description?: string | null;
  content_id: string;
  content_type: ContentType;
  content_snapshot: any;
  metadata?: any | null;
  project_id?: string | null;
  user_id?: string | null;
  is_current?: boolean; // Defaults to false in DB
}

// For update operations
export interface VersionUpdate {
  name?: string;
  description?: string | null;
  content_snapshot?: any;
  metadata?: any | null;
  is_current?: boolean;
  // content_id, content_type, project_id, user_id are generally not updatable for a version record
}

export type ContentType = 'context' | 'agent' | 'project';

/**
 * Service for managing content versions in the application
 */
class VersionService {
  /**
   * Create a new version record
   */
  async createVersion(versionData: VersionCreate): Promise<Version> {
    const sql = `
      INSERT INTO versions (name, description, content_id, content_type, content_snapshot, metadata, project_id, user_id, is_current)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const params = [
      versionData.name,
      versionData.description || null,
      versionData.content_id,
      versionData.content_type,
      versionData.content_snapshot,
      versionData.metadata || null,
      versionData.project_id || null,
      versionData.user_id || null,
      versionData.is_current === undefined ? false : versionData.is_current,
    ];
    try {
      const { rows } = await query(sql, params);
      return rows[0];
    } catch (error) {
      console.error('Error creating version:', error);
      const msg = error instanceof Error ? error.message : 'Failed to create version';
      throw new Error(`Failed to create version: ${msg}`);
    }
  }

  /**
   * Get all versions for a specific content
   */
  async getVersionsByContent(contentId: string, contentType: ContentType): Promise<Version[]> {
    const sql = `SELECT * FROM versions WHERE content_id = $1 AND content_type = $2 ORDER BY created_at DESC`;
    try {
      const { rows } = await query(sql, [contentId, contentType]);
      return rows;
    } catch (error) {
      console.error('Error fetching versions:', error);
      const msg = error instanceof Error ? error.message : 'Failed to fetch versions';
      throw new Error(`Failed to fetch versions: ${msg}`);
    }
  }

  /**
   * Get a specific version by ID
   */
  async getVersion(versionId: string): Promise<Version | null> {
    const sql = `SELECT * FROM versions WHERE id = $1`;
    try {
      const { rows } = await query(sql, [versionId]);
      if (rows.length === 0) {
        // Original code used notFound() from next/navigation for PGRST116 error.
        // We can replicate by returning null and letting caller handle it or calling notFound() if appropriate here.
        // For now, returning null is cleaner for a service layer.
        return null; 
      }
      return rows[0];
    } catch (error) {
      console.error('Error fetching version:', error);
      const msg = error instanceof Error ? error.message : 'Failed to fetch version';
      throw new Error(`Failed to fetch version: ${msg}`);
    }
  }

  /**
   * Get the current version for a specific content
   */
  async getCurrentVersion(contentId: string, contentType: ContentType): Promise<Version | null> {
    const sql = `SELECT * FROM versions WHERE content_id = $1 AND content_type = $2 AND is_current = TRUE`;
    try {
      const { rows } = await query(sql, [contentId, contentType]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error fetching current version:', error);
      const msg = error instanceof Error ? error.message : 'Failed to fetch current version';
      throw new Error(`Failed to fetch current version: ${msg}`);
    }
  }

  /**
   * Update a version record
   */
  async updateVersion(versionId: string, updates: VersionUpdate): Promise<Version | null> {
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
    if (updates.content_snapshot !== undefined) {
      setClauses.push(`content_snapshot = $${paramCount++}`);
      values.push(updates.content_snapshot);
    }
    if (updates.metadata !== undefined) {
      setClauses.push(`metadata = $${paramCount++}`);
      values.push(updates.metadata || null);
    }
    if (updates.is_current !== undefined) {
      setClauses.push(`is_current = $${paramCount++}`);
      values.push(updates.is_current);
    }

    if (setClauses.length === 0) {
      return this.getVersion(versionId); // No updates provided
    }

    const sql = `
      UPDATE versions
      SET ${setClauses.join(', ')}
      WHERE id = $${paramCount++}
      RETURNING *;
    `;
    values.push(versionId);

    try {
      const { rows } = await query(sql, values);
      return rows[0] || null;
    } catch (error) {
      console.error('Error updating version:', error);
      const msg = error instanceof Error ? error.message : 'Failed to update version';
      throw new Error(`Failed to update version: ${msg}`);
    }
  }

  /**
   * Set a version as the current version for its content.
   * This involves two steps: 
   * 1. Set all other versions for this content_id/content_type to is_current = false.
   * 2. Set the specified versionId to is_current = true.
   * This should ideally be in a transaction.
   */
  async setAsCurrent(versionId: string): Promise<Version | null> {
    const versionToSetCurrent = await this.getVersion(versionId);
    if (!versionToSetCurrent) {
      throw new Error('Version to set as current not found');
    }

    const { content_id, content_type } = versionToSetCurrent;

    // Use the imported dbPool directly for transaction control
    const client = await dbPool.connect();

    try {
      await client.query('BEGIN');

      // Step 1: Set all other versions for this content to is_current = false
      const updateOthersSql = `
        UPDATE versions
        SET is_current = FALSE
        WHERE content_id = $1 AND content_type = $2 AND id != $3;
      `;
      await client.query(updateOthersSql, [content_id, content_type, versionId]);

      // Step 2: Set the specified version to is_current = true
      const setCurrentSql = `
        UPDATE versions
        SET is_current = TRUE
        WHERE id = $1
        RETURNING *;
      `;
      const { rows } = await client.query(setCurrentSql, [versionId]);
      
      await client.query('COMMIT');
      return rows[0] || null;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error setting version as current (transaction rolled back):', error);
      const msg = error instanceof Error ? error.message : 'Failed to set version as current';
      throw new Error(`Failed to set version as current: ${msg}`);
    } finally {
      client.release();
    }
  }

  /**
   * Delete a version record
   */
  async deleteVersion(versionId: string): Promise<boolean> {
    const sql = `DELETE FROM versions WHERE id = $1`;
    try {
      const result = await query(sql, [versionId]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting version:', error);
      const msg = error instanceof Error ? error.message : 'Failed to delete version';
      throw new Error(`Failed to delete version: ${msg}`);
    }
  }

  /**
   * Compare two versions and return the differences
   * This method is pure JavaScript and does not need changes for DB migration.
   */
  compareVersions(version1: Version, version2: Version): Record<string, any> {
    const v1 = version1.content_snapshot as Record<string, any>;
    const v2 = version2.content_snapshot as Record<string, any>;

    const differences: Record<string, any> = {};

    // Find all keys from both objects
    const allKeys = new Set([...Object.keys(v1), ...Object.keys(v2)]);

    // Compare each key
    allKeys.forEach(key => {
      // If key exists in both objects but values are different
      if (key in v1 && key in v2 && JSON.stringify(v1[key]) !== JSON.stringify(v2[key])) {
        differences[key] = {
          previous: v1[key],
          current: v2[key]
        };
      }
      // If key exists only in version1
      else if (key in v1 && !(key in v2)) {
        differences[key] = {
          previous: v1[key],
          current: undefined
        };
      }
      // If key exists only in version2
      else if (!(key in v1) && key in v2) {
        differences[key] = {
          previous: undefined,
          current: v2[key]
        };
      }
    });

    return differences;
  }
}

// Export an instance of the service
const versionService = new VersionService();
export default versionService; 