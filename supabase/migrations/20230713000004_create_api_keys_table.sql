-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(255) NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Add indexes
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_provider ON api_keys(provider);

-- Create updated_at trigger
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Set up RLS policies for api_keys table
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policy for selecting own api keys
CREATE POLICY api_key_select ON api_keys
  FOR SELECT USING (auth.uid() = user_id);
  
-- Policy for inserting own api keys
CREATE POLICY api_key_insert ON api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
-- Policy for updating own api keys
CREATE POLICY api_key_update ON api_keys
  FOR UPDATE USING (auth.uid() = user_id);
  
-- Policy for deleting own api keys
CREATE POLICY api_key_delete ON api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- Comment on table and columns for documentation
COMMENT ON TABLE api_keys IS 'Table to store encrypted API keys for various AI providers';
COMMENT ON COLUMN api_keys.provider IS 'The provider name (e.g., openai, anthropic, google)';
COMMENT ON COLUMN api_keys.api_key_encrypted IS 'The encrypted API key';
COMMENT ON COLUMN api_keys.name IS 'A user-friendly name for the API key';
COMMENT ON COLUMN api_keys.is_active IS 'Whether the key is currently active for use'; 