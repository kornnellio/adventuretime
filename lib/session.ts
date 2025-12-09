import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/authOptions';

/**
 * Gets the current authenticated user from the session
 * @returns The current user or null if not authenticated
 */
export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.log('No authenticated user found in session');
      return null;
    }
    
    return session.user;
  } catch (error) {
    console.error('Error getting current user from session:', error);
    return null;
  }
} 