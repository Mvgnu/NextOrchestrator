-- Migration to add role to users table and create agent_feedback table

-- Add role column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' NOT NULL;

COMMENT ON COLUMN public.users.role IS 'User role (e.g., ''user'', ''admin'') for RBAC.';

-- Create the new agent_feedback table
CREATE TABLE IF NOT EXISTS public.agent_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  response_id TEXT, -- ID of the specific agent response being rated
  query_id TEXT,    -- ID of the user query that led to the response
  session_id TEXT,  -- Optional: ID for grouping interactions
  
  -- Structured Rating
  rating_accuracy SMALLINT CHECK (rating_accuracy BETWEEN 1 AND 5),
  rating_relevance SMALLINT CHECK (rating_relevance BETWEEN 1 AND 5),
  rating_completeness SMALLINT CHECK (rating_completeness BETWEEN 1 AND 5),
  rating_clarity SMALLINT CHECK (rating_clarity BETWEEN 1 AND 5),
  
  -- Qualitative Feedback
  comments TEXT,
  prompt_feedback TEXT,       -- Specific feedback on the system prompt used
  meta_cognitive_input TEXT,  -- User's reflection/meta-cognition input
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_agent_feedback_agent_id ON public.agent_feedback(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_feedback_user_id ON public.agent_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_feedback_created_at ON public.agent_feedback(created_at);

-- Apply the standard updated_at trigger function (assuming it exists)
-- Ensure the function 'update_modified_column' exists in your DB
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_modified_column') THEN
     CREATE TRIGGER update_agent_feedback_updated_at
       BEFORE UPDATE ON public.agent_feedback
       FOR EACH ROW EXECUTE FUNCTION update_modified_column();
  ELSE
     RAISE NOTICE 'Function update_modified_column() not found. Skipping trigger creation for agent_feedback.';
  END IF;
END;
$$;

-- Enable Row Level Security
ALTER TABLE public.agent_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies (adjust based on your security model)
-- Allow users to insert their own feedback
CREATE POLICY feedback_insert_own ON public.agent_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to select their own feedback
CREATE POLICY feedback_select_own ON public.agent_feedback
  FOR SELECT USING (auth.uid() = user_id);
  
-- Allow admins (or specific roles) to select all feedback (needed for analysis)
-- Requires the role column added to the users table earlier in this migration
CREATE POLICY feedback_select_admin ON public.agent_feedback
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));
  
-- Add other policies (update, delete) as needed. Example:
-- CREATE POLICY feedback_update_own ON public.agent_feedback
--   FOR UPDATE USING (auth.uid() = user_id);
-- CREATE POLICY feedback_delete_own ON public.agent_feedback
--   FOR DELETE USING (auth.uid() = user_id);


-- Add comments for documentation
COMMENT ON TABLE public.agent_feedback IS 'Stores detailed user feedback on agent responses, including ratings and qualitative comments.';
COMMENT ON COLUMN public.agent_feedback.response_id IS 'Identifier for the specific agent response being rated.';
COMMENT ON COLUMN public.agent_feedback.query_id IS 'Identifier for the user query associated with the feedback.';
COMMENT ON COLUMN public.agent_feedback.prompt_feedback IS 'Specific user feedback targeted at the system prompt used by the agent.';
COMMENT ON COLUMN public.agent_feedback.meta_cognitive_input IS 'User reflections or meta-cognitive input related to the interaction.'; 