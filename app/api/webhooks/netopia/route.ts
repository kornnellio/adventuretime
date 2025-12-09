import { NextResponse } from 'next/server';
import { handleNetopiaWebhook } from '@/lib/actions/payment';

export async function POST(req: Request) {
  try {
    // Get the raw body from the request
    const body = await req.json();
    
    console.log('Received Netopia webhook notification:', JSON.stringify(body, null, 2));
    
    if (!body || !body.order || !body.payment) {
      return NextResponse.json(
        { success: false, error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }
    
    // Process the webhook notification
    const result = await handleNetopiaWebhook(body);
    
    if (!result.success) {
      const errorMessage = 'error' in result ? result.error : 'Unknown error processing webhook';
      console.error('Error processing Netopia webhook:', errorMessage);
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      );
    }
    
    // Handle different response structures from different webhook handlers
    const responseData: any = {
      success: true,
      message: result.message || 'Webhook processed successfully'
    };
    
    // Add status fields based on what's available in the result
    if ('bookingStatus' in result) {
      responseData.bookingStatus = result.bookingStatus;
    }
    if ('voucherStatus' in result) {
      responseData.voucherStatus = result.voucherStatus;
    }
    if ('bookingId' in result) {
      responseData.bookingId = result.bookingId;
    }
    if ('voucherPurchaseId' in result) {
      responseData.voucherPurchaseId = result.voucherPurchaseId;
    }
    if ('orderId' in result) {
      responseData.orderId = result.orderId;
    }
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error handling Netopia webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Error processing payment notification' },
      { status: 500 }
    );
  }
} 