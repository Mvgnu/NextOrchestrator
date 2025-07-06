# Tests

This directory contains Jest unit tests for server routes and library modules.

- `chat-route.test.ts` verifies authentication and authorization logic for the chat API route.
- `share-route.test.ts` ensures contexts can be duplicated only with proper access.
- `export-route.test.ts` checks context export permissions and markdown generation.
- `sync-models-route.test.ts` covers admin-only access for model synchronization.
- `env.test.ts` validates environment variable helpers using Zod.
- `utils.test.ts` covers common utility functions.
- `agent-service.test.ts` tests AgentService CRUD operations and access checks.

These tests use Jest with `ts-jest` to run TypeScript test files.
