import 'next-auth';
import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's id */
      id: string
      /** The user's name */
      name?: string | null
      /** The user's email address */
      email?: string | null
      /** The user's image url */
      image?: string | null
      /** The user's role. */
      role?: string
    } & DefaultSession['user']
  }
  
  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User extends DefaultUser {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    /** The user's role. */
    role?: string
  }
}

declare module 'next-auth/jwt' {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends DefaultJWT {
    /** The user's role. */
    role?: string
    /** User ID */
    id?: string
  }
} 