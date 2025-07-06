import { env } from './env'
import { delay } from '@/lib/utils'
import { AgentService } from './agent-service'
import { AIProvider } from './ai-config'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import * as googleAI from '@google-ai/generativelanguage'
import { ApiUsageService } from './api-usage-service'
import { ApiErrorHandler, ApiErrorType } from './api-error-handler'
import logger from './logger'

// Types
interface AgentResponse {
  agentId: string
  agentName: string
  response: string
  error?: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  fallbackUsed?: {
    originalProvider: AIProvider
    originalModel: string
    reason: string
  }
}

interface AgentExecutionParams {
  projectId: string
  userId: string
  agents: {
    id: string
    name: string
    model: string
    provider: AIProvider
    basePrompt: string
    temperature?: number
    maxTokens?: number
  }[]
  userMessage: string
  context?: string
}

// Maximum number of retries for retryable errors
const MAX_RETRIES = 2

/**
 * Service for executing agent operations
 */
export const AgentExecutor = {
  /**
   * Execute multiple agents concurrently and return their responses
   */
  async executeAgents(params: AgentExecutionParams): Promise<Record<string, AgentResponse>> {
    const { projectId, agents, userMessage, context, userId } = params
    
    // Limit concurrent executions based on environment config
    const maxConcurrent = env.maxConcurrentAgents
    
    // Execute agents in batches if needed
    const responses: Record<string, AgentResponse> = {}
    
    // Process agents in chunks to control concurrency
    for (let i = 0; i < agents.length; i += maxConcurrent) {
      const batch = agents.slice(i, i + maxConcurrent)
      
      // Run the current batch concurrently
      const batchPromises = batch.map(agent => 
        this.executeAgentWithRetry(agent, userMessage, context, userId, projectId)
          .then(response => {
            responses[agent.id] = response
            return response
          })
          .catch(error => {
            logger.error({ error }, `Unhandled error executing agent ${agent.id}`)
            
            responses[agent.id] = {
              agentId: agent.id,
              agentName: agent.name,
              response: '',
              error: error.message || 'Failed to execute agent'
            }
            return responses[agent.id]
          })
      )
      
      // Wait for all agents in the current batch to complete
      await Promise.all(batchPromises)
    }
    
    return responses
  },
  
  /**
   * Execute an agent with automatic retry for rate limits and fallback for unavailable models
   */
  async executeAgentWithRetry(
    agent: { 
      id: string; 
      name: string; 
      model: string; 
      provider: AIProvider; 
      basePrompt: string;
      temperature?: number;
      maxTokens?: number;
    },
    userMessage: string,
    context?: string,
    userId?: string,
    projectId?: string,
    retryCount = 0
  ): Promise<AgentResponse> {
    try {
      // Check if provider is rate limited before attempting
      if (ApiErrorHandler.isRateLimited(agent.provider, agent.model)) {
        const retryAfter = ApiErrorHandler.getRetryAfterTime(agent.provider, agent.model)
        
        // If this is not a retry attempt, try to use a fallback model
        if (retryCount === 0) {
          const fallback = ApiErrorHandler.getFallbackModel(agent.provider, agent.model)
          
          if (fallback) {
            logger.info(`Provider ${agent.provider} (${agent.model}) is rate limited. Using fallback: ${fallback.provider} (${fallback.model})`)
            
            // Create modified agent with fallback model
            const fallbackAgent = {
              ...agent,
              provider: fallback.provider,
              model: fallback.model
            }
            
            // Execute with fallback
            const response = await this.executeAgent(fallbackAgent, userMessage, context, userId, projectId)
            
            // Add fallback info to response
            return {
              ...response,
              fallbackUsed: {
                originalProvider: agent.provider,
                originalModel: agent.model,
                reason: 'Rate limit exceeded'
              }
            }
          }
        }
        
        // No fallback available or this is already a retry - wait and retry
        if (retryCount < MAX_RETRIES) {
          logger.info(`Provider ${agent.provider} is rate limited. Waiting ${retryAfter}ms before retry.`)
          await delay(retryAfter)
          return this.executeAgentWithRetry(agent, userMessage, context, userId, projectId, retryCount + 1)
        }
        
        // Max retries reached
        throw new Error(`Rate limit exceeded for ${agent.provider}. No fallbacks available.`)
      }
      
      // Execute agent normally
      return await this.executeAgent(agent, userMessage, context, userId, projectId)
      
    } catch (error: any) {
      const errorInfo = ApiErrorHandler.parseProviderError(error, agent.provider, agent.model)
      
      // Log the error
      logger.error({ error: errorInfo.message }, `Error executing agent ${agent.id} (${agent.provider}/${agent.model})`)
      
      // Track the error
      if (userId) {
        const promptTokens = (agent.basePrompt.length + (userMessage.length + (context?.length || 0))) / 4
        await ApiErrorHandler.trackError(errorInfo, userId, projectId, agent.id, promptTokens)
      }
      
      // For retryable errors like rate limits
      if (errorInfo.retryable && retryCount < MAX_RETRIES) {
        // Record rate limit to prevent excessive retries
        if (errorInfo.type === ApiErrorType.RATE_LIMIT) {
          ApiErrorHandler.recordRateLimit(
            agent.provider, 
            errorInfo.retryAfter || 60000,
            agent.model
          )
        }
        
        // Wait and retry
        const retryDelay = errorInfo.retryAfter || 30000
        logger.info(`Retryable error. Waiting ${retryDelay}ms before retry.`)
        await delay(retryDelay)
        return this.executeAgentWithRetry(agent, userMessage, context, userId, projectId, retryCount + 1)
      }
      
      // For non-retryable errors or max retries reached, try fallback if available
      const fallback = ApiErrorHandler.getFallbackModel(agent.provider, agent.model)
      
      if (fallback) {
        logger.info(`Error with ${agent.provider} (${agent.model}). Using fallback: ${fallback.provider} (${fallback.model})`)
        
        // Create modified agent with fallback model
        const fallbackAgent = {
          ...agent,
          provider: fallback.provider,
          model: fallback.model
        }
        
        // Execute with fallback
        try {
          const response = await this.executeAgent(fallbackAgent, userMessage, context, userId, projectId)
          
          // Add fallback info to response
          return {
            ...response,
            fallbackUsed: {
              originalProvider: agent.provider,
              originalModel: agent.model,
              reason: errorInfo.message
            }
          }
        } catch (fallbackError) {
          // If fallback also fails, return original error
          throw error
        }
      }
      
      // No fallback available, or fallback failed
      return {
        agentId: agent.id,
        agentName: agent.name,
        response: ApiErrorHandler.getUserFriendlyErrorMessage(errorInfo),
        error: errorInfo.message
      }
    }
  },
  
  /**
   * Execute a single agent and return its response
   */
  async executeAgent(
    agent: { 
      id: string; 
      name: string; 
      model: string; 
      provider: AIProvider; 
      basePrompt: string;
      temperature?: number;
      maxTokens?: number;
    },
    userMessage: string,
    context?: string,
    userId?: string,
    projectId?: string
  ): Promise<AgentResponse> {
    // This is a mock implementation
    // In a real implementation, we would use the appropriate AI API based on the provider
    
    const startTime = Date.now()
    let status = 'success'
    let usage = {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0
    }
    
    try {
      // Get the correct API key for the provider
      const apiKey = env.getApiKeyForProvider(agent.provider)
      
      if (!apiKey) {
        throw new Error(`No API key available for provider: ${agent.provider}`)
      }
      
      // Construct the prompt
      const prompt = `${agent.basePrompt}\n\n${context ? `CONTEXT:\n${context}\n\n` : ''}USER MESSAGE: ${userMessage}`
      
      // Call the appropriate AI provider
      let responseText = ''
      
      switch (agent.provider) {
        case 'openai':
          const openaiResult = await this.callOpenAI(agent.model, prompt, apiKey, agent.temperature, agent.maxTokens)
          responseText = openaiResult.response
          usage = openaiResult.usage
          break
        case 'anthropic':
          const anthropicResult = await this.callAnthropic(agent.model, prompt, apiKey, agent.temperature, agent.maxTokens)
          responseText = anthropicResult.response
          usage = anthropicResult.usage
          break
        case 'google':
          const googleResult = await this.callGoogle(agent.model, prompt, apiKey, agent.temperature, agent.maxTokens)
          responseText = googleResult.response
          usage = googleResult.usage
          break
        default:
          // For demo purposes, simulate a response with a delay
          await delay(1000)
          responseText = `Response from ${agent.name} (${agent.model}): Analysis of "${userMessage.substring(0, 30)}..."`
          
          // Simulate usage for demo purposes
          usage = {
            prompt_tokens: prompt.length / 4, // Very rough approximation
            completion_tokens: responseText.length / 4,
            total_tokens: (prompt.length + responseText.length) / 4
          }
      }
      
      // Track API usage if userId is provided
      if (userId) {
        try {
          await ApiUsageService.trackUsage({
            user_id: userId,
            project_id: projectId || null,
            agent_id: agent.id,
            provider: agent.provider,
            model: agent.model,
            tokens_prompt: usage.prompt_tokens,
            tokens_completion: usage.completion_tokens,
            tokens_total: usage.total_tokens,
            status,
            duration_ms: Date.now() - startTime
          })
        } catch (trackError) {
          logger.error({ trackError }, 'Error tracking API usage')
          // Continue even if tracking fails
        }
      }
      
      return {
        agentId: agent.id,
        agentName: agent.name,
        response: responseText,
        usage
      }
    } catch (error: any) {
      status = 'error'
      
      // Track error usage if userId is provided
      if (userId) {
        try {
          await ApiUsageService.trackUsage({
            user_id: userId,
            project_id: projectId || null,
            agent_id: agent.id,
            provider: agent.provider,
            model: agent.model,
            tokens_prompt: usage.prompt_tokens,
            tokens_completion: usage.completion_tokens,
            tokens_total: usage.total_tokens,
            status,
            duration_ms: Date.now() - startTime,
            metadata: { error: error.message }
          })
        } catch (trackError) {
          logger.error({ trackError }, 'Error tracking API usage')
          // Continue even if tracking fails
        }
      }
      
      // Rethrow the error to be handled by the retry mechanism
      throw error
    }
  },
  
  /**
   * Synthesize multiple agent responses into a single output
   */
  async synthesizeResponses(
    agentResponses: Record<string, AgentResponse>,
    userMessage: string,
    userId?: string,
    projectId?: string
  ): Promise<string> {
    // In a real implementation, we would use a designated "synthesizer" model
    // to combine the outputs of all agents. For now, we'll simulate this.
    
    const startTime = Date.now()
    let status = 'success'
    let usage = {
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0
    }
    
    try {
      // Format agent responses for synthesis
      const formattedResponses = Object.values(agentResponses)
        .map(resp => {
          let responseText = `${resp.agentName}: ${resp.response.substring(0, 200)}${resp.response.length > 200 ? '...' : ''}`
          
          // Add fallback info if a fallback was used
          if (resp.fallbackUsed) {
            responseText += `\n(Fallback from ${resp.fallbackUsed.originalProvider}/${resp.fallbackUsed.originalModel} due to: ${resp.fallbackUsed.reason})`
          }
          
          // Add error info if there was an error
          if (resp.error) {
            responseText += `\n(Error: ${resp.error})`
          }
          
          return responseText
        })
        .join('\n\n')
      
      // Choose the first available API key for synthesis
      const apiKey = env.openaiApiKey || env.anthropicApiKey || env.googleApiKey
      
      if (!apiKey) {
        // For demo, provide a mock synthesis
        await delay(1000)
        return `Synthesized response for: "${userMessage.substring(0, 30)}..."\n\nThis is a placeholder for the actual synthesis of multiple agent responses.`
      }
      
      // Check for rate limits before attempting synthesis
      const synthesisProvider = env.openaiApiKey ? 'openai' : (env.anthropicApiKey ? 'anthropic' : 'google')
      const synthesisModel = synthesisProvider === 'openai' ? 'gpt-4-turbo' : 
                             (synthesisProvider === 'anthropic' ? 'claude-3-sonnet' : 'gemini-pro')
                             
      if (ApiErrorHandler.isRateLimited(synthesisProvider, synthesisModel)) {
        const retryAfter = ApiErrorHandler.getRetryAfterTime(synthesisProvider, synthesisModel)
        logger.info(`Synthesis provider ${synthesisProvider} is rate limited. Waiting ${retryAfter}ms before attempting.`)
        await delay(retryAfter)
      }
      
      // Use OpenAI as default synthesizer if available
      const synthPrompt = `You are a synthesis agent. Your task is to combine the following specialist agent responses into a single coherent response. Utilize the strengths of each response while compensating for any weaknesses or omissions. The original user message was: "${userMessage}"\n\nAGENT RESPONSES:\n${formattedResponses}`
      
      try {
        if (env.openaiApiKey) {
          const result = await this.callOpenAI('gpt-4-turbo', synthPrompt, env.openaiApiKey)
          
          // Track synthesis usage if userId is provided
          if (userId) {
            try {
              await ApiUsageService.trackUsage({
                user_id: userId,
                project_id: projectId || null,
                agent_id: null, // No specific agent for synthesis
                provider: 'openai',
                model: 'gpt-4-turbo',
                tokens_prompt: result.usage.prompt_tokens,
                tokens_completion: result.usage.completion_tokens,
                tokens_total: result.usage.total_tokens,
                status: 'success',
                duration_ms: Date.now() - startTime,
                metadata: { type: 'synthesis' }
              })
            } catch (trackError) {
              logger.error({ trackError }, 'Error tracking synthesis usage')
              // Continue even if tracking fails
            }
          }
          
          return result.response
        }
        
        // Try Anthropic fallback for synthesis
        if (env.anthropicApiKey) {
          const result = await this.callAnthropic('claude-3-sonnet', synthPrompt, env.anthropicApiKey)
          
          // Track synthesis usage if userId is provided
          if (userId) {
            try {
              await ApiUsageService.trackUsage({
                user_id: userId,
                project_id: projectId || null,
                agent_id: null, // No specific agent for synthesis
                provider: 'anthropic',
                model: 'claude-3-sonnet',
                tokens_prompt: result.usage.prompt_tokens,
                tokens_completion: result.usage.completion_tokens,
                tokens_total: result.usage.total_tokens,
                status: 'success',
                duration_ms: Date.now() - startTime,
                metadata: { type: 'synthesis' }
              })
            } catch (trackError) {
              logger.error({ trackError }, 'Error tracking synthesis usage')
              // Continue even if tracking fails
            }
          }
          
          return result.response
        }
      } catch (error) {
        // If synthesis with AI model fails, use a fallback mechanism
        logger.error({ error }, 'Error during synthesis with AI model')
        
        // Parse and track the error
        if (userId) {
          const provider = env.openaiApiKey ? 'openai' : (env.anthropicApiKey ? 'anthropic' : 'google')
          const model = provider === 'openai' ? 'gpt-4-turbo' : 
                       (provider === 'anthropic' ? 'claude-3-sonnet' : 'gemini-pro')
                       
          const errorInfo = ApiErrorHandler.parseProviderError(error, provider, model)
          await ApiErrorHandler.trackError(errorInfo, userId, projectId, undefined, synthPrompt.length / 4)
          
          if (errorInfo.type === ApiErrorType.RATE_LIMIT) {
            ApiErrorHandler.recordRateLimit(provider, errorInfo.retryAfter || 60000, model)
          }
        }
      }
      
      // If all synthesis attempts fail, provide a basic concatenation of responses
      const responses = Object.values(agentResponses)
      
      // If there's only one response, return it directly
      if (responses.length === 1) {
        return responses[0].response;
      }
      
      // Do a basic synthesis without AI
      let basicSynthesis = `Response to: "${userMessage.substring(0, 30)}..."\n\n`;
      
      // Count successful responses
      const successfulResponses = responses.filter(r => !r.error && r.response)
      
      if (successfulResponses.length === 0) {
        return "All agents encountered errors. Please try again later or with different parameters."
      }
      
      // Create a basic synthesis
      basicSynthesis += "Combined input from " + successfulResponses.length + " agents:\n\n";
      
      // Include a brief summary from each agent
      successfulResponses.forEach((response, index) => {
        basicSynthesis += `Agent ${index + 1} (${response.agentName}): ${response.response.substring(0, 300)}${response.response.length > 300 ? '...' : ''}\n\n`;
      });
      
      // Track basic synthesis usage if userId is provided
      if (userId) {
        try {
          const promptTokens = synthPrompt.length / 4
          const completionTokens = basicSynthesis.length / 4
          
          await ApiUsageService.trackUsage({
            user_id: userId,
            project_id: projectId || null,
            agent_id: null, // No specific agent for synthesis
            provider: 'manual',
            model: 'basic-synthesis',
            tokens_prompt: promptTokens,
            tokens_completion: completionTokens,
            tokens_total: promptTokens + completionTokens,
            status: 'success',
            duration_ms: Date.now() - startTime,
            metadata: { type: 'fallback_synthesis' }
          })
        } catch (trackError) {
          logger.error({ trackError }, 'Error tracking fallback synthesis usage')
          // Continue even if tracking fails
        }
      }
      
      return basicSynthesis
    } catch (error: any) {
      logger.error({ error }, 'Error synthesizing responses')
      
      // Track error if userId is provided
      if (userId) {
        try {
          await ApiUsageService.trackUsage({
            user_id: userId,
            project_id: projectId || null,
            agent_id: null, // No specific agent for synthesis
            provider: 'openai', // Assume OpenAI for error case
            model: 'gpt-4-turbo',
            tokens_prompt: 0,
            tokens_completion: 0,
            tokens_total: 0,
            status: 'error',
            duration_ms: Date.now() - startTime,
            metadata: { type: 'synthesis', error: error.message }
          })
        } catch (trackError) {
          logger.error({ trackError }, 'Error tracking synthesis error')
          // Continue even if tracking fails
        }
      }
      
      return `Failed to synthesize responses: ${error.message}`
    }
  },
  
  // API-specific call methods
  async callOpenAI(
    model: string, 
    prompt: string, 
    apiKey: string, 
    temperature?: number, 
    maxTokens?: number
  ): Promise<{ response: string; usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }> {
    // In a real implementation, use the actual OpenAI API call
    // This is a simplified placeholder
    const openai = new OpenAI({ apiKey })
    
    // For demo purposes, simulate a delay and return
    await delay(500)
    
    // Simulate token usage
    const usage = {
      prompt_tokens: prompt.length / 4, // Very rough approximation
      completion_tokens: 100 + Math.floor(Math.random() * 400),
      total_tokens: 0
    }
    
    usage.total_tokens = usage.prompt_tokens + usage.completion_tokens
    
    return {
      response: `[OpenAI ${model}] Response to: "${prompt.substring(0, 30)}..." (temp: ${temperature || 'default'}, max tokens: ${maxTokens || 'default'})`,
      usage
    }
  },
  
  async callAnthropic(
    model: string, 
    prompt: string, 
    apiKey: string, 
    temperature?: number, 
    maxTokens?: number
  ): Promise<{ response: string; usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }> {
    // In a real implementation, use the actual Anthropic API call
    // This is a simplified placeholder
    const anthropic = new Anthropic({ apiKey })
    
    // For demo purposes, simulate a delay and return
    await delay(700)
    
    // Simulate token usage
    const usage = {
      prompt_tokens: prompt.length / 4, // Very rough approximation
      completion_tokens: 80 + Math.floor(Math.random() * 320),
      total_tokens: 0
    }
    
    usage.total_tokens = usage.prompt_tokens + usage.completion_tokens
    
    return {
      response: `[Anthropic ${model}] Response to: "${prompt.substring(0, 30)}..." (temp: ${temperature || 'default'}, max tokens: ${maxTokens || 'default'})`,
      usage
    }
  },
  
  async callGoogle(
    model: string, 
    prompt: string, 
    apiKey: string, 
    temperature?: number, 
    maxTokens?: number
  ): Promise<{ response: string; usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }> {
    // In a real implementation, use the actual Google API call
    // This is a simplified placeholder
    // Google API doesn't expose GenerativeModel directly, so we use a mock
    
    // For demo purposes, simulate a delay and return
    await delay(600)
    
    // Simulate token usage
    const usage = {
      prompt_tokens: prompt.length / 4, // Very rough approximation
      completion_tokens: 60 + Math.floor(Math.random() * 240),
      total_tokens: 0
    }
    
    usage.total_tokens = usage.prompt_tokens + usage.completion_tokens
    
    return {
      response: `[Google ${model}] Response to: "${prompt.substring(0, 30)}..." (temp: ${temperature || 'default'}, max tokens: ${maxTokens || 'default'})`,
      usage
    }
  }
} 