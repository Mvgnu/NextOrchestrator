// @ts-nocheck
import supabase from './supabase'
import type { Database } from '@/types/supabase'
import { AgentExecutor } from './agent-executor'
import { AgentService } from './agent-service'
import { ContextService } from './context-service'

type Chat = Database['public']['Tables']['chats']['Row']
type ChatInsert = Database['public']['Tables']['chats']['Insert']
type ChatUpdate = Database['public']['Tables']['chats']['Update']

/**
 * Chat-related database operations and message processing
 */
export const ChatService = {
  /**
   * Get all chat messages for a specific project
   */
  async getProjectChats(projectId: string): Promise<Chat[]> {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('Error fetching chats:', error)
      throw error
    }
    
    return data || []
  },
  
  /**
   * Get a single chat message by ID
   */
  async getChat(chatId: string): Promise<Chat | null> {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .single()
    
    if (error) {
      console.error('Error fetching chat:', error)
      throw error
    }
    
    return data
  },
  
  /**
   * Process a user message through agents and save the result
   */
  async processUserMessage(
    projectId: string,
    userMessage: string,
    userId: string
  ): Promise<Chat> {
    try {
      // 1. Create initial chat record
      const initialChat: ChatInsert = {
        project_id: projectId,
        user_message: userMessage,
        agent_responses: {},
        synthesis: '',
      }
      
      const { data: chat, error } = await supabase
        .from('chats')
        .insert(initialChat)
        .select()
        .single()
      
      if (error) {
        throw new Error(`Failed to create chat: ${error.message}`)
      }
      
      // 2. Get all agents for this user
      const agents = await AgentService.getUserAgents(userId)
      
      if (agents.length === 0) {
        // No agents yet, return empty response
        return chat
      }
      
      // 3. Get all context for the project
      const contextMarkdown = await ContextService.combineProjectContexts(projectId)
      
      // 4. Execute all agents concurrently
      const agentResponses = await AgentExecutor.executeAgents({
        projectId,
        agents: agents.map(a => ({
          id: a.id,
          name: a.name,
          model: a.model,
          provider: a.model.split('-')[0] as any, // Simplified for demo
          basePrompt: a.base_prompt,
        })),
        userMessage,
        context: contextMarkdown,
      })
      
      // 5. Synthesize the responses
      const synthesis = await AgentExecutor.synthesizeResponses(
        agentResponses,
        userMessage
      )
      
      // 6. Update chat record with responses and synthesis
      const { data: updatedChat, error: updateError } = await supabase
        .from('chats')
        .update({
          agent_responses: agentResponses,
          synthesis,
        })
        .eq('id', chat.id)
        .select()
        .single()
      
      if (updateError) {
        throw new Error(`Failed to update chat with responses: ${updateError.message}`)
      }
      
      return updatedChat
    } catch (error: any) {
      console.error('Error processing message:', error)
      throw error
    }
  },
  
  /**
   * Delete a chat message
   */
  async deleteChat(chatId: string): Promise<void> {
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId)
    
    if (error) {
      console.error('Error deleting chat:', error)
      throw error
    }
  },
  
  /**
   * Clean agent responses for display
   */
  formatAgentResponses(responses: Record<string, any>): { name: string; content: string }[] {
    if (!responses || Object.keys(responses).length === 0) {
      return []
    }
    
    return Object.values(responses).map(agent => ({
      name: agent.agentName || 'Unknown Agent',
      content: agent.response || agent.error || 'No response',
    }))
  }
} 