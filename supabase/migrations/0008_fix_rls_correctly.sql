-- This is a more targeted RLS policy fix
-- First, let's disable all RLS to diagnose the issue
ALTER TABLE contexts DISABLE ROW LEVEL SECURITY;
ALTER TABLE agents DISABLE ROW LEVEL SECURITY;

-- Then re-enable it with proper policies
ALTER TABLE contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies
DROP POLICY IF EXISTS "contexts_all_access_policy" ON contexts;
DROP POLICY IF EXISTS "agents_all_access_policy" ON agents;

-- Create the correct policies for contexts
CREATE POLICY "contexts_select_policy" ON contexts
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- The key issue is often in the INSERT policy
CREATE POLICY "contexts_insert_policy" ON contexts
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contexts_update_policy" ON contexts
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "contexts_delete_policy" ON contexts
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Create the correct policies for agents
CREATE POLICY "agents_select_policy" ON agents
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "agents_insert_policy" ON agents
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "agents_update_policy" ON agents
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "agents_delete_policy" ON agents
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Add a debug message
DO $$
BEGIN
    RAISE NOTICE 'RLS policies have been correctly reconfigured for contexts and agents tables';
END $$; 