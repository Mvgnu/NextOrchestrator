-- Add memory_enabled column to agents table
ALTER TABLE agents ADD COLUMN memory_enabled BOOLEAN DEFAULT FALSE NOT NULL;

-- Add an index for faster queries
CREATE INDEX agents_memory_enabled_idx ON agents(memory_enabled);

COMMENT ON COLUMN agents.memory_enabled IS 'Flag to enable conversation memory for this agent'; 