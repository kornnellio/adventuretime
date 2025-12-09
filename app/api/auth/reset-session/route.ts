import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('Reset Session API - Starting session reset');
    
    // Create a response that will clear all cookies
    const response = NextResponse.json({ 
      success: true, 
      message: 'Session reset successfully' 
    });
    
    // Clear specific auth cookies
    const authCookieNames = [
      'next-auth.session-token',
      'next-auth.callback-url',
      'next-auth.csrf-token',
      '__Secure-next-auth.session-token',
      '__Secure-next-auth.callback-url',
      '__Secure-next-auth.csrf-token',
      '__Host-next-auth.csrf-token',
      'next-auth.pkce.code_verifier',
      '.next-auth.session-token',
      '.next-auth.callback-url',
      '.next-auth.csrf-token'
    ];
    
    authCookieNames.forEach(name => {
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
    
    console.log('Reset Session API - Session reset completed');
    return response;
  } catch (error) {
    console.error('Session reset error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset session' },
      { status: 500 }
    );
  }
} 