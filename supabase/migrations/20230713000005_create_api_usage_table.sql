-- Create api_usage table
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  provider VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  tokens_prompt INTEGER NOT NULL DEFAULT 0,
  tokens_completion INTEGER NOT NULL DEFAULT 0,
  tokens_total INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(255) NOT NULL DEFAULT 'success',
  duration_ms INTEGER,
  metadata JSONB
);

-- Add indexes
CREATE INDEX idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX idx_api_usage_project_id ON api_usage(project_id);
CREATE INDEX idx_api_usage_agent_id ON api_usage(agent_id);
CREATE INDEX idx_api_usage_created_at ON api_usage(created_at);
CREATE INDEX idx_api_usage_provider ON api_usage(provider);
CREATE INDEX idx_api_usage_model ON api_usage(model);

-- Create updated_at trigger
CREATE TRIGGER update_api_usage_updated_at
  BEFORE UPDATE ON api_usage
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Set up RLS policies for api_usage table
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Policy for selecting own api usage data
CREATE POLICY api_usage_select ON api_usage
  FOR SELECT USING (auth.uid() = user_id);
  
-- Policy for inserting api usage data
CREATE POLICY api_usage_insert ON api_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
-- Policy for updating api usage data
CREATE POLICY api_usage_update ON api_usage
  FOR UPDATE USING (auth.uid() = user_id);
  
-- Comment on table and columns for documentation
COMMENT ON TABLE api_usage IS 'Table to store API usage data for tracking token consumption and costs';
COMMENT ON COLUMN api_usage.provider IS 'The AI provider (e.g., openai, anthropic, google)';
COMMENT ON COLUMN api_usage.model IS 'The specific model used (e.g., gpt-4, claude-3-opus)';
COMMENT ON COLUMN api_usage.tokens_prompt IS 'Number of tokens in the prompt/input';
COMMENT ON COLUMN api_usage.tokens_completion IS 'Number of tokens in the completion/output';
COMMENT ON COLUMN api_usage.tokens_total IS 'Total tokens (prompt + completion)';
COMMENT ON COLUMN api_usage.status IS 'Status of the API call (success, error, etc.)';
COMMENT ON COLUMN api_usage.duration_ms IS 'Duration of the API call in milliseconds';
COMMENT ON COLUMN api_usage.metadata IS 'Additional metadata about the API call'; 