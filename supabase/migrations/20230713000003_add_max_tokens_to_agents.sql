-- Add max_tokens column to agents table (if it doesn't exist)
ALTER TABLE IF EXISTS agents
ADD COLUMN IF NOT EXISTS max_tokens INTEGER;

-- Comment on column
COMMENT ON COLUMN agents.max_tokens IS 'Maximum number of tokens the agent can generate in a response. NULL means use model default.'; 