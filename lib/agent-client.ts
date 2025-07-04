// Type definitions
export interface Agent {
  id: string;
  name: string;
  description: string | null;
  model: string;
  provider: string;
  temperature: number;
  max_tokens?: number;
  system_prompt: string;
  project_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get all agents for a specific project
 */
export async function getProjectAgents(projectId: string): Promise<Agent[]> {
  const response = await fetch(`/api/agents?project_id=${projectId}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch agents');
  }
  
  const { agents } = await response.json();
  return agents;
}

/**
 * Get a single agent by ID
 */
export async function getAgent(agentId: string): Promise<Agent> {
  const response = await fetch(`/api/agents/${agentId}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch agent');
  }
  
  const { agent } = await response.json();
  return agent;
}

/**
 * Create a new agent
 */
export async function createAgent(agentData: {
  name: string;
  description?: string;
  model: string;
  provider: string;
  temperature?: number;
  max_tokens?: number;
  system_prompt: string;
  project_id: string;
  memory_enabled?: boolean;
}): Promise<Agent> {
  const response = await fetch('/api/agents', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(agentData),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create agent');
  }
  
  const { agent } = await response.json();
  return agent;
}

/**
 * Update an existing agent
 */
export async function updateAgent(
  agentId: string,
  updates: Partial<Omit<Agent, 'id' | 'created_at' | 'updated_at'>>
): Promise<Agent> {
  const response = await fetch(`/api/agents/${agentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update agent');
  }
  
  const { agent } = await response.json();
  return agent;
}

/**
 * Delete an agent
 */
export async function deleteAgent(agentId: string): Promise<void> {
  const response = await fetch(`/api/agents/${agentId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete agent');
  }
} 