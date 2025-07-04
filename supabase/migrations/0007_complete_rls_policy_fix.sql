-- First ensure RLS is enabled on both tables
ALTER TABLE contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Completely drop ALL policies for contexts
DROP POLICY IF EXISTS "contexts_select_policy" ON contexts;
DROP POLICY IF EXISTS "contexts_insert_policy" ON contexts;
DROP POLICY IF EXISTS "contexts_update_policy" ON contexts;
DROP POLICY IF EXISTS "contexts_delete_policy" ON contexts;
DROP POLICY IF EXISTS "context_select" ON contexts;
DROP POLICY IF EXISTS "context_insert" ON contexts;
DROP POLICY IF EXISTS "context_update" ON contexts;
DROP POLICY IF EXISTS "context_delete" ON contexts;
DROP POLICY IF EXISTS "Users can create their own contexts" ON contexts;
DROP POLICY IF EXISTS "Users can view their own contexts" ON contexts;
DROP POLICY IF EXISTS "Users can update their own contexts" ON contexts;
DROP POLICY IF EXISTS "Users can delete their own contexts" ON contexts;

-- Completely drop ALL policies for agents
DROP POLICY IF EXISTS "agents_select_policy" ON agents;
DROP POLICY IF EXISTS "agents_insert_policy" ON agents;
DROP POLICY IF EXISTS "agents_update_policy" ON agents;
DROP POLICY IF EXISTS "agents_delete_policy" ON agents;
DROP POLICY IF EXISTS "agent_select" ON agents;
DROP POLICY IF EXISTS "agent_insert" ON agents;
DROP POLICY IF EXISTS "agent_update" ON agents;
DROP POLICY IF EXISTS "agent_delete" ON agents;
DROP POLICY IF EXISTS "Users can create their own agents" ON agents;
DROP POLICY IF EXISTS "Users can view their own agents" ON agents;
DROP POLICY IF EXISTS "Users can update their own agents" ON agents;
DROP POLICY IF EXISTS "Users can delete their own agents" ON agents;

-- Create universal all-access policy for contexts first to avoid lockout
CREATE POLICY "contexts_all_access_policy" ON contexts
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Create universal all-access policy for agents first to avoid lockout
CREATE POLICY "agents_all_access_policy" ON agents
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Add a better debug message
DO $$
BEGIN
    RAISE NOTICE 'RLS policies have been completely reset and permissive policies created for contexts and agents tables';
END $$; 