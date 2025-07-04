-- This migration completely resets RLS policies to match the original schema.sql setup for the projects table
-- Since the projects table policies work, we'll use the exact same approach for contexts and agents

-- First, we need to disable RLS and drop all existing policies for these tables
ALTER TABLE contexts DISABLE ROW LEVEL SECURITY;
ALTER TABLE agents DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
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

-- Create the EXACT SAME policy names and definitions as the projects table in schema.sql

-- Context policies - following the exact pattern from projects in schema.sql
CREATE POLICY context_select ON contexts
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY context_insert ON contexts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY context_update ON contexts
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY context_delete ON contexts
  FOR DELETE USING (auth.uid() = user_id);

-- Agent policies - following the exact pattern from projects in schema.sql
CREATE POLICY agent_select ON agents
  FOR SELECT USING (auth.uid() = user_id);
  
CREATE POLICY agent_insert ON agents
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY agent_update ON agents
  FOR UPDATE USING (auth.uid() = user_id);
  
CREATE POLICY agent_delete ON agents
  FOR DELETE USING (auth.uid() = user_id);

-- Add a debug message
DO $$
BEGIN
    RAISE NOTICE 'RLS policies have been completely reset to match the original schema.sql configuration for projects table';
END $$; 