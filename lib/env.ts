/**
 * Environment configuration utility
 */

export const env = {
  // App-wide
  environment: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  
  // Database
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  
  // Authentication
  nextAuthSecret: process.env.NEXTAUTH_SECRET || '',
  nextAuthUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  
  // AI API Keys
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  googleApiKey: process.env.GOOGLE_API_KEY || '',
  xaiApiKey: process.env.XAI_API_KEY || '',
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
  
  // Feature flags
  enableAiReviewLoop: process.env.ENABLE_AI_REVIEW_LOOP === 'true',
  enableMultiAgentDebug: process.env.ENABLE_MULTI_AGENT_DEBUG === 'true',
  maxConcurrentAgents: parseInt(process.env.MAX_CONCURRENT_AGENTS || '5', 10),
  
  // Validation helpers
  hasRequiredEnvVars(): boolean {
    return !!(
      this.supabaseUrl && 
      this.supabaseAnonKey && 
      this.nextAuthSecret
    )
  },
  
  hasAnyAiApiKeys(): boolean {
    return !!(
      this.openaiApiKey || 
      this.anthropicApiKey || 
      this.googleApiKey ||
      this.xaiApiKey ||
      this.deepseekApiKey
    )
  },
  
  // For retrieving specific model API keys
  getApiKeyForProvider(provider: string): string {
    switch (provider) {
      case 'openai': return this.openaiApiKey
      case 'anthropic': return this.anthropicApiKey
      case 'google': return this.googleApiKey
      case 'xai': return this.xaiApiKey
      case 'deepseek': return this.deepseekApiKey
      default: return ''
    }
  }
} 