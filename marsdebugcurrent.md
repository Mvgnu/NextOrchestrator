MarsNext Task Tracker
High Priority (Core Functionality / Blocking Issues):
Context Creation RLS:
Issue: new row violates row-level security policy for table "contexts" error when creating contexts.
Status: ✅ FIXED by correcting the /projects/[id]/contexts/new/page.tsx to use the context-client.ts instead of directly calling the context-service.ts, which ensures the request goes through our authenticated API route.

Agent Creation RLS:
Issue: Preventing similar RLS issues with the agents table.
Status: ✅ FIXED in a similar way, ensuring agent creation goes through the API route which uses an authenticated Supabase client.

Context Creation Flow (/projects/[id]/contexts/):
Issue: The user mentioned context creation via chat is mocked/simulated on this page. The "Preview" button is also non-functional.
Action (AI): Investigate the marsnext/app/projects/[id]/contexts/page.tsx (and related components) to understand the current mock flow and implement the actual context creation logic and fix the preview button.

Context Digestion (Core):
Issue: Context digestion in lib/context-service.ts is currently mocked/simulated.
Action (AI): Replace mock logic with actual AI-powered digestion (requires OpenAI API key).

Saving Context Digests:
Issue: No backend mechanism exists to save the generated digests. The "Save Digest" button is non-functional and missing in some forms.
Action (AI): Implement API endpoint(s) and database logic (potentially a new context_digests table or updating contexts metadata) to store digests. Implement the "Save Digest" button functionality and add it where missing (agent assignment, context append forms).
Status: Added more detailed error handling in API route to expose RLS errors properly

Medium Priority (Agent Workflow / UI):
Agent Assignment Logic:
Issue: Assigning agents to contexts/projects is mocked/simulated.
Action (AI): Implement the backend logic for associating agents with contexts or projects.

Agent Assignment UI:
Issue: UI uses multi-select, needs "Create New Agent" flow.
Action (AI): Modify the relevant UI component(s) to use single-select for agent assignment and add a way to trigger agent creation. Connect UI to the backend logic (#5).
Status: Added agent selection on context digester (still needs wiring to backend)

Low Priority (Dev Environment / Verification):
Chat Page Loading:
Issue: Ensure the chat page (/projects/[id]/chat) loads without the getProject error after recent fixes. ## loads correctly now! SOLVED ##
Action: User needs to verify.
Development Server:
Issue: npm run dev failed in the user's terminal log.
Action (AI): Ensure the command is run from the correct directory (marsnext).

For all Database operations:
we are using a REST API approach where:
The client component calls the API route with just the name and description
The API route gets the authenticated user from the session
The API route calls ProjectService with all three parameters (name, description, user_id)

## to be inquired!
projectid/agents 404
projectid/agents/new 404
projectid/settings 404

## to be refactored / removed
/contexts/ links to /contexts/new should link to /context (context builder); /contexts/new should be removed
/context -> proceed without digest (not recommended tooltip) option

##
/context -> allow choosing an agent for digest!
Status: ✅ Added agent selection dropdown in the context digest flow

Agentic Feedback System:
Status: ✅ Agentic feedback system (per-step feedback, agentic traceability, UI, API, and documentation) implemented and stable. See /docs/agentic-feedback.md for living documentation.