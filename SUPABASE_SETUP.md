# Supabase Setup for MARS Next

This guide walks you through setting up Supabase for authentication and database storage for the MARS Next application.

## 1. Create a Supabase Project

1. Sign up or log in to [Supabase](https://supabase.com/).
2. Create a new project from the dashboard.
3. Note down your project URL and anon key (you'll need these for environment variables).

## 2. Set Up Database Schema

The database schema is defined in the `types/supabase.ts` file. You'll need to create the tables in Supabase.

You can run the SQL migrations in the Supabase dashboard:

1. Go to your Supabase project dashboard.
2. Navigate to the SQL Editor.
3. Copy the contents of the migration file at `supabase/migrations/0001_add_password_auth.sql`.
4. Run the SQL script in the editor.

Alternatively, if you're using the Supabase CLI:

```bash
supabase migration up
```

## 3. Configure Environment Variables

Add the following to your `.env.local` file:

```
# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

For production, make sure to set these environment variables in your hosting provider.

## 4. OAuth Providers (Optional)

If you want to enable GitHub and Google authentication:

### GitHub

1. Go to GitHub Developer Settings > OAuth Apps > New OAuth App
2. Set the callback URL to `https://your-domain.com/api/auth/callback/github`
3. Add the client ID and secret to your environment variables:

```
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_secret
```

### Google

1. Go to the Google Cloud Console > APIs & Services > Credentials
2. Create OAuth client ID
3. Set the authorized redirect URI to `https://your-domain.com/api/auth/callback/google`
4. Add the client ID and secret to your environment variables:

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret
```

## 5. Row Level Security

The migration already sets up Row Level Security (RLS) policies for all tables. These policies ensure that:

- Users can only access their own data
- New users can be created during signup
- Each resource (projects, agents, etc.) is only accessible by its owner

## 6. Testing Authentication

To test the authentication flow:

1. Start your application with `npm run dev`
2. Navigate to `/auth/signup` to create a new account
3. Try logging in with the created credentials
4. Test OAuth providers if configured

## Troubleshooting

### Common Issues

1. **Authentication fails**: Check that your environment variables are set correctly
2. **Migration errors**: Ensure the SQL syntax is compatible with your Supabase version
3. **RLS blocking access**: Make sure you're signed in and using the correct user ID

### Supabase CLI Setup (Optional)

For local development with the Supabase CLI:

```bash
npm install -g supabase
supabase init
supabase start
```

This will set up a local Supabase instance for development. 