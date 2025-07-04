# MarsNext: Supabase to PostgreSQL Migration Tasks

## I. PostgreSQL Setup & Configuration

- [ ] **1. Setup PostgreSQL Instance:**
    - [ ] 1.1. Decide: Local Install vs. Docker. (Recommendation: Docker for consistency)
    - [ ] 1.2. Install/Run PostgreSQL.
    - [ ] 1.3. Create a dedicated database for `marsnext`.
    - [ ] 1.4. Create a dedicated user for the `marsnext` database with necessary privileges.

- [ ] **2. Update Environment Variables:**
    - [ ] 2.1. Create `env.local.postgres` (or rename/update `env.local.supabase`).
    - [ ] 2.2. Add PostgreSQL connection details (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD).
    - [ ] 2.3. Remove Supabase-specific environment variables (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, etc.).
    - [ ] 2.4. Ensure `.env*.postgres` is in `.gitignore`.

## II. Backend Code Refactoring (Completed for core services and auth)

- [x] **3. Choose and Integrate PostgreSQL Client/ORM:**
    - [x] 3.1. Research and decide: `pg` (low-level driver)
    - [x] 3.2. Install the chosen library (`npm install pg @types/pg`).
    - [x] 3.3. Create a database connection module/service (`lib/db.ts`) to initialize and provide the client instance (`Pool`, `query`, `dbPool`).

- [x] **4. Schema Migration & Management:**
    - [x] 4.1. Inspect current Supabase schema.
    - [x] 4.2. Choose a schema migration tool (`node-pg-migrate`). Installed.
    - [x] 4.3. Set up the migration tool and create initial migration scripts based on the Supabase schema.
        - [x] `projects` table (00001)
        - [x] `contexts` table (00002)
        - [x] `agents` table (00003)
        - [x] `versions` table (00004)
        - [x] `contexts` add `metadata` (00005)
        - [x] `users`, `accounts`, `sessions`, `verification_token` tables (for NextAuth) (00006)
        - [x] `users` add `password_hash` (00007)
        - [x] `agents` add `project_id` (00008)
        - [x] `context_agents` table and `agent_context_role` enum (00009)
        - [x] `api_usage` table (00010)
        - [x] `agent_ratings` table (00011)
        - [x] `users` add `role` (00012)
        - [x] `agent_presets` table (00013)
        - [x] Relationships, indexes, and constraints handled in individual migration files.
    - [x] 4.4. Run initial migrations to create the schema in the new PostgreSQL database.

- [x] **5. Refactor Service Layer (`lib/*-service.ts`):**
    - [x] 5.1. `project-service.ts`: CRUD operations refactored.
    - [x] 5.2. `context-service.ts`: CRUD, versioning, OpenAI calls updated.
    - [x] 5.3. `agent-service.ts`: CRUD operations refactored, `project_id` handling.
    - [x] 5.4. `version-service.ts`: Refactored as a class with transaction support.
    - [x] 5.5. `agent-context-service.ts`: New service created for `context_agents` join table.
    - [x] 5.6. `api-usage-service.ts`: Refactored for PG, including summaries and agent performance.
    - [x] 5.7. `agent-preset-service.ts`: Refactored for PG, including system preset initialization.
    - [x] 5.8. Ensure error handling is appropriate for the new driver (Ongoing review).

- [x] **6. Authentication & Authorization Replacement:**
    - [x] 6.1. **Authentication:**
        - [x] Confirmed `NextAuth.js` setup (v5).
        - [x] Implemented `PostgresAdapter` from `@auth/pg-adapter`.
        - [x] Updated NextAuth configuration (`lib/auth.ts`).
        - [x] `app/api/auth/signup/route.ts` refactored for PG.
        - [ ] Migrate user data if necessary and feasible (Skipped for now, new users will be created in PG).
    - [x] 6.2. **Authorization (Replacing RLS):**
        - [x] Implemented application-level checks in service functions or API routes (Ongoing, primary checks in place for user ownership and roles where applicable).
        - [x] Review all data-accessing functions for necessary authorization logic (Ongoing review).
    - [x] 6.3. Agent Preset Routes (`/api/agent-presets`, `/api/agent-presets/[id]`):
        - [x] `/api/agent-presets`: `GET` (user), `POST` (create) - *Verified, uses AgentPresetService.*
        - [x] `/api/agent-presets/[id]`: `GET` (one), `PUT`/`PATCH` (update), `DELETE` (delete) - *Implemented.*
    - [ ] 6.4. Agent Routes (`/api/agents`, `/api/agents/[id]`, `/api/projects/[id]/agents/[agentId]/delete`):
        - [x] `/api/agents`: `GET` (all/project), `POST` (create) - *Verified, uses AgentService.*
        - [x] `/api/projects/[id]/agents/[agentId]/delete`: `DELETE` one agent for a project. - *Refactored to DELETE HTTP method, uses AgentService.*
        - [x] `/api/agents/[id]`: `GET` (one), `PATCH` (update) - *Implemented.*
    - [ ] 6.5. Context Routes (`/api/contexts`, `/api/contexts/[id]`, `/api/contexts/[id]/digest`, `/api/contexts/[id]/versions`):
        - [x] `/api/contexts`: `GET` (for project), `POST` (create) - *Verified, uses ContextService.*
        - [x] `/api/contexts/[id]/digest`: `POST` (save digest) - *Verified, uses ContextService.*
        - [x] `/api/contexts/[id]`: `GET` (one), `PATCH` (update), `DELETE` (delete) - *Implemented.*
        - [x] `/api/contexts/[id]/versions`: `POST` (create version) - *Implemented.*
    - [ ] 6.6. Admin Routes (`/api/admin/initialize-presets`):
        - [x] `/api/admin/initialize-presets`: `POST` - *Verified, uses AgentPresetService.initializeSystemPresets().*

