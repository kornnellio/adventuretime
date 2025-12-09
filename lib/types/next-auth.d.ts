import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username: string;
      surname: string;
      oauth_provider: string | null;
    } & DefaultSession['user'];
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