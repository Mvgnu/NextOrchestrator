import { AIProvider } from './ai-config'
import { ApiUsageService } from './api-usage-service'
import logger from './logger'

// Error types for different providers
export enum ApiErrorType {
  RATE_LIMIT = 'rate_limit',
  QUOTA_EXCEEDED = 'quota_exceeded',
  INVALID_API_KEY = 'invalid_api_key',
  MODEL_UNAVAILABLE = 'model_unavailable',
  BAD_REQUEST = 'bad_request',
  TIMEOUT = 'timeout',
  CONTENT_FILTER = 'content_filter',
  UNKNOWN = 'unknown'
}

// Structure for API error info
export interface ApiErrorInfo {
  type: ApiErrorType
  message: string
  provider: AIProvider
  model: string
  retryable: boolean
  retryAfter?: number // in milliseconds
}

// Rate limit tracking to prevent excessive retries
interface RateLimitTracker {
  provider: AIProvider
  model?: string
  limitReachedAt: number
  retryAfter: number
}

// In-memory cache for rate limit status
const rateLimitCache: RateLimitTracker[] = []

/**
 * Service for handling API errors, rate limits and providing fallback options
 */
export const ApiErrorHandler = {
  /**
   * Parse an error from any provider into a standardized format
   */
  parseProviderError(error: any, provider: AIProvider, model: string): ApiErrorInfo {
    // Default error info
    const defaultError: ApiErrorInfo = {
      type: ApiErrorType.UNKNOWN,
      message: error.message || 'Unknown API error',
      provider,
      model,
      retryable: false
    }
    
    // Parse OpenAI errors
    if (provider === 'openai') {
      return this.parseOpenAIError(error, model)
    }
    
    // Parse Anthropic errors
    if (provider === 'anthropic') {
      return this.parseAnthropicError(error, model)
    }
    
    // Parse Google errors
    if (provider === 'google') {
      return this.parseGoogleError(error, model)
    }
    
    // Return default error for unknown providers
    return defaultError
  },
  
  /**
   * Parse OpenAI-specific errors
   */
  parseOpenAIError(error: any, model: string): ApiErrorInfo {
    const status = error.status || error.statusCode || 0
    const errorType = error.type || ''
    const errorCode = error.code || ''
    const message = error.message || 'Unknown OpenAI error'
    
    // Rate limit errors
    if (status === 429 || errorType === 'rate_limit_exceeded') {
      const retryAfter = error.headers?.['retry-after']
        ? parseInt(error.headers['retry-after']) * 1000
        : 60000 // Default to 60 seconds
      
      return {
        type: ApiErrorType.RATE_LIMIT,
        message: 'OpenAI rate limit exceeded',
        provider: 'openai',
        model,
        retryable: true,
        retryAfter
      }
    }
    
    // Quota exceeded
    if (errorType === 'insufficient_quota' || message.includes('quota')) {
      return {
        type: ApiErrorType.QUOTA_EXCEEDED,
        message: 'OpenAI quota exceeded',
        provider: 'openai',
        model,
        retryable: false
      }
    }
    
    // Invalid API key
    if (status === 401 || errorType === 'invalid_api_key') {
      return {
        type: ApiErrorType.INVALID_API_KEY,
        message: 'Invalid OpenAI API key',
        provider: 'openai',
        model,
        retryable: false
      }
    }
    
    // Content filter
    if (errorType === 'content_filter' || message.includes('content filter')) {
      return {
        type: ApiErrorType.CONTENT_FILTER,
        message: 'Content filtered by OpenAI',
        provider: 'openai',
        model,
        retryable: false
      }
    }
    
    // Model not available
    if (status === 404 || message.includes('model')) {
      return {
        type: ApiErrorType.MODEL_UNAVAILABLE,
        message: `OpenAI model '${model}' not available`,
        provider: 'openai',
        model,
        retryable: false
      }
    }
    
    // Bad requests
    if (status === 400) {
      return {
        type: ApiErrorType.BAD_REQUEST,
        message: `OpenAI bad request: ${message}`,
        provider: 'openai',
        model,
        retryable: false
      }
    }
    
    // Default OpenAI error
    return {
      type: ApiErrorType.UNKNOWN,
      message: `OpenAI error: ${message}`,
      provider: 'openai',
      model,
      retryable: false
    }
  },
  
  /**
   * Parse Anthropic-specific errors
   */
  parseAnthropicError(error: any, model: string): ApiErrorInfo {
    const status = error.status || error.statusCode || 0
    const errorType = error.type || ''
    const message = error.message || 'Unknown Anthropic error'
    
    // Rate limit errors
    if (status === 429 || message.includes('rate') || message.includes('limit')) {
      const retryAfter = error.headers?.['retry-after']
        ? parseInt(error.headers['retry-after']) * 1000
        : 60000 // Default to 60 seconds
      
      return {
        type: ApiErrorType.RATE_LIMIT,
        message: 'Anthropic rate limit exceeded',
        provider: 'anthropic',
        model,
        retryable: true,
        retryAfter
      }
    }
    
    // Invalid API key
    if (status === 401) {
      return {
        type: ApiErrorType.INVALID_API_KEY,
        message: 'Invalid Anthropic API key',
        provider: 'anthropic',
        model,
        retryable: false
      }
    }
    
    // Model not available
    if (status === 404 || message.includes('model')) {
      return {
        type: ApiErrorType.MODEL_UNAVAILABLE,
        message: `Anthropic model '${model}' not available`,
        provider: 'anthropic',
        model,
        retryable: false
      }
    }
    
    // Content filter
    if (message.includes('content') && message.includes('policy')) {
      return {
        type: ApiErrorType.CONTENT_FILTER,
        message: 'Content filtered by Anthropic',
        provider: 'anthropic',
        model,
        retryable: false
      }
    }
    
    // Bad requests
    if (status === 400) {
      return {
        type: ApiErrorType.BAD_REQUEST,
        message: `Anthropic bad request: ${message}`,
        provider: 'anthropic',
        model,
        retryable: false
      }
    }
    
    // Default Anthropic error
    return {
      type: ApiErrorType.UNKNOWN,
      message: `Anthropic error: ${message}`,
      provider: 'anthropic',
      model,
      retryable: false
    }
  },
  
  /**
   * Parse Google-specific errors
   */
  parseGoogleError(error: any, model: string): ApiErrorInfo {
    const status = error.status || error.statusCode || 0
    const message = error.message || 'Unknown Google error'
    
    // Rate limit errors
    if (status === 429 || message.includes('rate') || message.includes('quota')) {
      return {
        type: ApiErrorType.RATE_LIMIT,
        message: 'Google API rate limit exceeded',
        provider: 'google',
        model,
        retryable: true,
        retryAfter: 60000 // Default to 60 seconds
      }
    }
    
    // Invalid API key
    if (status === 401 || status === 403) {
      return {
        type: ApiErrorType.INVALID_API_KEY,
        message: 'Invalid Google API key or unauthorized access',
        provider: 'google',
        model,
        retryable: false
      }
    }
    
    // Model not available
    if (status === 404) {
      return {
        type: ApiErrorType.MODEL_UNAVAILABLE,
        message: `Google model '${model}' not available`,
        provider: 'google',
        model,
        retryable: false
      }
    }
    
    // Content filter
    if (message.includes('content') && message.includes('safety')) {
      return {
        type: ApiErrorType.CONTENT_FILTER,
        message: 'Content filtered by Google',
        provider: 'google',
        model,
        retryable: false
      }
    }
    
    // Bad requests
    if (status === 400) {
      return {
        type: ApiErrorType.BAD_REQUEST,
        message: `Google bad request: ${message}`,
        provider: 'google',
        model,
        retryable: false
      }
    }
    
    // Default Google error
    return {
      type: ApiErrorType.UNKNOWN,
      message: `Google error: ${message}`,
      provider: 'google',
      model,
      retryable: false
    }
  },
  
  /**
   * Check if a provider+model is currently rate limited
   */
  isRateLimited(provider: AIProvider, model?: string): boolean {
    const now = Date.now()
    
    // Find matching rate limit entry
    const limitEntry = rateLimitCache.find(entry => {
      if (entry.provider !== provider) return false
      if (model && entry.model && entry.model !== model) return false
      return true
    })
    
    // If no entry or limit has expired, not rate limited
    if (!limitEntry || now > limitEntry.limitReachedAt + limitEntry.retryAfter) {
      return false
    }
    
    return true
  },
  
  /**
   * Get time remaining until retry is allowed (in ms)
   */
  getRetryAfterTime(provider: AIProvider, model?: string): number {
    const now = Date.now()
    
    // Find matching rate limit entry
    const limitEntry = rateLimitCache.find(entry => {
      if (entry.provider !== provider) return false
      if (model && entry.model && entry.model !== model) return false
      return true
    })
    
    // If no entry or limit has expired, return 0
    if (!limitEntry || now > limitEntry.limitReachedAt + limitEntry.retryAfter) {
      return 0
    }
    
    // Return time remaining
    return (limitEntry.limitReachedAt + limitEntry.retryAfter) - now
  },
  
  /**
   * Record a rate limit for a provider/model
   */
  recordRateLimit(provider: AIProvider, retryAfter: number, model?: string): void {
    const now = Date.now()
    
    // Find existing entry index
    const existingIndex = rateLimitCache.findIndex(entry => {
      if (entry.provider !== provider) return false
      if (model && entry.model && entry.model !== model) return false
      return true
    })
    
    // Update existing entry or add new one
    if (existingIndex >= 0) {
      rateLimitCache[existingIndex] = {
        provider,
        model,
        limitReachedAt: now,
        retryAfter
      }
    } else {
      rateLimitCache.push({
        provider,
        model,
        limitReachedAt: now,
        retryAfter
      })
    }
    
    // Clean up expired entries
    this.cleanupRateLimitCache()
  },
  
  /**
   * Remove expired rate limit entries
   */
  cleanupRateLimitCache(): void {
    const now = Date.now()
    
    // Remove entries that have expired
    while (rateLimitCache.length > 0) {
      const oldestEntry = rateLimitCache[0]
      if (now > oldestEntry.limitReachedAt + oldestEntry.retryAfter) {
        rateLimitCache.shift()
      } else {
        break
      }
    }
  },
  
  /**
   * Track an API error
   */
  async trackError(
    errorInfo: ApiErrorInfo,
    userId: string,
    projectId?: string,
    agentId?: string,
    promptTokens = 0
  ): Promise<void> {
    try {
      await ApiUsageService.trackUsage({
        user_id: userId,
        project_id: projectId || null,
        agent_id: agentId || null,
        provider: errorInfo.provider,
        model: errorInfo.model,
        tokens_prompt: promptTokens,
        tokens_completion: 0,
        tokens_total: promptTokens,
        status: 'error',
        duration_ms: 0,
        metadata: {
          error_type: errorInfo.type,
          error_message: errorInfo.message
        }
      })
    } catch (error) {
      logger.error({ error }, 'Failed to track API error')
      // Silently continue if tracking fails
    }
  },
  
  /**
   * Get suggested fallback model for a given model if primary is unavailable
   */
  getFallbackModel(provider: AIProvider, model: string): { provider: AIProvider; model: string } | null {
    // OpenAI fallbacks
    if (provider === 'openai') {
      if (model === 'gpt-4-turbo') return { provider: 'openai', model: 'gpt-4' }
      if (model === 'gpt-4') return { provider: 'openai', model: 'gpt-3.5-turbo' }
      if (model === 'gpt-3.5-turbo') return { provider: 'anthropic', model: 'claude-3-haiku' }
    }
    
    // Anthropic fallbacks
    if (provider === 'anthropic') {
      if (model === 'claude-3-opus') return { provider: 'anthropic', model: 'claude-3-sonnet' }
      if (model === 'claude-3-sonnet') return { provider: 'anthropic', model: 'claude-3-haiku' }
      if (model === 'claude-3-haiku') return { provider: 'openai', model: 'gpt-3.5-turbo' }
    }
    
    // Google fallbacks
    if (provider === 'google') {
      if (model === 'gemini-1.5-pro') return { provider: 'google', model: 'gemini-pro' }
      if (model === 'gemini-pro') return { provider: 'openai', model: 'gpt-3.5-turbo' }
    }
    
    // If no specific fallback is defined, try gpt-3.5-turbo as a general fallback
    return { provider: 'openai', model: 'gpt-3.5-turbo' }
  },
  
  /**
   * Create an appropriate user-facing error message
   */
  getUserFriendlyErrorMessage(errorInfo: ApiErrorInfo): string {
    switch (errorInfo.type) {
      case ApiErrorType.RATE_LIMIT:
        return `The ${errorInfo.provider} API is currently experiencing high demand. Please try again in a few minutes.`
      
      case ApiErrorType.QUOTA_EXCEEDED:
        return `Your ${errorInfo.provider} API quota has been exceeded. Please check your billing settings or use a different model.`
      
      case ApiErrorType.INVALID_API_KEY:
        return `There's an issue with your ${errorInfo.provider} API key. Please check your API key settings.`
      
      case ApiErrorType.MODEL_UNAVAILABLE:
        return `The ${errorInfo.model} model is currently unavailable. Try a different model.`
      
      case ApiErrorType.CONTENT_FILTER:
        return `Your request was flagged by ${errorInfo.provider}'s content filter. Please modify your input and try again.`
      
      case ApiErrorType.BAD_REQUEST:
        return `There was an issue with your request to the ${errorInfo.provider} API. Please try again with different parameters.`
      
      case ApiErrorType.TIMEOUT:
        return `The request to ${errorInfo.provider} timed out. Please try again.`
      
      default:
        return `An error occurred with the ${errorInfo.provider} API. Please try again later.`
    }
  }
} 