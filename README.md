This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Authentication System

This project implements a comprehensive authentication system using Auth.js (NextAuth.js v5) with the following features:

### Authentication Methods
- Email/Password authentication
- Google OAuth authentication

### User Management
- User registration with validation
- Secure password hashing with bcrypt
- User profiles and settings
- Protected routes with middleware

### Database Integration
- MongoDB storage for user data
- User model with Mongoose

### Setup

1. Configure your environment variables in `.env.local`:
   ```
   # Auth.js / NextAuth.js Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_secure_secret_key
   
   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   
   # MongoDB
   MONGODB_URI=your_mongodb_connection_string
   ```

2. Set up a Google OAuth client in the [Google Cloud Console](https://console.cloud.google.com/):
   - Create a new project
   - Configure the OAuth consent screen
   - Create OAuth client ID credentials
   - Add your development and production redirect URIs (e.g., `http://localhost:3000/api/auth/callback/google`)

### User Data Schema

The user data is stored in MongoDB with the following schema:

```typescript
interface User {
  _id: string;
  name: string;
  surname: string;
  username: string;
  email: string;
  password?: string; // Hashed, not present for OAuth users
  oauth_provider: string | null;
  address: Array<{
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  }>;
  sign_up_date: Date;
  orders: Array<{
    orderId: string;
    date: Date;
    products: any[];
    total: number;
    status: string;
  }>;
}
```
