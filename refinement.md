# Refinement TODOs

This document aggregates outstanding work discovered while reviewing the project plans and codebase. Items are grouped by area for easier tracking.

## From `plan.md`

- Conduct thorough testing and add automated coverage. _(agent service tests added)_
- Performance optimisation and final UI refinements (spacing, mobile, palette, accessibility).
- ~~Integrate connection pooling for database operations.~~ _(addressed via `pg` Pool and env config)_
- Create comprehensive documentation and deployment scripts. _(deploy helper added)_
- Complete plugin system and agent simulation features (plugin architecture, tool connections, debate mode, etc.).
- Implement timeline view and mobile app support.
- Refactor authentication logic and routes to use Prisma/PostgreSQL.
- Current sprint items: data visualisation improvements, CI/CD setup, security testing.

## From `release-plan.md`

- Implement virtualized lists for very large datasets. _(agents page now virtualized using react-window)_
- ~~Optimise markdown rendering for large documents.~~ _(implemented via `OptimizedMarkdownRenderer` and integrated into pages)_
- ~~Add interactive onboarding for new users.~~ _(basic guided flow added)_

## Codebase Observations

- ~~Dashboard data fetching is inefficient; optimise queries in `app/dashboard/page.tsx`.~~ _(addressed)_
- ~~Admin model sync route lacks role checks (`app/api/admin/sync-models/route.ts`).~~ _(addressed)_
- ~~Project chat route uses placeholder access control (`app/api/projects/[id]/chat/route.ts`).~~ _(addressed)_
- ~~Context export route lacks access verification (`app/api/contexts/[id]/export/route.ts`).~~ _(addressed)_
- ~~Context service includes stubbed methods requiring refactor for PostgreSQL.~~ _(comment removed; methods implemented)_
- ~~Add context sharing endpoint to allow reusing contexts across projects.~~ _(addressed)_
- ~~Model management service missing provider cases for Gemini, DeepSeek, xAI etc.~~ _(partial support added)_
- ~~Documentation pages under `docs/agents` still list TODOs and should be completed.~~ _(feedback docs cleaned up)_
- ~~Numerous `react/no-unescaped-entities` lint errors in documentation pages need fixing.~~ _(resolved by escaping quotes)_
- ~~Add automated API tests for context sharing and export routes.~~ _(completed)_
- ~~Address ESLint warnings by replacing <img> tags with Next.js Image component.~~ _(completed)_
- Added Jest setup with initial unit tests for environment helpers. Expand coverage to API routes next.

## Recommended Best Practices

- Introduce linting/formatting (ESLint + Prettier) and enforce via CI.
- [x] Set up base ESLint configuration using Next.js plugin.
- [x] Add environment variable validation (using `zod`) to `lib/env.ts`.
- ~~Set up automated tests (unit/integration) and a GitHub Actions workflow.~~ _(CI workflow added and basic tests implemented)_
- ~~Expand logging and error handling using a dedicated `pino` logger.~~
- ~~Consider stricter TypeScript configuration and remove unused defaults in `lib/db.ts`.~~ _(tsconfig cleaned and db helper simplified)_
- ~~Add optional SSL configuration for PostgreSQL via a `DB_SSL` environment variable.~~ (completed)
- ~~Add GitHub Actions workflow to run lint and tests on pull requests.~~ \*(completed)
- ~~Replace `console` statements with a structured logging library.~~ _(completed: `pino` wrapper)_
- ~~Provide a script to install dependencies and set up the local database for easier onboarding.~~ _(setup-dev.sh added)_
- ~~Audit client-side console statements and remove or replace with a browser-friendly logger for production builds.~~ _(completed)_

These points can guide future iterations to strengthen quality and maintainability.

## Completed Items

- Environment variable validation implemented in `lib/env.ts` using `zod`.
- Dashboard statistics query optimized and wired into `app/dashboard/page.tsx`.
- Admin role check enforced for `/api/admin/sync-models` route.
- Added generic model sync support for Google, DeepSeek and xAI providers.
- Project chat route now validates user access via `ProjectService.userHasAccessToProject`.
- Context export route validates user access with new `userHasAccessToContext` helper.
- Base ESLint configuration added for project linting.
- Implemented context sharing via `/api/contexts/[id]/share`.
- Began fixing documentation lint errors by escaping quotes in multiple pages.
- Implemented automated API tests for context sharing and export routes.
- Fixed parameter bug in context export route.
- Added project access check in context share route.
- Created GitHub Actions workflow for lint and tests.
- Integrated connection pooling using `pg` Pool with env-based configuration.
- Replaced `console` statements across services with `pino` based structured logging.
- Added automated tests for chat route access checks.
- Fixed anonymous default exports in service modules to satisfy ESLint.
- Added `selectedAgent` dependency to dashboard hook to resolve
  `react-hooks/exhaustive-deps` warning.
- Added DB_SSL flag for optional PostgreSQL SSL connections.
- Replaced Markdown img tags with Next.js Image component to satisfy lint rules.
- Added script `setup-dev.sh` and example DB vars for easier onboarding.
- Implemented virtualized agent list using react-window
- Integrated OptimizedMarkdownRenderer for large document performance.
- Created interactive onboarding page with step-by-step guide.
- Added Jest tests for admin model sync route.
- Replaced remaining console statements with logger across lib modules.
- Removed STUBBED comment and updated project agent retrieval docs.
- Added unit tests for utility helpers in lib/utils.ts for coverage.
- Added deploy helper script and updated README documentation.
- Converted remaining API route logs to use the logger.
- Documented helper scripts usage in `scripts/README.md`.
- Client-side console audit completed with new logger
- TypeScript config tightened and db helper cleaned up

- Added ApiUsageService unit tests and documentation

## New Observations (2025-07-30)

- Add environment configuration documentation covering all variables and setup instructions.
- Expand env helper tests to include failure cases when required variables are missing.
- Completed: added structured metadata tags to `env.ts` and `logger.ts` and documented these modules in `lib/README.md`.
