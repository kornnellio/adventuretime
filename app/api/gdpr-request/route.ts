import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Here you would:
    // 1. Save the request to your database
    // 2. Send an email notification to the admin
    // 3. Send a confirmation email to the user
    
    // For now we'll just return a success message
    // In a real implementation, you would handle emails and database operations

    return NextResponse.json(
      { 
        success: true, 
        message: 'Your GDPR data request has been received. We will process it and respond within 30 days.'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing GDPR request:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
} 