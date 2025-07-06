import { query, dbPool } from './db'; // Import PG query function and pool for transactions
import logger from './logger'
// import supabase from './supabase' // REMOVE
// import type { Database } from '@/types/supabase' // REMOVE
// import { AIProvider } from './ai-config' // Likely not used directly after refactor

// --- Local Type Definitions ---
export interface AgentPreset {
  id: string; // uuid
  name: string;
  description: string;
  base_prompt: string;
  category: PresetCategory; // Use the existing PresetCategory type
  recommended_model: string;
  recommended_provider: string; // Replaced AIProvider with string for DB compatibility
  icon: string;
  temperature?: number | null;
  memory_toggle?: boolean | null;
  tone?: string | null;
  tags?: string[] | null; // JSONB in DB
  is_system: boolean;
  user_id?: string | null; // uuid
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

export interface AgentPresetInsert {
  name: string;
  description: string;
  base_prompt: string;
  category: PresetCategory;
  recommended_model: string;
  recommended_provider: string;
  icon: string;
  temperature?: number | null;
  memory_toggle?: boolean | null;
  tone?: string | null;
  tags?: string[] | null;
  is_system?: boolean; // Default is false in DB
  user_id?: string | null;
}

export interface AgentPresetUpdate {
  name?: string;
  description?: string;
  base_prompt?: string;
  category?: PresetCategory;
  recommended_model?: string;
  recommended_provider?: string;
  icon?: string;
  temperature?: number | null;
  memory_toggle?: boolean | null;
  tone?: string | null;
  tags?: string[] | null;
  is_system?: boolean;
  // user_id is generally not updatable directly
}
// --- End Local Type Definitions ---

// Remove old Supabase types
// export type AgentPreset = Database['public']['Tables']['agent_presets']['Row']
// export type AgentPresetInsert = Database['public']['Tables']['agent_presets']['Insert']
// export type AgentPresetUpdate = Database['public']['Tables']['agent_presets']['Update']

// Preset categories (Keep existing PresetCategory type)
export type PresetCategory = 
  | 'writing' 
  | 'coding' 
  | 'research' 
  | 'creative' 
  | 'business' 
  | 'education' 
  | 'personal' 
  | 'system' 
  | 'custom';

// Template object for predefined presets (Keep existing PresetTemplate, adjust provider type)
export interface PresetTemplate {
  name: string;
  description: string;
  base_prompt: string;
  category: PresetCategory;
  recommended_model: string;
  recommended_provider: string; // Was AIProvider, now string to match DB and AgentPresetInsert
  icon: string;
  temperature?: number;
  memory_toggle?: boolean;
  tone?: string;
  tags?: string[];
}

/**
 * Agent Preset Service - manages predefined and custom agent presets
 */
export const AgentPresetService = {
  async getUserPresets(userId: string): Promise<AgentPreset[]> {
    const sql = `
      SELECT * FROM agent_presets 
      WHERE user_id = $1 OR is_system = TRUE 
      ORDER BY created_at DESC;
    `;
    try {
      const { rows } = await query(sql, [userId]);
      return rows;
    } catch (error) {
      logger.error({ error }, 'Error fetching agent presets');
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch agent presets');
    }
  },
  
  async getSystemPresets(): Promise<AgentPreset[]> {
    const sql = `SELECT * FROM agent_presets WHERE is_system = TRUE ORDER BY name ASC;`;
    try {
      const { rows } = await query(sql);
      return rows;
    } catch (error) {
      logger.error({ error }, 'Error fetching system presets');
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch system presets');
    }
  },
  
  async getPreset(presetId: string): Promise<AgentPreset | null> {
    const sql = `SELECT * FROM agent_presets WHERE id = $1;`;
    try {
      const { rows } = await query(sql, [presetId]);
      return rows[0] || null;
    } catch (error) {
      logger.error({ error }, 'Error fetching preset');
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch preset');
    }
  },
  
  async createPreset(preset: AgentPresetInsert): Promise<AgentPreset> {
    const sql = `
      INSERT INTO agent_presets (
        name, description, base_prompt, category, recommended_model, 
        recommended_provider, icon, temperature, memory_toggle, tone, tags, 
        is_system, user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *;
    `;
    try {
      const { rows } = await query(sql, [
        preset.name,
        preset.description,
        preset.base_prompt,
        preset.category,
        preset.recommended_model,
        preset.recommended_provider,
        preset.icon,
        preset.temperature === undefined ? 0.5 : preset.temperature,
        preset.memory_toggle === undefined ? false : preset.memory_toggle,
        preset.tone === undefined ? 'neutral' : preset.tone,
        JSON.stringify(preset.tags || []),
        preset.is_system === undefined ? false : preset.is_system,
        preset.user_id || null
      ]);
      if (!rows[0]) {
        throw new Error('Failed to create agent preset, no data returned.');
      }
      return rows[0];
    } catch (error) {
      logger.error({ error }, 'Error creating agent preset');
      throw new Error(error instanceof Error ? error.message : 'Failed to create agent preset');
    }
  },
  
  async updatePreset(presetId: string, updates: AgentPresetUpdate): Promise<AgentPreset | null> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if ((updates as any)[key] !== undefined) {
        if (key === 'tags') {
          setClauses.push(`${key} = $${paramCount++}`);
          values.push(JSON.stringify((updates as any)[key]));
        } else {
          setClauses.push(`${key} = $${paramCount++}`);
          values.push((updates as any)[key]);
        }
      }
    });

    if (setClauses.length === 0) {
      return this.getPreset(presetId);
    }

    setClauses.push(`updated_at = current_timestamp`);

    const sql = `
      UPDATE agent_presets
      SET ${setClauses.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *;
    `;
    values.push(presetId);

    try {
      const { rows } = await query(sql, values);
      return rows[0] || null;
    } catch (error) {
      logger.error({ error }, 'Error updating agent preset');
      throw new Error(error instanceof Error ? error.message : 'Failed to update agent preset');
    }
  },

  async deletePreset(presetId: string, userId: string): Promise<boolean> {
    // This method allows a user to delete their own non-system presets.
    // Deleting system presets (is_system = TRUE) should be handled by an admin-specific function/route.
    const sql = `
      DELETE FROM agent_presets 
      WHERE id = $1 AND user_id = $2 AND is_system = FALSE 
      RETURNING id;
    `;
    try {
      const { rowCount } = await query(sql, [presetId, userId]);
      return rowCount !== null && rowCount > 0;
    } catch (error) {
      logger.error({ error }, 'Error deleting agent preset');
      throw new Error(error instanceof Error ? error.message : 'Failed to delete agent preset');
    }
  },

  async userHasAccessToPreset(userId: string, presetId: string): Promise<boolean> {
    const sql = `
      SELECT id FROM agent_presets 
      WHERE id = $1 AND (user_id = $2 OR is_system = TRUE);
    `;
    try {
      const { rows } = await query(sql, [presetId, userId]);
      return rows.length > 0;
    } catch (error) {
      logger.error({ error }, 'Error checking preset access');
      return false; 
    }
  },

  getPredefinedPresets(): PresetTemplate[] {
    return [
      {
        name: 'Research Assistant',
        description: 'Conducts comprehensive research on topics, synthesizes information, and provides well-organized findings',
        base_prompt: `You are a Research Assistant. Your primary goal is to help me with comprehensive research on topics I provide. Please follow these guidelines:\n1. Provide factual, well-organized information based on credible sources\n2. Structure your response with clear headings and sections\n3. Highlight key findings and important insights\n4. Approach topics with academic rigor and attention to detail\n5. Note any significant controversies or conflicting viewpoints\n6. Acknowledge limitations in current knowledge where relevant\n7. Suggest further areas for investigation\n\nRespond in a clear, informative style that emphasizes accuracy and comprehensiveness. Maintain a neutral perspective and present multiple viewpoints on controversial topics.`,
        category: 'research',
        recommended_model: 'claude-3-opus',
        recommended_provider: 'anthropic',
        icon: 'search',
        temperature: 0.1,
        memory_toggle: true,
        tone: 'academic'
      },
      {
        name: 'Data Analyst',
        description: 'Analyzes data, identifies patterns and trends, and presents insights with clear explanations',
        base_prompt: `You are a Data Analyst. Your primary goal is to analyze information, identify patterns, and provide clear insights. Please follow these guidelines:\n1. Interpret data patterns and trends from the information provided\n2. Identify correlations, causations, and anomalies when possible`,
        category: 'research',
        recommended_model: 'gpt-4-turbo',
        recommended_provider: 'openai',
        icon: 'bar_chart',
        temperature: 0.3,
        memory_toggle: true,
        tone: 'analytical'
      },
      // Add other predefined presets here if they were in the original service
    ];
  },

  async initializeSystemPresets(): Promise<void> {
    const poolClient = await dbPool.connect(); // Use a client for transaction
    try {
      await poolClient.query('BEGIN');

      const { rows: existingSystemPresets } = await poolClient.query(
        'SELECT id FROM agent_presets WHERE is_system = TRUE LIMIT 1;'
      );

      if (existingSystemPresets.length > 0) {
        logger.info('System presets already initialized.')
        await poolClient.query('COMMIT');
        return;
      }

      const presetTemplates = this.getPredefinedPresets();
      if (presetTemplates.length === 0) {
        logger.info('No predefined system presets to initialize.')
        await poolClient.query('COMMIT');
        return;
      }

      const insertClauses: string[] = [];
      const values: any[] = [];
      
      for (const template of presetTemplates) {
        const rowValues = [
          template.name,
          template.description,
          template.base_prompt,
          template.category,
          template.recommended_model,
          template.recommended_provider,
          template.icon,
          template.temperature === undefined ? 0.5 : template.temperature,
          template.memory_toggle === undefined ? false : template.memory_toggle,
          template.tone === undefined ? 'neutral' : template.tone,
          JSON.stringify(template.tags || []),
          true, // is_system
          null  // user_id for system presets
        ];
        insertClauses.push(
          `(${rowValues.map((_, i) => `$${values.length + i + 1}`).join(', ')})`
        );
        values.push(...rowValues);
      }

      const sql = `
        INSERT INTO agent_presets (
          name, description, base_prompt, category, recommended_model, 
          recommended_provider, icon, temperature, memory_toggle, tone, tags, 
          is_system, user_id
        )
        VALUES ${insertClauses.join(', ')};
      `; // No RETURNING needed here as we are just inserting

      await poolClient.query(sql, values)
      logger.info(`Initialized ${presetTemplates.length} system presets.`)
      await poolClient.query('COMMIT');

    } catch (error) {
      await poolClient.query('ROLLBACK');
      logger.error({ error }, 'Failed to initialize system presets');
      // Potentially re-throw or handle error appropriately for application startup
      throw new Error(error instanceof Error ? error.message : 'Failed to initialize system presets');
    } finally {
      poolClient.release();
    }
  }
}; 