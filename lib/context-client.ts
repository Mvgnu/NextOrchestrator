// Types mirroring the database schema for contexts
type Context = {
  id: string
  name: string
  content: string
  created_at: string
  updated_at: string
  project_id: string
  user_id: string
  metadata: any
}

type ContextCreatePayload = {
  name: string
  content: string
  project_id: string
  metadata?: any
}

type ContextUpdatePayload = {
  name?: string
  content?: string
  metadata?: any
}

/**
 * Create a new context
 */
export async function createContext(context: ContextCreatePayload): Promise<Context> {
  const response = await fetch('/api/contexts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(context),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to create context')
  }

  const data = await response.json()
  return data.context
}

/**
 * Get all contexts for a project
 */
export async function getProjectContexts(projectId: string): Promise<Context[]> {
  const response = await fetch(`/api/contexts?project_id=${projectId}`)

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to fetch contexts')
  }

  const data = await response.json()
  return data.contexts
}

/**
 * Get a single context by ID
 */
export async function getContext(contextId: string): Promise<Context> {
  const response = await fetch(`/api/contexts/${contextId}`)

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to fetch context')
  }

  const data = await response.json()
  return data.context
}

/**
 * Update an existing context
 */
export async function updateContext(contextId: string, updates: ContextUpdatePayload): Promise<Context> {
  const response = await fetch(`/api/contexts/${contextId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to update context')
  }

  const data = await response.json()
  return data.context
}

/**
 * Delete a context
 */
export async function deleteContext(contextId: string): Promise<void> {
  const response = await fetch(`/api/contexts/${contextId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to delete context')
  }
}

/**
 * Digest raw content into structured markdown
 */
export async function digestContent(content: string, title: string): Promise<string> {
  const response = await fetch('/api/contexts/digest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content, title }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to digest content')
  }

  const data = await response.json()
  return data.digestedContent
}

/**
 * Save a digest to an existing context
 */
export async function saveDigest(
  contextId: string, 
  digest: string, 
  metadata?: any
): Promise<Context> {
  const response = await fetch(`/api/contexts/${contextId}/digest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ digest, metadata }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to save digest')
  }

  const data = await response.json()
  return data.context
} 