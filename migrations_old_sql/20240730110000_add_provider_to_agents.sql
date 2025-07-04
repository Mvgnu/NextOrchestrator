-- Migration to add provider column to agents table

ALTER TABLE public.agents
ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'openai';

COMMENT ON COLUMN public.agents.provider IS 'The AI provider for the agent (e.g., openai, anthropic, google)';

-- Optional: Backfill existing agents if needed
-- UPDATE public.agents SET provider = 'openai' WHERE provider IS NULL; 