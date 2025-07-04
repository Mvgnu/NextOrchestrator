-- Create agent_presets table
CREATE TABLE IF NOT EXISTS agent_presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  base_prompt TEXT NOT NULL,
  category TEXT NOT NULL,
  recommended_model TEXT NOT NULL,
  recommended_provider TEXT NOT NULL,
  icon TEXT NOT NULL,
  temperature FLOAT DEFAULT 0.5 NOT NULL,
  memory_toggle BOOLEAN DEFAULT FALSE NOT NULL,
  tone TEXT DEFAULT 'neutral' NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_system BOOLEAN DEFAULT FALSE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Constraints
  CONSTRAINT valid_category CHECK (
    category IN ('writing', 'coding', 'research', 'creative', 'business', 'education', 'personal', 'system', 'custom')
  ),
  CONSTRAINT valid_provider CHECK (
    recommended_provider IN ('openai', 'anthropic', 'google', 'xai', 'deepseek')
  ),
  CONSTRAINT valid_temperature CHECK (
    temperature BETWEEN 0.0 AND 2.0
  )
);

-- System presets don't have a user_id, but user presets must have one
ALTER TABLE agent_presets
ADD CONSTRAINT system_or_user_preset CHECK (
  (is_system = TRUE AND user_id IS NULL) OR 
  (is_system = FALSE AND user_id IS NOT NULL)
);

-- Add indexes for faster queries
CREATE INDEX agent_presets_user_id_idx ON agent_presets(user_id);
CREATE INDEX agent_presets_is_system_idx ON agent_presets(is_system);

-- Create trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_agent_presets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_agent_presets_updated_at
BEFORE UPDATE ON agent_presets
FOR EACH ROW EXECUTE FUNCTION update_agent_presets_updated_at();

-- Set row level security policies
ALTER TABLE agent_presets ENABLE ROW LEVEL SECURITY;

-- System presets can be read by anyone
CREATE POLICY agent_presets_system_read_policy ON agent_presets
FOR SELECT
USING (is_system = TRUE);

-- Users can read, update, and delete their own presets
CREATE POLICY agent_presets_user_read_policy ON agent_presets
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY agent_presets_user_insert_policy ON agent_presets
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY agent_presets_user_update_policy ON agent_presets
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY agent_presets_user_delete_policy ON agent_presets
FOR DELETE
USING (user_id = auth.uid()); 