- [x] **7. Update API Routes (`app/api/`):**
    - [x] 7.1. `/api/projects/route.ts`: `GET` all, `POST` create - Refactored.
    - [x] 7.2. `/api/projects/[id]/route.ts`: `GET` one, `PATCH` update, `DELETE` one - Refactored.
    - [x] 7.3. `/api/contexts/route.ts`: `GET` for project, `POST` create - Refactored.
    - [x] 7.4. `/api/contexts/[id]/digest/route.ts`: Uses `ContextService`, no direct DB client - OK.
    - [x] 7.5. `/api/agents/route.ts`: `GET` all/project, `POST` create - Refactored.
    - [x] 7.6. `/api/projects/[id]/agents/[agentId]/delete/route.ts`: `DELETE` - Refactored.
    - [x] 7.7. `/api/projects/[id]/chat/route.ts`: Uses services, `ContextService` import updated - OK.
    - [x] 7.8. `/api/contexts/agents/route.ts`: `POST` assign, `GET` assignments - Refactored for `AgentContextService`.
    - [x] 7.9. `/api/agent-performance/route.ts`: Uses `ApiUsageService` - OK.
    - [x] 7.10. `/api/agent-presets/route.ts`: `GET` all, `POST` create - Refactored.
    - [x] 7.11. `/api/agent-presets/[id]/route.ts`: `GET` one, `PUT` update, `DELETE` one - Created and refactored.
    - [x] 7.12. `/api/agents/[id]/route.ts`: `GET` one, `PATCH` update - Created and refactored.
    - [x] 7.13. `/api/contexts/[id]/route.ts`: `GET` one, `PATCH` update, `DELETE` one - Created and refactored.
    - [x] 7.14. `/api/admin/initialize-presets/route.ts`: Uses `AgentPresetService` - Reviewed, OK.
    - [ ] Ensure authenticated user information is correctly passed to service layers for authorization (Largely done, ongoing review).
    - [ ] Update error handling and response formats if necessary (Some improvements made, ongoing review).

## III. Data & Testing (Pending)

- [ ] **8. IRRELEVANT

- [ ] **9. Thorough Testing:**
    - [ ] 9.1. Unit tests for service functions.
    - [ ] 9.2. Integration tests for API routes.
    - [ ] 9.3. End-to-end testing of all application flows:
        - [ ] User signup/login.
        - [ ] Project creation, viewing, updating, deletion.
        - [ ] Context creation, viewing, updating, deletion.
        - [ ] Agent creation, viewing, updating, deletion.
        - [ ] Chat functionality.
        - [ ] Context digestion and saving.
        - [ ] Agent preset management.
        - [ ] Agent-Context assignment.
        - [ ] Usage tracking and performance dashboards.
    - [ ] 9.4. Test authorization rules.

## IV. Cleanup & Documentation (Pending)

- [ ] **10. Remove Supabase Dependencies:**
    - [ ] 10.1. Uninstall Supabase client libraries.
    - [ ] 10.2. Remove any remaining Supabase-specific code or configurations.
    - [ ] 10.3. Clean up `supabase/` directory.

- [ ] **11. Update Documentation:**
    - [ ] 11.1. Update `README.md` with new setup instructions.
    - [ ] 11.2. Update `DEPLOYMENT.md` if applicable.
    - [ ] 11.3. Archive or remove Supabase-specific documentation.

## V. Future Considerations (Post-Migration)

- [x] **12. Connection Pooling:**
    - [x] Implemented connection pooling (`dbPool` from `pg`) in `lib/db.ts`.
- [ ] **13. Backup and Recovery Strategy:**
    - [ ] Define and implement a backup and recovery strategy for the PostgreSQL database.
- [ ] **14. Monitoring and Logging:**
    - [ ] Set up monitoring and logging for the PostgreSQL instance and database interactions.

- [ ] **8. Resolve `fs` module error (Module not found: Can't resolve 'fs')**
    - [x] Primarily affected `app/projects/[id]/contexts/[contextId]/page.tsx` due to direct service import. *Fixed by moving to API calls.*
    - [ ] Systematically check other client-facing pages/components that might be incorrectly importing server-side code (`lib/*.ts` files that use `dbPool`).

## III. Testing & Refinement

- [ ] **9. Frontend Component/Page Adjustments:**
    - [ ] Review and update UI components that relied on Supabase-specific client calls or types.
    - [x] `app/projects/[id]/page.tsx`: Removed Supabase types, adjusted agent config access.
    - [x] `app/projects/[id]/contexts/[contextId]/page.tsx`: Refactored to use API calls, resolving 'fs' module error. Added version creation UI flow.
    - [ ] `app/projects/[id]/contexts/new/page.tsx`: Ensure this uses API routes for context creation.
    - [x] `app/projects/[id]/agents/new/page.tsx`: *Created page for new agent creation, submits to API.*
    - [ ] `app/projects/[id]/agents/[agentId]/edit/page.tsx`: Create or refactor for editing agents via API.
    - [ ] `app/dashboard/page.tsx`: Verify data fetching (projects, usage summary) uses new services/API routes.
    - [ ] `app/dashboard/agent-performance/page.tsx`: Verify `getAgentPerformanceData` via API.
    - [ ] `app/dashboard/usage/page.tsx`: Verify `getUserUsageRecords` via API.
    - [ ] Login/Signup pages (`app/auth/signin/page.tsx`, `app/auth/signup/page.tsx`): Already refactored for PG.
    - [ ] Agent Preset management UI (if any beyond API interaction) - e.g., a page to list/edit user presets or view system presets.
