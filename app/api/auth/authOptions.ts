import bcrypt from 'bcrypt';
import { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import dbConnect from '@/lib/db';
import User from '@/lib/models/user';
import "@/lib/auth"; // Import extended types

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      },
      profile(profile) {
        // Extract name parts from the Google profile
        const [name, ...surnameParts] = profile.name?.split(' ') || ['', ''];
        const surname = surnameParts.join(' ');
        
        return {
          id: profile.sub,
          name: name || profile.given_name || '',
          surname: surname || profile.family_name || '',
          email: profile.email,
          username: profile.email.split('@')[0],
          oauth_provider: 'google',
          image: profile.picture,
        };
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          throw new Error('Invalid credentials');
        }

        await dbConnect();

        const user = await User.findOne({ email: credentials.email });

        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        const isPasswordCorrect = await user.comparePassword(credentials.password);

        if (!isPasswordCorrect) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user._id.toString(),
          name: user.name,
          surname: user.surname,
          email: user.email,
          username: user.username,
          oauth_provider: user.oauth_provider || null,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // For Google OAuth, create or update the user in our database
      if (account?.provider === 'google') {
        try {
          await dbConnect();
          
          const existingUser = await User.findOne({ email: user.email });
          
          if (!existingUser) {
            // Create a new user with Google OAuth info
            await User.create({
              name: user.name,
              surname: user.surname,
              username: user.username,
              email: user.email,
              oauth_provider: 'google',
              sign_up_date: new Date(),
              address: [],
              orders: [],
            });
          } else {
            // Update existing user with latest OAuth info
            // This handles the case where the user already has an account with the same email
            existingUser.name = user.name || existingUser.name;
            existingUser.surname = user.surname || existingUser.surname;
            
            // If the user doesn't have an OAuth provider set, set it to 'google'
            // This links the traditional account with Google
            if (!existingUser.oauth_provider) {
              existingUser.oauth_provider = 'google';
            }
            
            await existingUser.save();
          }
        } catch (error) {
          console.error('Error during Google sign in:', error);
          return false;
        }
      }
      // For credentials login, we don't need to do anything special
      // as the user is already in our database
      
      return true;
    },
    async jwt({ token, user, account }) {
      if (account && account.provider === 'google') {
        // Store Google OAuth provider info in the token
        token.oauth_provider = 'google';
        
        // For Google OAuth, we need to fetch the user ID from our database
        // since the ID from Google is different from our database ID
        if (user && user.email) {
          try {
            await dbConnect();
            const dbUser = await User.findOne({ email: user.email });
            if (dbUser) {
              token.id = dbUser._id.toString();
              token.username = dbUser.username;
              token.surname = dbUser.surname;
            }
          } catch (error) {
            console.error('Error fetching user in jwt callback:', error);
          }
        }
      } else if (user) {
        // For credentials login, the user object already has the correct ID
        token.id = user.id;
        token.username = user.username;
        token.surname = user.surname;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.surname = token.surname;
        session.user.oauth_provider = token.oauth_provider || null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 