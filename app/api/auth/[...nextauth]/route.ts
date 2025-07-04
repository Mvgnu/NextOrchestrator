import { handlers } from "@/lib/auth";

/**
 * Auth.js (NextAuth.js v5) route handlers.
 * 
 * This file imports the `handlers` object from our main Auth.js configuration
 * in `@/lib/auth.ts` and exports the `GET` and `POST` methods from it.
 * These handlers are responsible for all authentication-related API endpoints
 * (e.g., /api/auth/signin, /api/auth/callback/github, /api/auth/session, etc.).
 *
 * For more details on Auth.js v5 setup, refer to the official documentation.
 */
export const { GET, POST } = handlers;

// Optional: If you want to force Edge runtime for these auth routes
// export const runtime = "edge"; 