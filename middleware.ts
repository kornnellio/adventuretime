import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// List of authorized emails for control panel access
export const AUTHORIZED_EMAILS = [
  'filip.ilinca14@gmail.com',
  'office@adventuretime.ro',
  'andrei@ciocoiu.net',
  'wdatax@gmail.com'
];

export async function middleware(request: NextRequest) {
  // Check if the request is for the control panel
  if (request.nextUrl.pathname.startsWith('/control-panel')) {
    try {
      // Get the session token
      const token = await getToken({ req: request });
      
      // If no token, redirect to login
      if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      // Check if user's email is authorized
      if (!AUTHORIZED_EMAILS.includes(token.email as string)) {
        // If not authorized, redirect to home page
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (error) {
      console.error('Error in middleware:', error);
      // On error, redirect to home page
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  // Allow the request to proceed
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: '/control-panel/:path*'
}; 