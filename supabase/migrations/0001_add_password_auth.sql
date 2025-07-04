-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."users" (
  "id" uuid NOT NULL PRIMARY KEY,
  "email" text NOT NULL UNIQUE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "name" text,
  "avatar_url" text
);

-- Add password_hash column to the users table
ALTER TABLE "public"."users" 
ADD COLUMN IF NOT EXISTS "password_hash" TEXT;

-- Add role column to the users table with default value 'user'
ALTER TABLE "public"."users" 
ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'user';

-- Update RLS policy for users table
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view and update own data" ON "public"."users";
DROP POLICY IF EXISTS "Users can insert their own data during signup" ON "public"."users";

-- Policy to allow users to select and update only their own data
CREATE POLICY "Users can view and update own data" 
ON "public"."users"
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy to allow normal signup
CREATE POLICY "Users can insert their own data during signup" 
ON "public"."users"
FOR INSERT
WITH CHECK (true);

-- Create projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."projects" (
  "id" uuid NOT NULL PRIMARY KEY,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "user_id" uuid NOT NULL REFERENCES "public"."users"(id)
);

-- Update the RLS policies for other tables that reference users
-- Projects
ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own projects" ON "public"."projects";
CREATE POLICY "Users can manage their own projects" 
ON "public"."projects"
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create contexts table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."contexts" (
  "id" uuid NOT NULL PRIMARY KEY,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "name" text NOT NULL,
  "content" text NOT NULL,
  "project_id" uuid NOT NULL REFERENCES "public"."projects"(id),
  "user_id" uuid NOT NULL REFERENCES "public"."users"(id),
  "metadata" jsonb
);

-- Contexts
ALTER TABLE "public"."contexts" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own contexts" ON "public"."contexts";
CREATE POLICY "Users can manage their own contexts" 
ON "public"."contexts"
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create agents table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."agents" (
  "id" uuid NOT NULL PRIMARY KEY,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "model" text NOT NULL,
  "temperature" numeric NOT NULL,
  "max_tokens" integer,
  "system_prompt" text NOT NULL,
  "project_id" uuid NOT NULL REFERENCES "public"."projects"(id),
  "user_id" uuid NOT NULL REFERENCES "public"."users"(id),
  "memory_enabled" boolean DEFAULT true NOT NULL
);

-- Agents
ALTER TABLE "public"."agents" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own agents" ON "public"."agents";
CREATE POLICY "Users can manage their own agents" 
ON "public"."agents"
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create api_keys table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."api_keys" (
  "id" uuid NOT NULL PRIMARY KEY,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "public"."users"(id),
  "provider" text NOT NULL,
  "api_key_encrypted" text NOT NULL,
  "name" text NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL
);

-- API Keys
ALTER TABLE "public"."api_keys" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own API keys" ON "public"."api_keys";
CREATE POLICY "Users can manage their own API keys" 
ON "public"."api_keys"
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create api_usage table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."api_usage" (
  "id" uuid NOT NULL PRIMARY KEY,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "public"."users"(id),
  "project_id" uuid REFERENCES "public"."projects"(id),
  "agent_id" uuid REFERENCES "public"."agents"(id),
  "provider" text NOT NULL,
  "model" text NOT NULL,
  "tokens_prompt" integer NOT NULL,
  "tokens_completion" integer NOT NULL,
  "tokens_total" integer NOT NULL,
  "status" text DEFAULT 'success' NOT NULL,
  "duration_ms" integer,
  "metadata" jsonb
);

-- API Usage
ALTER TABLE "public"."api_usage" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own API usage" ON "public"."api_usage";
CREATE POLICY "Users can view their own API usage" 
ON "public"."api_usage"
USING (auth.uid() = user_id);

-- Create versions table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."versions" (
  "id" uuid NOT NULL PRIMARY KEY,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "content_id" uuid NOT NULL,
  "content_type" text NOT NULL,
  "content_snapshot" jsonb NOT NULL,
  "metadata" jsonb,
  "project_id" uuid NOT NULL REFERENCES "public"."projects"(id),
  "user_id" uuid NOT NULL REFERENCES "public"."users"(id),
  "parent_version_id" uuid REFERENCES "public"."versions"(id),
  "is_current" boolean DEFAULT true NOT NULL
);

-- Versions
ALTER TABLE "public"."versions" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own versions" ON "public"."versions";
CREATE POLICY "Users can manage their own versions" 
ON "public"."versions"
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create agent_ratings table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."agent_ratings" (
  "id" uuid NOT NULL PRIMARY KEY,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "agent_id" uuid NOT NULL REFERENCES "public"."agents"(id),
  "user_id" uuid NOT NULL REFERENCES "public"."users"(id),
  "rating" integer NOT NULL,
  "feedback" text,
  "session_id" uuid
);

-- Agent Ratings
ALTER TABLE "public"."agent_ratings" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own agent ratings" ON "public"."agent_ratings";
CREATE POLICY "Users can manage their own agent ratings" 
ON "public"."agent_ratings"
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id); 