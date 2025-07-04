import { NextAuthConfig, type User, type Account, type Profile, type Session } from "next-auth";
import type { AdapterUser } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";
import type { User as NextAuthUser } from 'next-auth'; // Keep for UserWithToken base
import GithubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import NextAuth from "next-auth"; // Import NextAuth

// PG Adapter imports
import PostgresAdapter from "@auth/pg-adapter"
import { dbPool, query } from "@/lib/db";

// Add this interface definition
interface UserWithToken extends NextAuthUser {
  accessToken?: string | null;
  password_hash?: string | null; // For credentials provider matching
  // Supabase specific avatar_url is now image
}

export const authConfig: NextAuthConfig = {
  adapter: PostgresAdapter(dbPool),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<UserWithToken | null> {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Get user from PostgreSQL database
          const result = await query('SELECT id, name, email, image, password_hash FROM users WHERE email = $1', [credentials.email]);
          
          if (result.rows.length === 0) {
            console.error('User not found with email:', credentials.email);
            return null;
          }
          const user = result.rows[0] as UserWithToken; // Cast to include password_hash

          if (!user.password_hash) {
            console.error('User found but missing password hash:', user.email);
            return null; // Or handle as appropriate (e.g. user signed up via OAuth)
          }

          // Check if password matches
          const isValid = await bcrypt.compare(credentials.password, user.password_hash);

          if (!isValid) {
            console.error('Invalid password for user:', user.email);
            return null
          }
          
          // Create a JWT token (this part remains largely the same, sub is user.id)
          const accessToken = jwt.sign(
            {
              aud: "authenticated", // Standard claim
              exp: Math.floor(Date.now() / 1000) + (process.env.JWT_EXPIRATION_SECONDS ? parseInt(process.env.JWT_EXPIRATION_SECONDS) : 60 * 60 * 24 * 7), // e.g., 1 week or from env
              sub: user.id, // Subject is the user ID from PG
              // user_metadata can be simplified or populated as needed
              user_metadata: { 
                id: user.id,
                email: user.email,
                // Add other metadata if necessary
              },
              role: "authenticated", // Or a role from user object if available
            },
            process.env.NEXTAUTH_SECRET || "supersecret" // Ensure this secret is strong and in env
          );

          // Return user object including the JWT access token
          return {
            id: user.id,
            name: user.name || null, // Ensure name is handled if null
            email: user.email,
            image: user.image || null,
            accessToken,
          };
        } catch (error) {
          console.error('Credential authentication error:', error)
          return null
        }
      }
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/new-user'
  },
  callbacks: {
    async jwt({ token, user, account, profile, trigger }: { token: JWT; user?: UserWithToken | User | AdapterUser; account?: Account | null; profile?: Profile; trigger?: "signIn" | "signUp" | "update" }) {

      // Persist the OAuth access_token and or the user id to the token right after signin
      if (account && user) {
        // For OAuth sign-in (like GitHub, Google)
        // The adapter handles user creation/linking.
        // `account.access_token` is provider specific.
        // `user.id` should be populated by the adapter.
        token.accessToken = account.access_token; // Keep if needed downstream
        token.id = user.id;
      } else if (user && 'accessToken' in user && typeof user.accessToken === 'string') {
        // For Credentials sign-in - Use the typed user object
        // This accessToken is our self-generated JWT from authorize
        token.accessToken = (user as UserWithToken).accessToken;
        token.id = user.id;
      }
      
      
      
      // Simplified role assignment:
      // The previous Supabase call for role is removed.
      // All authenticated users get 'user' role.
      // If specific roles are needed, they should be added to the 'users' table
      // and fetched here or ideally during the authorize/OAuth profile step.
      if (token.id && !token.role) {
        token.role = 'user'; // Default role
      } else if (!token.id) {
        // Should not happen if sign-in was successful
        console.warn("JWT Callback: token.id is missing.");
      }
      
      return token;
    },
    async session({ session, token, user }: { session: Session; token: JWT; user: AdapterUser }) {

      // Add custom properties from the token to the session
      // Ensure session.user exists before assigning properties
      if (!session.user) {
        // session.user = {} as any; // Initialize if it doesn't exist (shouldn't happen with default setup but safe)
        // In v5, session.user should be automatically populated or can be augmented.
        // If it's consistently undefined here, it might be an issue with how session object is structured or expected by v5
      }
      
      if (token.id) {
        // If session.user is not guaranteed, we might need to create it.
        if (!session.user) session.user = { id: token.id as string };
        else session.user.id = token.id as string; // Ensure id is string
      }
      if (token.role) {
        // If session.user is not guaranteed, we might need to create it.
        if (!session.user) session.user = { role: token.role as string } as any; // May need more complete user structure
        else (session.user as any).role = token.role as string; // Add role to session
      } else {
         // Assign a default role if somehow not found in token
        // If session.user is not guaranteed, we might need to create it.
        if (!session.user) session.user = { role: 'user' } as any; // May need more complete user structure
        else (session.user as any).role = 'user'; 
      }

      // Add the access token to the session
      // This accessToken is the one from the JWT token (either OAuth or our own)
      if (token.accessToken) {
        (session as any).accessToken = token.accessToken; 
      }
      
      return session
    }
  },
  session: {
    strategy: "jwt", // Keeping JWT strategy for now
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
} 

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig); 