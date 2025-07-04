# Deployment Guide

This guide provides instructions for deploying the MARS Next application.

## Prerequisites

*   A Node.js environment (compatible with Next.js 14+).
*   Access to a Supabase project.
*   A hosting platform account (Vercel is recommended).
*   Git repository set up.

## Environment Variables

The application requires several environment variables to be configured in your deployment environment. Create a `.env.local` file for local development or set these in your hosting provider's settings (e.g., Vercel Environment Variables).

**Never commit secrets directly to your repository!** Use `.env.example` as a template.

### Required for Core Functionality:

*   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase project public anonymous key.
*   `NEXTAUTH_SECRET`: A strong, random secret string for NextAuth.js session encryption. You can generate one using `openssl rand -base64 32`.
*   `NEXTAUTH_URL`: The canonical URL of your deployed application (e.g., `https://your-app.vercel.app`).

### Required for OAuth Providers (Only if using them):

*   `GITHUB_ID`: GitHub OAuth App Client ID.
*   `GITHUB_SECRET`: GitHub OAuth App Client Secret.
*   `GOOGLE_CLIENT_ID`: Google Cloud OAuth 2.0 Client ID.
*   `GOOGLE_CLIENT_SECRET`: Google Cloud OAuth 2.0 Client Secret.

### Optional / Feature-Related:

*   `OPENAI_API_KEY`: Default OpenAI key (can be overridden by user settings).
*   `ANTHROPIC_API_KEY`: Default Anthropic key.
*   `GOOGLE_API_KEY`: Default Google AI key.
*   `XAI_API_KEY`: Default Grok/xAI key.
*   `DEEPSEEK_API_KEY`: Default DeepSeek key.
*   `ENABLE_AI_REVIEW_LOOP`: (Default: `false`) Feature flag.
*   `ENABLE_MULTI_AGENT_DEBUG`: (Default: `false`) Feature flag.
*   `MAX_CONCURRENT_AGENTS`: (Default: `5`) Configuration value.
*   `ADMIN_SECRET_KEY`: A secure secret key required to run admin endpoints like `/api/admin/initialize-presets`. **Set this securely if using admin features.**

## Database Setup (Supabase)

Ensure your Supabase project associated with `NEXT_PUBLIC_SUPABASE_URL` has the necessary tables and schema.

*   **Required Tables:** `projects`, `users`, `contexts`, `agents`, `api_keys`, `api_usage`, `agent_presets`, `versions`, `agent_ratings` (and potentially others based on NextAuth adapter usage).
*   **Schema Migrations:** If you developed locally and made schema changes (e.g., using Supabase Studio or CLI), ensure these migrations are applied to your production Supabase instance before deploying the application. Refer to Supabase documentation for managing migrations.
*   **RLS Policies:** Ensure appropriate Row Level Security (RLS) policies are enabled on your Supabase tables, especially for tables containing user-specific data (`projects`, `agents`, `contexts`, `api_keys`, `api_usage`, `agent_ratings`). Policies should restrict access based on the authenticated user's ID (`auth.uid()`).

## Deployment to Vercel (Recommended)

1.  **Push to Git:** Ensure your code is pushed to a Git repository (GitHub, GitLab, Bitbucket).
2.  **Import Project:** In your Vercel dashboard, import the project from your Git repository.
3.  **Framework Preset:** Vercel should automatically detect it as a Next.js project.
4.  **Configure Environment Variables:** Go to the project settings in Vercel -> Environment Variables. Add all the required variables listed above, ensuring secrets are handled securely.
5.  **Deploy:** Trigger a deployment. Vercel will build the Next.js application and deploy it.

## Running Locally

1.  Clone the repository.
2.  Install dependencies: `npm install` or `yarn install`.
3.  Create a `.env.local` file by copying `.env.example`.
4.  Fill in the required environment variables in `.env.local` (Supabase keys, NextAuth secret, etc.).
5.  Run the development server: `npm run dev` or `yarn dev`.
6.  Open `http://localhost:3000` in your browser.

## Building for Production Locally

1.  Ensure all environment variables are set.
2.  Run `npm run build` or `yarn build`.
3.  Run `npm run start` or `yarn start`. 