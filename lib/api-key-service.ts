import supabase from './supabase'
import type { Database } from '@/types/supabase'
import { AIProvider, providers } from './ai-config'
import logger from './logger'

// Type definitions for API keys
export type ApiKey = Database['public']['Tables']['api_keys']['Row']
export type ApiKeyInsert = Database['public']['Tables']['api_keys']['Insert']
export type ApiKeyUpdate = Database['public']['Tables']['api_keys']['Update']

// Simple encryption - in a real app, use a secure method
const encryptApiKey = (key: string): string => {
  // For demo purposes, this is a simple obfuscation - not actual encryption
  // In production, use a proper encryption method with a secure key or a server-side API
  return btoa(key)
}

// Simple decryption - in a real app, use a secure method
const decryptApiKey = (encryptedKey: string): string => {
  // For demo purposes, this is a simple deobfuscation
  // In production, use a proper decryption method
  return atob(encryptedKey)
}

export const ApiKeyService = {
  /**
   * Get all API keys for a user
   */
  async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) {
      logger.error({ error }, 'Error fetching API keys')
      throw error
    }
    
    return data || []
  },
  
  /**
   * Get a provider's API key for a user
   */
  async getProviderApiKey(userId: string, provider: AIProvider): Promise<string | null> {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error || !data) {
      // This is expected if no key exists
      return null
    }
    
    return decryptApiKey(data.api_key_encrypted)
  },
  
  /**
   * Create a new API key
   */
  async createApiKey(
    userId: string, 
    provider: AIProvider, 
    name: string, 
    apiKey: string
  ): Promise<ApiKey> {
    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        provider,
        name,
        api_key_encrypted: encryptApiKey(apiKey),
        is_active: true
      })
      .select()
      .single()
    
    if (error) {
      logger.error({ error }, 'Error creating API key')
      throw error
    }
    
    return data
  },
  
  /**
   * Update an API key
   */
  async updateApiKey(
    id: string, 
    updates: { name?: string; is_active?: boolean }
  ): Promise<ApiKey> {
    const { data, error } = await supabase
      .from('api_keys')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      logger.error({ error }, 'Error updating API key')
      throw error
    }
    
    return data
  },
  
  /**
   * Delete an API key
   */
  async deleteApiKey(id: string): Promise<void> {
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)
    
    if (error) {
      logger.error({ error }, 'Error deleting API key')
      throw error
    }
  },
  
  /**
   * Test if an API key is valid
   */
  async testApiKey(provider: AIProvider, apiKey: string): Promise<boolean> {
    // In a real app, you would call the respective API to validate the key
    // For this demo, we'll just simulate validation
    
    // Simulate API validation with a delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // For demo, consider any key valid if it's not empty and at least 10 chars
    return !!apiKey && apiKey.length >= 10
  }
} 