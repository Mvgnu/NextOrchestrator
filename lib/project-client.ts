type Project = {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
  user_id: string
}

type ProjectCreatePayload = {
  name: string
  description?: string | null
}

type ProjectUpdatePayload = {
  name?: string
  description?: string | null
}

/**
 * Create a new project
 */
export async function createProject(project: ProjectCreatePayload): Promise<Project> {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(project),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to create project')
  }

  const data = await response.json()
  return data.project
}

/**
 * Get all projects for the current user
 */
export async function getProjects(): Promise<Project[]> {
  const response = await fetch('/api/projects')

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to fetch projects')
  }

  const data = await response.json()
  return data.projects
}

/**
 * Get a single project by ID
 */
export async function getProject(projectId: string): Promise<Project> {
  const response = await fetch(`/api/projects/${projectId}`)

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to fetch project')
  }

  const data = await response.json()
  return data.project
}

/**
 * Update an existing project
 */
export async function updateProject(projectId: string, updates: ProjectUpdatePayload): Promise<Project> {
  const response = await fetch(`/api/projects/${projectId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to update project')
  }

  const data = await response.json()
  return data.project
}

/**
 * Delete a project
 */
export async function deleteProject(projectId: string): Promise<void> {
  const response = await fetch(`/api/projects/${projectId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to delete project')
  }
} 