CREATE POLICY "Users can create their own contexts" ON contexts
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own contexts" ON contexts
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own contexts" ON contexts
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contexts" ON contexts
FOR DELETE TO authenticated
USING (auth.uid() = user_id); 