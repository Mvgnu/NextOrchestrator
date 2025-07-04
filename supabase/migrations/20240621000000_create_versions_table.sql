-- Create versions table for tracking content versions
CREATE TABLE IF NOT EXISTS versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  content_snapshot JSONB NOT NULL,
  metadata JSONB,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_version_id UUID REFERENCES versions(id) ON DELETE SET NULL,
  is_current BOOLEAN NOT NULL DEFAULT TRUE
);

-- Add indexes
CREATE INDEX idx_versions_content_id ON versions(content_id);
CREATE INDEX idx_versions_content_type ON versions(content_type);
CREATE INDEX idx_versions_project_id ON versions(project_id);
CREATE INDEX idx_versions_user_id ON versions(user_id);
CREATE INDEX idx_versions_parent_version_id ON versions(parent_version_id);
CREATE INDEX idx_versions_is_current ON versions(is_current);
CREATE INDEX idx_versions_created_at ON versions(created_at);

-- Create trigger to ensure only one current version per content
CREATE OR REPLACE FUNCTION update_versions_current_flag()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_current THEN
    UPDATE versions 
    SET is_current = FALSE
    WHERE content_id = NEW.content_id 
      AND content_type = NEW.content_type 
      AND id != NEW.id 
      AND is_current = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_versions_current_flag
  BEFORE INSERT OR UPDATE OF is_current ON versions
  FOR EACH ROW
  WHEN (NEW.is_current = TRUE)
  EXECUTE FUNCTION update_versions_current_flag();

-- Create updated_at trigger
CREATE TRIGGER update_versions_updated_at
  BEFORE UPDATE ON versions
  FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Set up RLS policies for versions table
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;

-- Policy for selecting own versions data
CREATE POLICY versions_select ON versions
  FOR SELECT USING (auth.uid() = user_id);
  
-- Policy for inserting versions data
CREATE POLICY versions_insert ON versions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
  
-- Policy for updating versions data
CREATE POLICY versions_update ON versions
  FOR UPDATE USING (auth.uid() = user_id);
  
-- Policy for deleting versions data
CREATE POLICY versions_delete ON versions
  FOR DELETE USING (auth.uid() = user_id);

-- Comments on table and columns for documentation
COMMENT ON TABLE versions IS 'Table to store version history for various content types (contexts, agents, etc.)';
COMMENT ON COLUMN versions.name IS 'Version name or number (e.g., v1.0.0)';
COMMENT ON COLUMN versions.description IS 'Description of the changes in this version';
COMMENT ON COLUMN versions.content_id IS 'ID of the content being versioned (context_id, agent_id, etc.)';
COMMENT ON COLUMN versions.content_type IS 'Type of content being versioned (context, agent, etc.)';
COMMENT ON COLUMN versions.content_snapshot IS 'JSON snapshot of the content at this version point';
COMMENT ON COLUMN versions.metadata IS 'Additional metadata about the version (tags, categories, etc.)';
COMMENT ON COLUMN versions.parent_version_id IS 'Reference to the parent version (null for initial version)';
COMMENT ON COLUMN versions.is_current IS 'Flag indicating if this is the current version of the content'; 