import { query } from './db' // Import our PostgreSQL query function
import logger from './logger'
// import supabase from './supabase' // Removed Supabase
// import { Database, Json } from '@/types/supabase' // Removed Supabase types
import OpenAI from 'openai'
// import { env } from './env' // Assuming env is for OpenAI key, might need to re-verify its usage or direct process.env
import versionService from './version-service'
import type { Version } from './version-service' // Ensure Version type is available
// import { SupabaseClient, createClient } from '@supabase/supabase-js' // Removed Supabase

// Define local Context type based on our schema
export interface Context {
  id: string; // uuid
  project_id: string; // uuid
  user_id: string; // text
  name: string; // varchar(255)
  content?: string | null; // text
  digest?: string | null; // text
  metadata?: ContextMetadata | null; // Added metadata
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

// For create and update, we'll simplify for now and add metadata later
export interface ContextCreate {
  project_id: string;
  user_id: string;
  name: string;
  content?: string | null;
  digest?: string | null;
  metadata?: ContextMetadata | null; // Added metadata
}

export interface ContextUpdate {
  name?: string;
  content?: string | null;
  digest?: string | null;
  metadata?: ContextMetadata | null; // Added metadata
}

export type ContextCategory = 'documentation' | 'research' | 'notes' | 'meeting' | 'reference' | 'other';
export type ContextTag = string;

// Metadata interface for context - compatible with Json type
// We'll keep this definition for when we re-implement metadata features
export interface ContextMetadata extends Record<string, any | undefined> { // Changed Json to any for broader compatibility initially
  category?: ContextCategory;
  tags?: string[];
  shared_from?: string;
  references?: string[];
  last_accessed?: string;
  access_count?: number;
}

/**
 * Context-related database operations and markdown processing
 */
export const ContextService = {
  /**
   * Get all contexts for a specific project
   */
  async getProjectContexts(projectId: string): Promise<Context[]> {
    const sql = `SELECT * FROM contexts WHERE project_id = $1 ORDER BY created_at DESC`;
    try {
      const { rows } = await query(sql, [projectId]);
      return rows;
    } catch (error) {
      logger.error({ error }, 'Error fetching contexts');
      throw new Error('Failed to fetch contexts');
    }
  },
  
  /**
   * Get contexts for a project with filtering and search (Simplified for now)
   */
  async searchProjectContexts(
    projectId: string,
    options?: {
      search?: string;
      categories?: ContextCategory[];
      tags?: string[];
      limit?: number;
      offset?: number;
    }
  ): Promise<{ contexts: Context[]; total: number }> {
    let conditions: string[] = [`project_id = $1`];
    const params: any[] = [projectId];
    let paramIndex = 2; // Start indexing from $2 for additional params

    if (options?.search) {
      conditions.push(`(name ILIKE $${paramIndex} OR content ILIKE $${paramIndex})`);
      params.push(`%${options.search}%`);
      paramIndex++;
    }

    if (options?.categories && options.categories.length > 0) {
      const categoryConditions = options.categories.map(cat => {
        params.push(cat);
        return `metadata->>'category' = $${paramIndex++}`;
      });
      conditions.push(`(${categoryConditions.join(' OR ')})`);
    }

    if (options?.tags && options.tags.length > 0) {
      // Using @> operator for JSONB array containment: metadata->'tags' @> '["tag1", "tag2"]'::jsonb
      // This requires each tag to be present. For OR logic (any tag matches):
      const tagConditions = options.tags.map(tag => {
        params.push(tag);
        return `metadata->'tags' @> '["${paramIndex++}"]'::jsonb`; // This is incorrect for single tag, needs adjustment
        // Correct for single tag: metadata->'tags' ? $${paramIndex++}
        // For contains ANY of the tags (more complex, might need unnest or multiple ORs with ?)
        // Let's simplify to exact match of one tag for now for demonstration, or an array of tags.
        // For checking if a JSONB array contains a specific string value:
        // metadata->'tags' ? $${paramIndex++} (where param is the tag string)
      });
      // A simpler and often effective way for tags is to check for presence of any tag in the list:
      // This example assumes you want contexts that have AT LEAST ONE of the specified tags.
      const tagPlaceholders = options.tags.map(() => `$${paramIndex++}`).join(', ');
      conditions.push(`EXISTS (SELECT 1 FROM jsonb_array_elements_text(metadata->'tags') AS t(tag) WHERE t.tag IN (${tagPlaceholders}))`);
      params.push(...options.tags);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const baseQuery = `FROM contexts ${whereClause}`;
    const dataSql = `SELECT * ${baseQuery} ORDER BY created_at DESC` +
                  (options?.limit ? ` LIMIT $${paramIndex++}` : '') +
                  (options?.offset ? ` OFFSET $${paramIndex++}` : '');
    if(options?.limit) params.push(options.limit);
    if(options?.offset) params.push(options.offset);

    const countSql = `SELECT COUNT(*) ${baseQuery}`;
    // Parameters for countSql need to be distinct from dataSql limit/offset params
    const countParams = params.slice(0, options?.limit ? -1 : params.length);
    if(options?.limit && options?.offset) countParams.pop(); // remove offset if limit was also there

    try {
      const { rows } = await query(dataSql, params);
      const countResult = await query(countSql, countParams.slice(0, paramIndex - (options?.limit ? 1:0) - (options?.offset ? 1:0) ) ); // Adjust countParams carefully
      const total = parseInt(countResult.rows[0].count, 10) || 0;
      return { contexts: rows, total };
    } catch (error) {
      logger.error({ error }, 'Error searching contexts');
      throw new Error('Failed to search contexts');
    }
  },
  
  /**
   * Get a single context by ID
   */
  async getContext(contextId: string): Promise<Context | null> {
    const sql = `SELECT * FROM contexts WHERE id = $1`;
    try {
      const { rows } = await query(sql, [contextId]);
      return rows[0] || null;
    } catch (error) {
      logger.error({ error }, 'Error fetching context');
      throw new Error('Failed to fetch context');
    }
  },
  
  /**
   * Get multiple contexts by their IDs, ensuring they belong to the user.
   */
  async getContextsByIds(contextIds: string[], userId: string): Promise<Context[]> {
    if (!contextIds || contextIds.length === 0) {
      return [];
    }
    // Ensure user ownership for the fetched contexts.
    // This query fetches contexts that match the provided IDs AND belong to the specified user.
    const sql = `SELECT * FROM contexts WHERE id = ANY($1::uuid[]) AND user_id = $2 ORDER BY created_at DESC`;
    try {
      const { rows } = await query(sql, [contextIds, userId]);
      return rows;
    } catch (error) {
      logger.error({ userId, error }, 'Error fetching contexts by IDs');
      throw new Error('Failed to fetch contexts by IDs');
    }
  },
  
  /**
   * Create a new context
   */
  async createContext(
    context: ContextCreate
  ): Promise<Context> {
    const sql = `
      INSERT INTO contexts (project_id, user_id, name, content, digest, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    try {
      const { rows } = await query(sql, [
        context.project_id,
        context.user_id,
        context.name,
        context.content || null,
        context.digest || null,
        context.metadata || null, // Added metadata
      ]);
      return rows[0];
    } catch (error) {
      logger.error({ error }, 'Error creating context');
      const errorMessage = error instanceof Error ? error.message : 'Failed to create context';
      throw new Error(errorMessage);
    }
  },
  
  /**
   * Update an existing context
   */
  async updateContext(
    contextId: string,
    updates: ContextUpdate
  ): Promise<Context | null> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      setClauses.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.content !== undefined) {
      setClauses.push(`content = $${paramCount++}`);
      values.push(updates.content || null);
    }
    if (updates.digest !== undefined) {
      setClauses.push(`digest = $${paramCount++}`);
      values.push(updates.digest || null);
    }
    if (updates.metadata !== undefined) { // Added metadata update
      setClauses.push(`metadata = $${paramCount++}`);
      values.push(updates.metadata || null);
    }

    if (setClauses.length === 0) {
      return this.getContext(contextId); // Or throw error if no updates
    }

    setClauses.push(`updated_at = current_timestamp`);
    const sql = `
      UPDATE contexts
      SET ${setClauses.join(', ')}
      WHERE id = $${paramCount++}
      RETURNING *;
    `;
    values.push(contextId);

    try {
      const { rows } = await query(sql, values);
      return rows[0] || null;
    } catch (error) {
      logger.error({ error }, 'Error updating context');
      const errorMessage = error instanceof Error ? error.message : 'Failed to update context';
      throw new Error(errorMessage);
    }
  },
  
  /**
   * Delete a context
   */
  async deleteContext(contextId: string): Promise<boolean> {
    const sql = `DELETE FROM contexts WHERE id = $1`;
    try {
      const result = await query(sql, [contextId]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      logger.error({ error }, 'Error deleting context');
      throw new Error('Failed to delete context');
    }
  },

  /**
   * Check if a user has access to a context
   */
  async userHasAccessToContext(userId: string, contextId: string): Promise<boolean> {
    const sql = `SELECT id FROM contexts WHERE id = $1 AND user_id = $2`;
    try {
      const { rows } = await query(sql, [contextId, userId]);
      return rows.length > 0;
    } catch (error) {
      logger.error({ error }, 'Error checking context access');
      return false;
    }
  },

  /**
   * Duplicate a context into another project owned by the user.
   */
  async shareContext(
    contextId: string,
    targetProjectId: string,
    userId: string
  ): Promise<Context> {
    const context = await this.getContext(contextId)
    if (!context) throw new Error('Context not found')
    if (context.user_id !== userId)
      throw new Error('Permission denied for sharing context')

    return this.createContext({
      project_id: targetProjectId,
      user_id: userId,
      name: context.name,
      content: context.content,
      digest: context.digest,
      metadata: context.metadata ?? null
    })
  },


  /**
   * Get all unique tags for a specific project, for contexts owned by the user.
   */
  async getProjectTags(projectId: string, userId: string): Promise<string[]> {
    const sql = `
      SELECT DISTINCT tag
      FROM contexts,
           jsonb_array_elements_text(metadata->'tags') AS tag
      WHERE project_id = $1 AND user_id = $2 AND metadata->'tags' IS NOT NULL;
    `;
    try {
      const { rows } = await query(sql, [projectId, userId]);
      return rows.map(row => row.tag);
    } catch (error) {
      logger.error({ error }, 'Error fetching project tags');
      throw new Error('Failed to fetch project tags');
    }
  },

  // For digestToMarkdown, suggestMetadata - these use OpenAI and don't directly rely on Supabase DB client for the core logic.
  // They might need adjustments if they were previously Supabase Edge Functions or relied on Supabase-specific user context.
  // Assuming OpenAI client is initialized elsewhere or directly using API key.
  // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async digestToMarkdown(content: string, title: string): Promise<string> {
    logger.warn('digestToMarkdown: Review OpenAI integration and ensure env vars (OPENAI_API_KEY) are loaded.');
    if (!process.env.OPENAI_API_KEY) {
        logger.error('OpenAI API key not found.');
        return `# ${title}\n\n(OpenAI API key not configured. Digest not available.)\n\n${content.substring(0, 200)}...`;
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // Cheaper model for digestion
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant. Summarize the provided text into a concise digest, formatted in Markdown."
                },
                {
                    role: "user",
                    content: `Title: "${title}"\n\nContent:\n${content}`
                }
            ],
            temperature: 0.5,
            max_tokens: 500,
        });
        return response.choices[0]?.message?.content || `# ${title}\n\n(Error generating digest)\n\n${content.substring(0,200)}...`;
    } catch (error) {
        logger.error({ error }, 'Error calling OpenAI for digest');
        return `# ${title}\n\n(Error generating digest: ${error instanceof Error ? error.message : 'Unknown error'})\n\n${content.substring(0,200)}...`;
    }
  },
  
  formatMarkdown(content: string, title: string): string {
    // This method seems to be pure string manipulation, likely no changes needed.
    return `# ${title}\n\n${content}`;
  },
  
  async combineProjectContexts(projectId: string): Promise<string> {
    logger.warn('combineProjectContexts: Fetching contexts using new service method.');
    const contexts = await this.getProjectContexts(projectId);
    if (!contexts || contexts.length === 0) return "No contexts found for this project.";
    return contexts.map(ctx => `# ${ctx.name}\n${ctx.content || ''}`).join('\n\n---\n\n');
  },

  async suggestMetadata(content: string, title: string): Promise<{
    suggestedCategory: ContextCategory,
    suggestedTags: string[]
  }> {
    logger.warn('suggestMetadata: Review OpenAI integration.');
     if (!process.env.OPENAI_API_KEY) {
        logger.error('OpenAI API key not found for metadata suggestion.');
        return { suggestedCategory: 'other', suggestedTags: [] };
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are an assistant that suggests a category and relevant tags for a given text. Categories are: documentation, research, notes, meeting, reference, other. Provide 3-5 relevant tags as a JSON array of strings."
                },
                {
                    role: "user",
                    content: `Title: "${title}"\n\nContent:\n${content}\n\nSuggest a category and 3-5 tags. Respond in JSON format: {"category": "your_category", "tags": ["tag1", "tag2"]}`
                }
            ],
            temperature: 0.7,
            max_tokens: 150,
            response_format: { type: "json_object" },
        });
        const result = JSON.parse(response.choices[0]?.message?.content || '{}');
        return {
             suggestedCategory: result.category || 'other',
             suggestedTags: result.tags || []
        };
    } catch (error) {
        logger.error({ error }, 'Error calling OpenAI for metadata suggestion');
        return { suggestedCategory: 'other', suggestedTags: [] };
    }
  },

  // async exportContext(contextId: string, format: 'markdown' | 'pdf' | 'html'): Promise<{ data: string | Blob, filename: string }> {
  //   console.warn('exportContext not implemented yet for PostgreSQL');
  //   throw new Error('Not implemented');
  // },

  // --- Versioning methods (using refactored versionService) ---
  async createVersion(
    contextId: string,
    versionName: string,
    userId: string, // Added userId for version ownership
    description?: string,
    projectId?: string, // Added projectId
    metadata?: { tags?: string[], [key: string]: any }
  ): Promise<Version> {
    const context = await this.getContext(contextId);
    if (!context) throw new Error('Context not found for versioning');

    return versionService.createVersion({
      name: versionName,
      description,
      content_id: contextId,
      content_type: 'context',
      content_snapshot: context, // Snapshot the whole context object
      metadata,
      project_id: projectId || context.project_id, // Use context's project_id if not provided
      user_id: userId,
      is_current: true, // New versions are typically set as current
    });
  },

  async getContextVersions(contextId: string): Promise<Version[]> {
    return versionService.getVersionsByContent(contextId, 'context');
  },

  async getCurrentContextVersion(contextId: string): Promise<Version | null> {
    return versionService.getCurrentVersion(contextId, 'context');
  },

  async restoreVersion(contextId: string, versionId: string, userId: string): Promise<Context | null> {
    const versionToRestore = await versionService.getVersion(versionId);
    if (!versionToRestore || versionToRestore.content_id !== contextId || versionToRestore.content_type !== 'context') {
      throw new Error('Version not found or does not belong to this context');
    }

    const snapshot = versionToRestore.content_snapshot as Context;
    // Update the main context record from the snapshot
    // We need to be careful what fields from snapshot are applied. Name, content, metadata are primary.
    const updatedContext = await this.updateContext(contextId, {
      name: snapshot.name,
      content: snapshot.content,
      metadata: snapshot.metadata,
      // digest might need to be regenerated or taken from snapshot if present
    });

    if (updatedContext) {
      await versionService.setAsCurrent(versionId); // Mark this version as current
    }
    return updatedContext;
  },

  async updateContextWithVersion(
    contextId: string,
    userId: string, // Required for creating a new version
    updates: ContextUpdate,
    versionOptions?: {
      createVersion?: boolean;
      versionName?: string;
      versionDescription?: string;
      versionMetadata?: { tags?: string[]; [key: string]: any };
    }
  ): Promise<{ context: Context | null; version?: Version }> {
    const updatedContext = await this.updateContext(contextId, updates);
    let newVersion: Version | undefined;

    if (updatedContext && versionOptions?.createVersion !== false) {
      newVersion = await this.createVersion(
        contextId,
        versionOptions?.versionName || `Update - ${new Date().toISOString()}`,
        userId,
        versionOptions?.versionDescription,
        updatedContext.project_id, // Pass project_id from the updated context
        versionOptions?.versionMetadata
      );
    }
    return { context: updatedContext, version: newVersion };
  }
}; 