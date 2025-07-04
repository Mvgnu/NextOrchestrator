-- Drop existing policies that may be using conflicting names
DROP POLICY IF EXISTS agent_select ON agents;
DROP POLICY IF EXISTS agent_insert ON agents;
DROP POLICY IF EXISTS agent_update ON agents;
DROP POLICY IF EXISTS agent_delete ON agents;
DROP POLICY IF EXISTS "Users can create their own agents" ON agents;
DROP POLICY IF EXISTS "Users can view their own agents" ON agents;
DROP POLICY IF EXISTS "Users can update their own agents" ON agents;
DROP POLICY IF EXISTS "Users can delete their own agents" ON agents;

-- Recreate policies with explicit, specific names
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