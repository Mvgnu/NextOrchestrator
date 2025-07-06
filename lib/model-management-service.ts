import { query } from './db'
import { AxiosError } from 'axios' // For type checking if using Axios for HTTP calls
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import logger from './logger'

// Corresponds to the 'auth_type_enum' in the database
export type AuthType = 'bearer' | 'x-api-key' | 'custom' | null;

// Interface for the 'providers' table
export interface Provider {
  id: string; // uuid
  name: string;
  api_base_url: string; // Should store base URL like https://api.openai.com/v1
  list_models_endpoint?: string | null; // e.g., /models. This might become less relevant with SDKs.
  get_model_endpoint?: string | null;
  auth_type?: AuthType;
  auth_header_name?: string | null; // e.g., Authorization for Bearer, X-API-Key for Anthropic
  api_key_env_var?: string | null; // New field: Name of the env var holding the API key
  docs_url?: string | null;
  notes?: string | null;
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

// Interface for the 'models' table
export interface Model {
  id: string; // uuid
  provider_id: string; // uuid, FK to providers
  model_id_on_provider: string; // The actual model ID string from the provider, e.g., "gpt-4", "claude-2"
  display_name: string; // User-friendly name, can be same as model_id_on_provider or more descriptive
  description?: string | null;
  context_length?: number | null; // Standardized field
  modality?: string | null; // e.g., "text", "image", "multimodal"
  pricing_info?: any | null; // jsonb
  is_active: boolean;
  raw_api_response?: any | null; // jsonb, store the original model object from provider
  created_at: string; // timestamptz
  updated_at: string; // timestamptz
}

export const ModelManagementService = {
  /**
   * Fetches all providers from the database.
   */
  async getAllProviders(): Promise<Provider[]> {
    const sql = `SELECT * FROM providers ORDER BY name ASC;`;
    try {
      const { rows } = await query(sql);
      return rows;
    } catch (error) {
      logger.error({ error }, 'Error fetching all providers')
      throw new Error('Failed to fetch providers.');
    }
  },

  /**
   * Fetches a single provider by its ID.
   */
  async getProviderById(providerId: string): Promise<Provider | null> {
    const sql = `SELECT * FROM providers WHERE id = $1;`;
    try {
      const { rows } = await query(sql, [providerId]);
      return rows[0] || null;
    } catch (error) {
      logger.error({ error }, `Error fetching provider by ID (${providerId})`)
      throw new Error('Failed to fetch provider details.');
    }
  },

  /**
   * Fetches all active models for a specific provider ID.
   */
  async getModelsForProvider(providerId: string): Promise<Model[]> {
    const sql = `SELECT * FROM models WHERE provider_id = $1 AND is_active = TRUE ORDER BY display_name ASC;`;
    try {
      const { rows } = await query(sql, [providerId]);
      return rows;
    } catch (error) {
      logger.error({ error }, `Error fetching models for provider ${providerId}`)
      throw new Error('Failed to fetch models for the provider.');
    }
  },

  /**
   * Fetches models from the provider's API and syncs them with the database.
   */
  async syncProviderModels(providerId: string): Promise<{ newModels: number; updatedModels: number; errors: string[] }> {
    logger.info(`Attempting to sync models for provider ID: ${providerId}`)
    const provider = await this.getProviderById(providerId);
    if (!provider) {
      throw new Error(`Provider with ID ${providerId} not found.`);
    }

    let newModelsCount = 0;
    let updatedModelsCount = 0;
    const processingErrors: string[] = [];
    let providerApiModels: any[] = [];

    // API Key Handling & SDK Usage
    const apiKeyEnvVar = provider.api_key_env_var;
    const apiKey = apiKeyEnvVar ? process.env[apiKeyEnvVar] : null;

    if (!apiKey) {
      const errorMsg = `${provider.name} API key environment variable (${apiKeyEnvVar || 'N/A'}) not set or key is missing.`;
      logger.warn(errorMsg)
      return { newModels: 0, updatedModels: 0, errors: [errorMsg] };
    }

    try {
      switch (provider.name) {
        case 'OpenAI':
          const openai = new OpenAI({ apiKey });
          const openAIModelsList = await openai.models.list();
        providerApiModels = openAIModelsList.data.map(model => ({
          id: model.id, // model_id_on_provider
          name: model.id, // display_name (can be refined)
            // OpenAI API does not provide context_window directly in models.list()
            // This might need to be hardcoded or fetched differently if available.
            // For simplicity, we'll leave context_length null for now unless hardcoded.
            // description: model.description, // usually not available or useful here
          raw: model,
        }));
        break;

        case 'Anthropic':
          logger.info(
            `Skipping API sync for ${provider.name}: Model listing via API is not standard. Ensure models are seeded or manually added.`
          );
          return { newModels: 0, updatedModels: 0, errors: [] };

        case 'Google':
        case 'DeepSeek':
        case 'xAI':
          if (provider.list_models_endpoint) {
            const fullApiUrl = `${provider.api_base_url}${provider.list_models_endpoint}`;
            const headers: Record<string, string> = {};
            if (provider.auth_header_name) {
              if (provider.auth_type === 'bearer') {
                headers[provider.auth_header_name] = `Bearer ${apiKey}`;
              } else {
                headers[provider.auth_header_name] = apiKey;
              }
            }
            const response = await fetch(fullApiUrl, { headers });
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(
                `Failed to fetch models from ${provider.name} API: ${response.status} ${response.statusText} - ${errorText}`
              );
            }
            const fetchedData = await response.json();
            providerApiModels = fetchedData.models || fetchedData.data || fetchedData;
            break;
          } else {
            logger.warn(
              `Provider ${provider.name} does not have a list_models_endpoint configured for generic HTTP fetching.`
            );
            return {
              newModels: 0,
              updatedModels: 0,
              errors: [`No list_models_endpoint for ${provider.name}`],
            };
          }

        default:
          logger.warn(`Model synchronization not implemented for provider: ${provider.name}`)
          return { newModels: 0, updatedModels: 0, errors: [`Sync for ${provider.name} not implemented.`] };
      }
    } catch (error: any) {
      logger.error({ error }, `Error fetching models via SDK/API for ${provider.name}`)
      processingErrors.push(`API error for ${provider.name}: ${error.message}`);
      return { newModels: 0, updatedModels: 0, errors: processingErrors };
    }
    
    // --- Data Normalization & Upsert Logic ---
    for (const apiClientModel of providerApiModels) {
      const modelIdOnProvider = apiClientModel.id;
      if (!modelIdOnProvider) {
        processingErrors.push(`Skipping model due to missing ID: ${JSON.stringify(apiClientModel)}`);
        continue;
      }

      const displayName = apiClientModel.name || modelIdOnProvider;
      // For OpenAI, context_length, description, modality are not directly in the list.
      // These might need to be manually curated or enhanced later.
      // For now, we'll insert what we have.
      const description = apiClientModel.description || null;
      const contextLength = apiClientModel.context_length || null; // Will be null for OpenAI from list
      const modality = apiClientModel.modality || 'text'; // Default or parse if available
      const rawApiResponse = apiClientModel.raw || apiClientModel;

      const upsertSql = `
        INSERT INTO models (
          provider_id, model_id_on_provider, display_name, description,
          context_length, modality, raw_api_response, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
        ON CONFLICT (provider_id, model_id_on_provider) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          description = EXCLUDED.description,
          context_length = EXCLUDED.context_length,
          modality = EXCLUDED.modality,
          raw_api_response = EXCLUDED.raw_api_response,
          is_active = TRUE, -- Ensure it's active on update
          updated_at = current_timestamp
        RETURNING id, (xmax = 0) AS is_insert; -- xmax = 0 indicates an insert
      `;

      try {
        const { rows: upsertRows } = await query(upsertSql, [
          providerId,
          modelIdOnProvider,
          displayName,
          description,
          contextLength,
          modality,
          JSON.stringify(rawApiResponse)
        ]);
        if (upsertRows[0]) {
          if (upsertRows[0].is_insert) {
            newModelsCount++;
          } else {
            updatedModelsCount++;
          }
        }
      } catch (dbError: any) {
        logger.error({ dbError }, `DB Error syncing model ${modelIdOnProvider} for ${provider.name}`)
        processingErrors.push(`DB error for ${modelIdOnProvider}: ${dbError.message}`);
      }
    }
    // --- End Data Normalization & Upsert Logic ---

    logger.info(`Sync completed for ${provider.name}. New: ${newModelsCount}, Updated: ${updatedModelsCount}, Errors: ${processingErrors.length}`)
    return { newModels: newModelsCount, updatedModels: updatedModelsCount, errors: processingErrors };
  },

  /**
   * Helper to sync models for ALL providers that have an api_key_env_var defined.
   */
  async syncAllProvidersModels(): Promise<any[]> {
    const providers = await this.getAllProviders();
    const results = [];
    for (const provider of providers) {
      if (provider.api_key_env_var) { // Only attempt to sync if an API key env var is specified
        logger.info(`Syncing models for ${provider.name} (ID: ${provider.id})`)
        try {
          const result = await this.syncProviderModels(provider.id);
          results.push({ provider_name: provider.name, ...result });
        } catch (error: any) {
          logger.error({ error }, `Error during sync process for provider ${provider.name}`)
          results.push({ provider_name: provider.name, newModels: 0, updatedModels: 0, errors: [error.message || 'Unknown error during sync trigger'] });
        }
      } else {
        logger.info(`Skipping model sync for ${provider.name} (ID: ${provider.id}) as no api_key_env_var is defined.`)
        results.push({ provider_name: provider.name, newModels: 0, updatedModels: 0, errors: ['No api_key_env_var defined, sync skipped.'] });
      }
    }
    return results;
  }
}; 