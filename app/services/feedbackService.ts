// Removed 'use client' as this service will now make API calls or be server-only for some functions.

import { v4 as uuidv4 } from 'uuid';
// import supabase from '@/lib/supabase'; // REMOVED Supabase client
// import type { Database } from '@/types/supabase'; // REMOVED Supabase types
// import type { Agent } from '@/lib/agent-service'; // This type might still be useful if defined locally or from a shared types file
import OpenAI from 'openai';
// import { env } from '@/lib/env'; // For API keys if used server-side
import { AgentService } from '@/lib/agent-service';
// import { ChatMessage } from '@/app/services/synthesisService'; // This type might still be useful
import { query } from '@/lib/db';

// Local type definitions for what the client expects/sends, matching agent_ratings table + project_id
export interface AgentRatingPayload {
  agent_id: string;
  project_id: string;
  rating_overall?: number | null; // Maps to 'rating' in agent_ratings
  comment?: string | null;
  // message_id and other detailed ratings like accuracy, relevance are not in agent_ratings table.
  // If these are needed, agent_ratings schema would need an update, or a different table used.
}

export interface AgentRatingResponse {
  id: string; // uuid from agent_ratings
  agent_id: string;
  user_id: string;
  project_id: string; // Assuming project_id is part of the returned record
  rating: number | null;
  comment: string | null;
  created_at: string;
}

// --- Placeholder types from old service, might be removed or refactored later --- 
export interface FeedbackRating {
  accuracy: number; 
  relevance: number; 
  completeness: number; 
  clarity: number; 
}
export interface SynthesisFeedback {
  id: string;
  synthesisId: string;
  queryId: string;
  rating: FeedbackRating; 
  comments?: string;
  createdAt: Date;
  userId: string;
}
export interface FeedbackSummary {
  agentId: string;
  agentName?: string; 
  averageRating: { 
    overall: number | null;
    accuracy: number | null;
    relevance: number | null;
    completeness: number | null;
    clarity: number | null;
  };
  feedbackCount: number;
  recentComments: Array<{ comment: string | null, created_at: string }>;
}
export interface FeedbackAnalysis {
  strengths: string[]; 
  weaknesses: string[]; 
  improvementSuggestions: string[];
  summary: string; 
  recentComments: Array<{ comment: string | null, created_at: string }>;
}
// --- End placeholder types ---

/**
 * Submits feedback for an agent via an API call.
 */
async function submitAgentFeedback(
  feedbackData: AgentRatingPayload
): Promise<AgentRatingResponse> { // Return type matches API response structure
  const response = await fetch('/api/feedback/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feedbackData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})); // Try to parse error, default to empty object
    throw new Error(errorData.message || `Failed to submit feedback: ${response.statusText}`);
  }
  const result = await response.json();
  return result.feedback as AgentRatingResponse; // Assuming API returns { feedback: AgentRatingResponseData }
}

/**
 * purpose: Analyze agent feedback using LLM for strengths, weaknesses, and suggestions
 * status: stable
 * inputs: agentId (string)
 * outputs: FeedbackAnalysis object with LLM-powered insights if available
 * depends_on: OpenAI, agent_feedback table
 * related_docs: ../../docs/agentic-feedback.md
 */
