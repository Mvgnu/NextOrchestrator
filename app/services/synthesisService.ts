import { v4 as uuidv4 } from 'uuid';
import { ContextDigest, ContextRow } from './contextService';
import type { Agent as AgentBase } from '@/lib/agent-service';
import { env } from '@/lib/env';
import OpenAI from 'openai';

/**
 * purpose: Represents a single agentic reasoning step within an assistant message for traceable feedback
 * status: stable
 * inputs: step_id (string), agent_id (string), agent_name (optional string), content (string), metadata (optional object)
 * outputs: AgentStep object
 * depends_on: none
 * related_docs: ../../docs/agentic-feedback.md
 */
export interface AgentStep {
  step_id: string;
  agent_id: string;
  agent_name?: string;
  content: string;
  metadata?: Record<string, any>;
}

/**
 * purpose: Represents a chat message, optionally with agentic sub-steps for granular feedback
 * status: stable
 * inputs: role (user|assistant|system), content (string), message_id (optional string), agentSteps (optional AgentStep[])
 * outputs: ChatMessage object
 * depends_on: AgentStep
 * related_docs: ../../docs/agentic-feedback.md
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  message_id?: string;
  agentSteps?: AgentStep[];
}

// Define AgentResponse interface (modify if needed, keep for non-streaming use)
export interface AgentResponse {
  agentId: string;
  content: string;
  metadata?: {
    tokens?: {
      prompt: number;
      completion: number;
      total: number;
    } | null;
    modelName?: string | null;
    finishReason?: string | null;
    error?: string | null;
  };
}

// Type for chunks yielded by the streaming function
export type AgentResponseChunk = 
  | { type: 'content'; agentId: string; delta: string }
  | { type: 'metadata'; agentId: string; metadata: Required<NonNullable<AgentResponse['metadata']>> }
  | { type: 'error'; agentId: string; error: string };

export interface SynthesisOptions {
  temperature?: number;
  maxTokens?: number;
  modelOverride?: string;
  includeAgentDetails?: boolean;
  includeContextMetadata?: boolean;
  formatType?: 'markdown' | 'json' | 'html';
}

export interface SynthesisResult {
  id: string;
  content: string;
  agentResponses: AgentResponse[];
  contextIds: string[];
  createdAt: Date;
  metadata?: {
    tokens: {
      prompt: number;
      completion: number;
      total: number;
    };
    modelName: string;
    executionTimeMs: number;
  };
}

export interface SynthesisStage {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: string;
  metadata?: Record<string, any>;
}

export interface SynthesisOrchestration {
  id: string;
  query: string;
  stages: SynthesisStage[];
  result: SynthesisResult | null;
  contextIds: string[];
  agentIds: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  projectId: string;
  userId: string;
}

export interface Agent extends AgentBase {
  model: string;
  temperature?: number;
  memory_enabled?: boolean;
}

// --- Updated Helper function to construct prompt using ContextRow --- 
function constructChatMessages(
  agent: Agent,
  query: string,
  contexts: ContextRow[],
  history: ChatMessage[]
): Array<OpenAI.Chat.Completions.ChatCompletionMessageParam> {
    const messages: Array<OpenAI.Chat.Completions.ChatCompletionMessageParam> = [];
    const MAX_CONTEXT_CHARS = 16000; // Approx 4k tokens heuristic
    let contextTruncated = false;

    if (agent.system_prompt) {
        messages.push({ role: 'system', content: agent.system_prompt });
    }

    // Combine context content
    let contextString = contexts.map(ctx => 
        `Context: ${ctx.name || ctx.id}\nContent:\n${ctx.content}`
    ).join('\n\n---\n\n');
    
    // Truncate context string if it exceeds the character limit
    if (contextString.length > MAX_CONTEXT_CHARS) {
        contextString = contextString.substring(0, MAX_CONTEXT_CHARS);
        // Ensure truncation doesn't happen mid-word (optional, simple slice for now)
        // contextString = contextString.substring(0, contextString.lastIndexOf(' ')); // Find last space
        contextTruncated = true;
    }

    if (contextString) {
         const finalContextString = contextTruncated 
             ? `${contextString}\n\n[... Context truncated due to length limits ...]`
             : contextString;
         messages.push({ role: 'system', content: `Relevant Context Document(s):\n${finalContextString}` });
    }

    if (agent.memory_enabled && history.length > 0) {
        messages.push(...history);
    }

    messages.push({ role: 'user', content: query });

    return messages;
}

// --- Update streamAgentTurn to accept ContextRow[] --- 
export async function* streamAgentTurn(
  agent: Agent,
  query: string,
  contexts: ContextRow[],
  history: ChatMessage[],
  options: SynthesisOptions = {}
): AsyncGenerator<AgentResponseChunk> {
  const agentId = agent.id;
  // @ts-ignore - Provider access
  const provider = agent.provider as string || 'openai'; 
  let accumulatedContent = "";
  let finalMetadata: Required<NonNullable<AgentResponse['metadata']>> | null = null;

  try {
    const apiKey = env.getApiKeyForProvider(provider);
    if (!apiKey) {
      throw new Error(`API key for provider '${provider}' not found.`);
    }

    const messages = constructChatMessages(agent, query, contexts, history);

    if (provider !== 'openai') {
        throw new Error(`Provider '${provider}' is not yet supported in streamAgentTurn.`);
    }
    
    const openai = new OpenAI({ apiKey });

    const stream = await openai.chat.completions.create({
      model: options.modelOverride || agent.model,
      messages: messages,
      temperature: options.temperature ?? agent.temperature,
      // @ts-ignore - max_tokens access
      max_tokens: options.maxTokens ?? agent.max_tokens ?? undefined,
      stream: true,
    });

    let usage: OpenAI.CompletionUsage | undefined | null = undefined;
    let finishReason: string | null = null;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || "";
      if (delta) {
        accumulatedContent += delta;
        yield { type: 'content', agentId, delta };
      }
      if (chunk.choices[0]?.finish_reason) {
        finishReason = chunk.choices[0].finish_reason;
      }
      if (chunk.usage) {
          usage = chunk.usage;
      }
    }
    
    finalMetadata = {
        tokens: usage ? { 
            prompt: usage.prompt_tokens,
            completion: usage.completion_tokens,
            total: usage.total_tokens,
        } : null,
        modelName: options.modelOverride || agent.model,
        finishReason: finishReason ?? 'unknown',
        error: null
    };
    yield { type: 'metadata', agentId, metadata: finalMetadata };

  } catch (error: any) {
    console.error(`Error during agent turn for ${agentId} (${provider}):`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    yield { type: 'error', agentId, error: errorMessage };
    yield { type: 'metadata', agentId, metadata: { 
        tokens: null, 
        // @ts-ignore - Model/provider access
        modelName: options.modelOverride || agent.model, 
        finishReason: 'error', 
        error: errorMessage 
      } 
    };
  }
}

// --- Mocked/Outdated Functions (Keep or Refactor) --- 

// Original function - now needs refactoring if non-streaming is needed
// Or can be removed if streamAgentTurn covers all use cases
export async function getAgentResponsesWithContext(
  query: string,
  agents: Agent[],
  contextDigests: ContextDigest[],
  options: SynthesisOptions = {}
): Promise<AgentResponse[]> {
  console.warn('getAgentResponsesWithContext is using MOCK data...');
  // Return mock data for now to avoid breaking changes until refactored
  return agents.map(agent => ({
     agentId: agent.id,
     content: `Mock response from ${agent.name || agent.id} for query: ${query}`,
     metadata: {
       tokens: { prompt: 150, completion: 250, total: 400 },
       modelName: agent.model,
       finishReason: 'stop'
     }
  }));
}

// Mock synthesis remains
export async function synthesizeResponses(
  query: string,
  agentResponses: AgentResponse[],
  agents: Agent[],
  contextDigests: ContextDigest[],
  options: SynthesisOptions = {}
): Promise<SynthesisResult> {
  console.warn('synthesizeResponses is using MOCK data.');
  // ... (existing mock implementation) ...
  return { /* mock result */ } as SynthesisResult; 
}

// Mock orchestration remains
export async function runOrchestration(
  query: string,
  agents: Agent[],
  contextDigests: ContextDigest[],
  options: SynthesisOptions = {}
): Promise<SynthesisOrchestration> {
   console.warn('runOrchestration is using MOCK data.');
  // ... (existing mock implementation) ...
  return { /* mock result */ } as SynthesisOrchestration; 
}

// Mock helpers remain
function generateMockAgentResponse(/* ... */): string { return "Mock response content."; }
function generateMockSynthesis(/* ... */): string { return "Mock synthesis content."; }

// Export new function and potentially others if needed
export const synthesisService = {
  streamAgentTurn,
  getAgentResponsesWithContext,
  synthesizeResponses,
  runOrchestration
};

export default synthesisService; 