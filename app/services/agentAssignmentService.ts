import { v4 as uuidv4 } from 'uuid';
import { ContextDigest } from './contextService';

export interface Agent {
  id: string;
  name: string;
  model: string;
  description: string | null;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  projectId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentContextAssignment {
  id: string;
  agentId: string;
  contextId: string;
  role: 'primary' | 'auxiliary' | 'specialist';
  priority: number; // 1-10, higher means more important
  customInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mock API for agent recommendations based on context
export async function recommendAgentsForContext(
  contextDigest: ContextDigest,
  availableAgents: Agent[],
  projectId: string
): Promise<{
  recommendations: Array<{agent: Agent, role: string, rationale: string, priority: number}>
}> {
  // In a real app, this would use an LLM to analyze the context and recommend agent roles
  // For now, we'll simulate this process
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simple mock logic for agent recommendations
  // In a real app, this would be based on semantic matching between agent capabilities and context needs
  const recommendations = availableAgents.map((agent, index) => {
    // Assign roles based on position (just for demo)
    const roles = ['primary', 'specialist', 'auxiliary'] as const;
    const role = roles[index % roles.length];
    
    // Calculate priority (just for demo)
    const priority = 10 - (index % 10);
    
    return {
      agent,
      role,
      rationale: `${agent.name} is recommended as a ${role} agent because ${
        role === 'primary' 
          ? 'it has general knowledge suitable for handling the main aspects of this context.' 
          : role === 'specialist' 
            ? 'it has specialized knowledge relevant to key concepts in this context.'
            : 'it can provide supplementary information to enrich responses.'
      }`,
      priority
    };
  });
  
  return { recommendations };
}

// Assign agents to context
export async function assignAgentsToContext(
  contextId: string,
  assignments: Array<{
    agentId: string;
    role: 'primary' | 'auxiliary' | 'specialist';
    priority: number;
    customInstructions?: string;
  }>
): Promise<AgentContextAssignment[]> {
  // In a real app, this would save to a database
  // For now, we'll just return the assignments with IDs
  
  const createdAssignments = assignments.map(assignment => ({
    id: uuidv4(),
    contextId,
    agentId: assignment.agentId,
    role: assignment.role,
    priority: assignment.priority,
    customInstructions: assignment.customInstructions,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  
  return createdAssignments;
}

// Get agents assigned to a context
export async function getAgentsForContext(
  contextId: string
): Promise<AgentContextAssignment[]> {
  // In a real app, this would fetch from a database
  // For now, we'll return an empty array
  return [];
}

// Remove agent from context
export async function removeAgentFromContext(
  assignmentId: string
): Promise<void> {
  // In a real app, this would delete from a database
  // For now, we'll just simulate success
  return;
}

const agentAssignmentService = {
  recommendAgentsForContext,
  assignAgentsToContext,
  getAgentsForContext,
  removeAgentFromContext,
};

export default agentAssignmentService;
