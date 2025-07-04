-- Drop existing policies that may be using conflicting names
DROP POLICY IF EXISTS context_select ON contexts;
DROP POLICY IF EXISTS context_insert ON contexts;
DROP POLICY IF EXISTS context_update ON contexts;
DROP POLICY IF EXISTS context_delete ON contexts;
DROP POLICY IF EXISTS "Users can create their own contexts" ON contexts;
DROP POLICY IF EXISTS "Users can view their own contexts" ON contexts;
DROP POLICY IF EXISTS "Users can update their own contexts" ON contexts;
DROP POLICY IF EXISTS "Users can delete their own contexts" ON contexts;

-- Recreate policies with explicit, specific names
CREATE POLICY "contexts_select_policy" ON contexts
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "contexts_insert_policy" ON contexts
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "contexts_update_policy" ON contexts
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "contexts_delete_policy" ON contexts
FOR DELETE TO authenticated
USING (auth.uid() = user_id); 