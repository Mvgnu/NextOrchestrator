-- This migration resets policies again, explicitly casting auth.uid() to UUID

-- Disable RLS and drop all existing policies for contexts and agents
ALTER TABLE contexts DISABLE ROW LEVEL SECURITY;
ALTER TABLE agents DISABLE ROW LEVEL SECURITY;

-- Drop ALL potential existing policy names
DROP POLICY IF EXISTS "contexts_select_policy" ON contexts;
DROP POLICY IF EXISTS "contexts_insert_policy" ON contexts;
DROP POLICY IF EXISTS "contexts_update_policy" ON contexts;
DROP POLICY IF EXISTS "contexts_delete_policy" ON contexts;
DROP POLICY IF EXISTS "contexts_all_access_policy" ON contexts;
DROP POLICY IF EXISTS "context_select" ON contexts;
DROP POLICY IF EXISTS "context_insert" ON contexts;
DROP POLICY IF EXISTS "context_update" ON contexts;
DROP POLICY IF EXISTS "context_delete" ON contexts;
DROP POLICY IF EXISTS "Users can create their own contexts" ON contexts;
DROP POLICY IF EXISTS "Users can view their own contexts" ON contexts;
DROP POLICY IF EXISTS "Users can update their own contexts" ON contexts;
DROP POLICY IF EXISTS "Users can delete their own contexts" ON contexts;
DROP POLICY IF EXISTS "Users can manage their own contexts" ON contexts;

DROP POLICY IF EXISTS "agents_select_policy" ON agents;
DROP POLICY IF EXISTS "agents_insert_policy" ON agents;
DROP POLICY IF EXISTS "agents_update_policy" ON agents;
DROP POLICY IF EXISTS "agents_delete_policy" ON agents;
DROP POLICY IF EXISTS "agents_all_access_policy" ON agents;
DROP POLICY IF EXISTS "agent_select" ON agents;
DROP POLICY IF EXISTS "agent_insert" ON agents;
DROP POLICY IF EXISTS "agent_update" ON agents;
DROP POLICY IF EXISTS "agent_delete" ON agents;
DROP POLICY IF EXISTS "Users can create their own agents" ON agents;
DROP POLICY IF EXISTS "Users can view their own agents" ON agents;
DROP POLICY IF EXISTS "Users can update their own agents" ON agents;
DROP POLICY IF EXISTS "Users can delete their own agents" ON agents;
DROP POLICY IF EXISTS "Users can manage their own agents" ON agents;

-- Re-enable RLS
ALTER TABLE contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Recreate policies using the simple naming convention and explicit UUID casting

-- Context policies with explicit UUID cast
CREATE POLICY context_select ON contexts
  FOR SELECT USING (auth.uid()::uuid = user_id);
  
CREATE POLICY context_insert ON contexts
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);
  
CREATE POLICY context_update ON contexts
  FOR UPDATE USING (auth.uid()::uuid = user_id);
  
CREATE POLICY context_delete ON contexts
  FOR DELETE USING (auth.uid()::uuid = user_id);

-- Agent policies with explicit UUID cast
CREATE POLICY agent_select ON agents
  FOR SELECT USING (auth.uid()::uuid = user_id);
  
CREATE POLICY agent_insert ON agents
  FOR INSERT WITH CHECK (auth.uid()::uuid = user_id);
  
CREATE POLICY agent_update ON agents
  FOR UPDATE USING (auth.uid()::uuid = user_id);
  
CREATE POLICY agent_delete ON agents
  FOR DELETE USING (auth.uid()::uuid = user_id);

-- Add a debug message
DO $$
BEGIN
    RAISE NOTICE 'RLS policies reset with explicit UUID casting';
END $$; 