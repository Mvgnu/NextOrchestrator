// AI model configuration for the MARS system

export interface AIModel {
  id: string
  provider: AIProvider
  name: string
  contextWindow: number
  maxOutputTokens: number
  capabilities: string[]
  supportedFeatures: {
    streaming: boolean
    tools: boolean
    vision: boolean
  }
}

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'xai' | 'deepseek'

export const providers: Record<AIProvider, { name: string; apiEnvKey: string }> = {
  openai: {
    name: 'OpenAI',
    apiEnvKey: 'OPENAI_API_KEY',
  },
  anthropic: {
    name: 'Anthropic',
    apiEnvKey: 'ANTHROPIC_API_KEY',
  },
  google: {
    name: 'Google',
    apiEnvKey: 'GOOGLE_API_KEY',
  },
  xai: {
    name: 'xAI',
    apiEnvKey: 'XAI_API_KEY',
  },
  deepseek: {
    name: 'DeepSeek',
    apiEnvKey: 'DEEPSEEK_API_KEY',
  },
}

export const aiModels: AIModel[] = [
  // OpenAI Models
  {
    id: 'gpt-4-turbo',
    provider: 'openai',
    name: 'GPT-4 Turbo',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    capabilities: ['text generation', 'code generation', 'summarization', 'analysis'],
    supportedFeatures: {
      streaming: true,
      tools: true,
      vision: false,
    },
  },
  {
    id: 'gpt-4-vision',
    provider: 'openai',
    name: 'GPT-4 Vision',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    capabilities: ['text generation', 'image understanding', 'visual analysis'],
    supportedFeatures: {
      streaming: true,
      tools: true,
      vision: true,
    },
  },
  {
    id: 'gpt-3.5-turbo',
    provider: 'openai',
    name: 'GPT-3.5 Turbo',
    contextWindow: 16000,
    maxOutputTokens: 4096,
    capabilities: ['text generation', 'code generation', 'summarization'],
    supportedFeatures: {
      streaming: true,
      tools: true,
      vision: false,
    },
  },
  
  // Anthropic Models
  {
    id: 'claude-3-opus',
    provider: 'anthropic',
    name: 'Claude 3 Opus',
    contextWindow: 200000,
    maxOutputTokens: 4096,
    capabilities: ['text generation', 'reasoning', 'analysis', 'image understanding'],
    supportedFeatures: {
      streaming: true,
      tools: true,
      vision: true,
    },
  },
  {
    id: 'claude-3-sonnet',
    provider: 'anthropic',
    name: 'Claude 3 Sonnet',
    contextWindow: 200000,
    maxOutputTokens: 4096,
    capabilities: ['text generation', 'reasoning', 'analysis', 'image understanding'],
    supportedFeatures: {
      streaming: true,
      tools: true,
      vision: true,
    },
  },
  {
    id: 'claude-3-haiku',
    provider: 'anthropic',
    name: 'Claude 3 Haiku',
    contextWindow: 200000,
    maxOutputTokens: 4096,
    capabilities: ['text generation', 'reasoning', 'analysis', 'image understanding'],
    supportedFeatures: {
      streaming: true,
      tools: true,
      vision: true,
    },
  },
  
  // Google Models
  {
    id: 'gemini-pro',
    provider: 'google',
    name: 'Gemini Pro',
    contextWindow: 32000,
    maxOutputTokens: 8192,
    capabilities: ['text generation', 'reasoning', 'analysis'],
    supportedFeatures: {
      streaming: true,
      tools: true,
      vision: false,
    },
  },
  {
    id: 'gemini-pro-vision',
    provider: 'google',
    name: 'Gemini Pro Vision',
    contextWindow: 32000,
    maxOutputTokens: 8192,
    capabilities: ['text generation', 'reasoning', 'analysis', 'image understanding'],
    supportedFeatures: {
      streaming: true,
      tools: true,
      vision: true,
    },
  },
]

// Agent template types
export const agentTemplates = [
  {
    id: 'researcher',
    name: 'Researcher',
    description: 'Focuses on deep research and analysis',
    basePrompt: 'You are a helpful research assistant. Your task is to analyze the provided context and research the topic thoroughly. Provide in-depth analysis backed by evidence.',
  },
  {
    id: 'critic',
    name: 'Critic',
    description: 'Provides constructive criticism and identifies issues',
    basePrompt: 'You are a thoughtful critic. Evaluate the provided content and identify potential issues, inconsistencies, or weaknesses. Offer constructive criticism.',
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Generates creative ideas and alternative approaches',
    basePrompt: 'You are a creative thinker. Generate innovative ideas, alternative approaches, and original perspectives related to the context provided.',
  },
  {
    id: 'synthesizer',
    name: 'Synthesizer',
    description: 'Combines multiple perspectives into a coherent whole',
    basePrompt: 'You are a skilled synthesizer. Your task is to analyze multiple perspectives and combine them into a coherent, integrated response that captures the strengths of each viewpoint.',
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Create a fully customized agent',
    basePrompt: '',
  },
] 