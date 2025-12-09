import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    // Revalidate the adventures page cache
    revalidatePath('/adventures');
    revalidatePath('/control-panel/adventures');
    revalidatePath('/control-panel/adventure-categories');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Adventures page cache revalidated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error revalidating adventures cache:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to revalidate cache' 
    }, { status: 500 });
  }
} 