import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('Clear Session API - Starting cookie cleanup');
    
    // Create a response that will clear the auth cookies
    const response = NextResponse.json({ 
      success: true, 
      message: 'Session cleared successfully' 
    });
    
    // Clear all cookies related to authentication
    const cookieNames = [
      'next-auth.session-token',
      'next-auth.callback-url',
      'next-auth.csrf-token',
      '__Secure-next-auth.session-token',
      '__Secure-next-auth.callback-url',
      '__Secure-next-auth.csrf-token',
      '__Host-next-auth.csrf-token',
      'next-auth.pkce.code_verifier'
    ];
    
    cookieNames.forEach(name => {
      // Set cookies with expiration in the past to clear them
      response.cookies.set({
        name,
        value: '',
        expires: new Date(0),
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
      });
    });
    
    // Set cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    console.log('Clear Session API - Cookies cleared successfully');
    return response;
  } catch (error) {
    console.error('Session clear error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear session' },
      { status: 500 }
    );
  }
} 