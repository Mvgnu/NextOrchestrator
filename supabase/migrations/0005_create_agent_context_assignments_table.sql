-- Create agent_context_assignments table
CREATE TABLE IF NOT EXISTS agent_context_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  context_id UUID NOT NULL REFERENCES contexts(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('primary', 'auxiliary', 'specialist')),
  priority INTEGER NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  custom_instructions TEXT,
  UNIQUE(agent_id, context_id)
);

-- Add RLS policy for agent_context_assignments
ALTER TABLE agent_context_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for agent_context_assignments
-- Allow users to select assignments for their own agents/contexts
CREATE POLICY "agent_context_assignments_select"
ON agent_context_assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM agents WHERE 
    agents.id = agent_context_assignments.agent_id AND
    agents.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM contexts WHERE 
    contexts.id = agent_context_assignments.context_id AND
    contexts.user_id = auth.uid()
  )
);

-- Allow users to insert assignments for their own agents/contexts
CREATE POLICY "agent_context_assignments_insert"
ON agent_context_assignments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM agents WHERE 
    agents.id = agent_context_assignments.agent_id AND
    agents.user_id = auth.uid()
  )
  AND
  EXISTS (
    SELECT 1 FROM contexts WHERE 
    contexts.id = agent_context_assignments.context_id AND
    contexts.user_id = auth.uid()
  )
);

-- Allow users to update assignments for their own agents/contexts
CREATE POLICY "agent_context_assignments_update"
ON agent_context_assignments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM agents WHERE 
    agents.id = agent_context_assignments.agent_id AND
    agents.user_id = auth.uid()
  )
  AND
  EXISTS (
    SELECT 1 FROM contexts WHERE 
    contexts.id = agent_context_assignments.context_id AND
    contexts.user_id = auth.uid()
  )
);

-- Allow users to delete assignments for their own agents/contexts
CREATE POLICY "agent_context_assignments_delete"
ON agent_context_assignments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM agents WHERE 
    agents.id = agent_context_assignments.agent_id AND
    agents.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM contexts WHERE 
    contexts.id = agent_context_assignments.context_id AND
    contexts.user_id = auth.uid()
  )
);

-- Add updated_at trigger
CREATE TRIGGER update_agent_context_assignments_updated_at
  BEFORE UPDATE ON agent_context_assignments
  FOR EACH ROW EXECUTE FUNCTION update_modified_column(); 