export async function analyzeFeedback(agentId: string): Promise<FeedbackAnalysis> {
  // Fetch feedback from DB
  const { rows } = await query(
    `SELECT rating, comment, created_at FROM agent_feedback WHERE agent_id = $1 ORDER BY created_at DESC LIMIT 100`,
    [agentId]
  );
  if (!rows || rows.length === 0) {
    return {
      strengths: [],
      weaknesses: [],
      improvementSuggestions: [],
      summary: 'No feedback available.',
      recentComments: [],
    };
  }
  // Aggregate ratings
  const ratings = rows.map((r: any) => r.rating).filter((r: number) => typeof r === 'number');
  const avgRating = ratings.length ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : null;
  // Collect recent comments
  const recentComments = rows.filter((r: any) => r.comment).map((r: any) => ({ comment: r.comment, created_at: r.created_at }));

  // Try LLM analysis if OpenAI API key is set
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (openaiApiKey && recentComments.length > 0) {
    try {
      const openai = new OpenAI({ apiKey: openaiApiKey });
      const prompt = `You are an expert product analyst. Given the following user feedback comments and average rating (${avgRating ?? 'N/A'}), analyze and return:
1. Strengths (bullet points)
2. Weaknesses (bullet points)
3. Actionable Suggestions (bullet points)
4. A one-paragraph summary

Feedback comments:
${recentComments.map((c, i) => `${i + 1}. ${c.comment}`).join('\n')}

Return your answer as JSON with keys: strengths, weaknesses, improvementSuggestions, summary.`;
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 512,
      });
      const content = completion.choices[0]?.message?.content || '';
      let llmResult: any = {};
      try {
        llmResult = JSON.parse(content);
      } catch {
        // Try to extract JSON from text
        const match = content.match(/\{[\s\S]*\}/);
        if (match) llmResult = JSON.parse(match[0]);
      }
      return {
        strengths: llmResult.strengths || [],
        weaknesses: llmResult.weaknesses || [],
        improvementSuggestions: llmResult.improvementSuggestions || [],
        summary: llmResult.summary || '',
        recentComments,
      };
    } catch (err) {
      // Fallback to heuristics if LLM fails
    }
  }
  // Heuristic fallback
  const strengths: string[] = avgRating && avgRating >= 4 ? ['Generally positive feedback'] : [];
  const weaknesses: string[] = avgRating && avgRating < 3 ? ['Generally negative feedback'] : [];
  const improvementSuggestions: string[] = [];
  const summary = `Average rating: ${avgRating ?? 'N/A'}. ${recentComments.length} recent comments.`;
  return {
    strengths,
    weaknesses,
    improvementSuggestions,
    summary,
    recentComments,
  };
}

/**
 * Server-side: Apply feedback analysis to update the agent's system prompt.
 */
export async function applyFeedbackToAgent(agentId: string, userId: string) {
  // Fetch agent
  const agent = await AgentService.getAgent(agentId);
  if (!agent) throw new Error('Agent not found');
  if (agent.user_id !== userId) throw new Error('Permission denied');

  // Analyze feedback
  const analysis = await analyzeFeedback(agentId);

  // Generate refinement instructions
  const refinementHeader = '--- User Feedback & Refinement Instructions (Auto-Generated) ---';
  const refinementBlock = [
    refinementHeader,
    analysis.summary,
    analysis.strengths.length ? `Strengths: ${analysis.strengths.join(', ')}` : '',
    analysis.weaknesses.length ? `Weaknesses: ${analysis.weaknesses.join(', ')}` : '',
    analysis.improvementSuggestions.length ? `Suggestions: ${analysis.improvementSuggestions.join(', ')}` : '',
  ].filter(Boolean).join('\n');

  // Replace or append refinement block in system_prompt
  let newPrompt = agent.system_prompt || '';
  if (newPrompt.includes(refinementHeader)) {
    newPrompt = newPrompt.replace(
      new RegExp(`${refinementHeader}[\s\S]*?(?=---|$)`, 'm'),
      refinementBlock + '\n'
    );
  } else {
    newPrompt = (newPrompt + '\n\n' + refinementBlock).trim();
  }

  // Update agent
  const updatedAgent = await AgentService.updateAgent(agentId, userId, { system_prompt: newPrompt });
  return updatedAgent;
}

// Stubbed/Commented out functions that need API routes or server-side implementation
/*
async function getAgentFeedbackSummary(
  agentId: string
): Promise<FeedbackSummary> {
  console.warn("getAgentFeedbackSummary needs to be refactored to call an API endpoint.");
  // Example API call structure:
  // const response = await fetch(`/api/feedback/agent/${agentId}/summary`);
  // if (!response.ok) throw new Error('Failed to fetch feedback summary');
  // return response.json();
  throw new Error('getAgentFeedbackSummary not implemented for client-side service yet.');
  }

async function submitSynthesisFeedback(
  synthesisId: string,
  queryId: string,
  rating: FeedbackRating,
  comments?: string,
  userId?: string
): Promise<SynthesisFeedback> {
  console.warn("submitSynthesisFeedback is currently mocked and needs API endpoint.");
  return {
    id: uuidv4(),
    synthesisId,
    queryId,
    rating,
    comments,
    createdAt: new Date(),
    userId: userId || 'anonymous'
  };
}
*/

// Export only the client-callable functions for now
export const FeedbackService = {
  submitAgentFeedback,
    // getAgentFeedbackSummary, // Uncomment when implemented with API call
    // analyzeFeedback,         // Uncomment when implemented with API call or moved server-side
    applyFeedbackToAgent,
    // submitSynthesisFeedback  // Uncomment when implemented with API call
};

export default FeedbackService; 