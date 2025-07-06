import { z } from 'zod'

// purpose: validate and expose environment variables
// inputs: process.env
// outputs: env object with typed values and helper methods
// status: stable
// related_docs: lib/README.md

/**
 * Validates and exposes environment variables.
 */

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),

  NEXTAUTH_SECRET: z.string(),
  NEXTAUTH_URL: z.string().url().default('http://localhost:3000'),

  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  XAI_API_KEY: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),

  ENABLE_AI_REVIEW_LOOP: z
    .preprocess(val => val === 'true', z.boolean().default(false)),
  ENABLE_MULTI_AGENT_DEBUG: z
    .preprocess(val => val === 'true', z.boolean().default(false)),
  MAX_CONCURRENT_AGENTS: z.coerce.number().int().default(5),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().int().default(5432),
  DB_NAME: z.string().default('marsnext_db'),
  DB_USER: z.string().default('marsnext_user'),
  DB_PASSWORD: z.string().default('strongpassword'),
  DB_SSL: z.preprocess(val => val === 'true', z.boolean().default(false))
})

const rawEnv = envSchema.parse(process.env)

export const env = {
  // App-wide
  environment: rawEnv.NODE_ENV,
  isProduction: rawEnv.NODE_ENV === 'production',
  isDevelopment: rawEnv.NODE_ENV === 'development',

  // Database
  supabaseUrl: rawEnv.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: rawEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,

  dbHost: rawEnv.DB_HOST,
  dbPort: rawEnv.DB_PORT,
  dbName: rawEnv.DB_NAME,
  dbUser: rawEnv.DB_USER,
  dbPassword: rawEnv.DB_PASSWORD,
  dbSsl: rawEnv.DB_SSL,

  // Authentication
  nextAuthSecret: rawEnv.NEXTAUTH_SECRET,
  nextAuthUrl: rawEnv.NEXTAUTH_URL,

  // AI API Keys
  openaiApiKey: rawEnv.OPENAI_API_KEY ?? '',
  anthropicApiKey: rawEnv.ANTHROPIC_API_KEY ?? '',
  googleApiKey: rawEnv.GOOGLE_API_KEY ?? '',
  xaiApiKey: rawEnv.XAI_API_KEY ?? '',
  deepseekApiKey: rawEnv.DEEPSEEK_API_KEY ?? '',

  // Feature flags
  enableAiReviewLoop: rawEnv.ENABLE_AI_REVIEW_LOOP,
  enableMultiAgentDebug: rawEnv.ENABLE_MULTI_AGENT_DEBUG,
  maxConcurrentAgents: rawEnv.MAX_CONCURRENT_AGENTS,

  /** Validate required env vars are present */
  hasRequiredEnvVars(): boolean {
    return !!(
      this.supabaseUrl &&
      this.supabaseAnonKey &&
      this.nextAuthSecret
    )
  },

  /** True if any provider API key is configured */
  hasAnyAiApiKeys(): boolean {
    return !!(
      this.openaiApiKey ||
      this.anthropicApiKey ||
      this.googleApiKey ||
      this.xaiApiKey ||
      this.deepseekApiKey
    )
  },

  /** Return API key for a provider name */
  getApiKeyForProvider(provider: string): string {
    switch (provider) {
      case 'openai':
        return this.openaiApiKey
      case 'anthropic':
        return this.anthropicApiKey
      case 'google':
        return this.googleApiKey
      case 'xai':
        return this.xaiApiKey
      case 'deepseek':
        return this.deepseekApiKey
      default:
        return ''
    }
  }
}

