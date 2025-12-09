import { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username: string;
      surname: string;
      oauth_provider: string | null;
    };
  }

  interface User {
    id: string;
    name: string;
    surname: string;
    username: string;
    email: string;
    oauth_provider?: string | null;
  }
}

// Extend the built-in JWT types
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    surname: string;
    oauth_provider?: string | null;
  }
} 