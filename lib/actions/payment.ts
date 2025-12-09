'use server';

import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';
import dbConnect from '../db';
import User from '../models/user';
import Booking from '../models/booking';
import { emailService } from '../email';

/**
 * Initiate a Netopia payment for a booking
 */
export async function initiateNetopiaPayment(bookingId: string, phoneNumber?: string) {
  await dbConnect();
  
  // --- Development Mode Bypass ---
  if (process.env.NODE_ENV === 'development') {
    console.log('--- DEVELOPMENT MODE: Skipping Netopia Payment Initiation ---');
    try {
      // Check if this is a payment intent ID instead of a booking ID
      const { default: PaymentIntent } = await import('@/lib/models/paymentIntent');
      const { convertPaymentIntentToBooking } = await import('@/lib/actions/paymentIntent');
      
      let booking = null;
      let paymentIntent = null;
      
      // First try to find it as a booking
      if (mongoose.Types.ObjectId.isValid(bookingId)) {
        booking = await Booking.findById(bookingId);
        if (!booking) {
          // If not found as booking, try as payment intent
          paymentIntent = await PaymentIntent.findById(bookingId);
        }
      }
      
      // If no booking found, but we have a payment intent, convert it to a booking
      if (!booking && paymentIntent) {
        console.log(`--- DEVELOPMENT MODE: Found payment intent ${paymentIntent._id}, converting to booking... ---`);
        
        // Mark the payment intent as confirmed
        paymentIntent.paymentStatus = 'confirmed';
        paymentIntent.paymentUrl = 'dev-mode-bypass';
        
        const paymentDetails = {
          paymentAttempt: paymentIntent.paymentDetails?.paymentAttempt ? paymentIntent.paymentDetails.paymentAttempt + 1 : 1,
          paymentType: 'dev_bypass',
          paymentAmount: paymentIntent.advancePaymentAmount,
          totalPrice: paymentIntent.price * (paymentIntent.quantity || 1),
          quantity: paymentIntent.quantity || 1,
          status: 'confirmed',
          message: 'Payment bypassed in development mode for intent',
          dateTime: new Date()
        };
        paymentIntent.paymentDetails = paymentDetails;
        paymentIntent.paymentTransactionDetails = paymentDetails;
        
        await paymentIntent.save();
        
        // Convert the payment intent to a booking
        const conversionResult = await convertPaymentIntentToBooking(paymentIntent._id.toString());
        if (!conversionResult.success || !conversionResult.data || !conversionResult.data.bookingId) {
          console.error(`--- DEVELOPMENT MODE: Failed to convert payment intent to booking:`, conversionResult.error);
          return { success: false, error: conversionResult.error || 'Failed to convert payment intent to booking (Dev Mode)' };
        }
        
        // Get the newly created booking
        booking = await Booking.findById(conversionResult.data.bookingId);
        if (!booking) {
          return { success: false, error: 'Booking not found after conversion (Dev Mode)' };
        }
        
        console.log(`--- DEVELOPMENT MODE: Successfully converted payment intent to booking ${booking._id} ---`);
      }
      
      if (!booking) {
        return { success: false, error: 'Booking or Payment Intent not found (Dev Mode)' };
      }
      
      const user = await User.findById(booking.userId);
      if (!user) {
        return { success: false, error: 'User not found (Dev Mode)' };
      }

      // Simulate successful payment confirmation
      booking.status = 'awaiting confirmation'; // Or 'awaiting confirmation' if that's more appropriate
      booking.paymentUrl = 'dev-mode-bypass'; // Add a note for clarity
      
      const paymentDetails = {
          paymentAttempt: booking.paymentAttempt ? booking.paymentAttempt + 1 : 1,
          paymentType: 'dev_bypass',
          paymentAmount: booking.advancePaymentAmount || booking.price,
          status: 'confirmed',
          message: 'Payment bypassed in development mode',
          dateTime: new Date()
      };
      booking.paymentDetails = paymentDetails;
      booking.paymentTransactionDetails = paymentDetails; // Use same details for simplicity

      // Save phone number if provided
      if (phoneNumber) {
        booking.phoneNumber = phoneNumber;
        await booking.save();
        await User.updateOne(
          { _id: booking.userId, 'orders.orderId': booking.orderId },
          { $set: { 'orders.$.phoneNumber': phoneNumber } }
        );
      }

      await booking.save();

      // Update user order status
      await User.updateOne(
        { _id: booking.userId, 'orders.orderId': booking.orderId },
        { 
          $set: { 
            'orders.$.status': 'awaiting confirmation',
            'orders.$.statusMessage': 'Payment bypassed in development mode, awaiting capacity confirmation',
            'orders.$.paymentUrl': 'dev-mode-bypass',
            'orders.$.paymentDetails': paymentDetails,
            'orders.$.paymentTransactionDetails': paymentDetails,
            'orders.$.phoneNumber': booking.phoneNumber
          } 
        }
      );

      console.log(`--- DEVELOPMENT MODE: Booking ${booking._id} marked as awaiting confirmation ---`);

      revalidatePath(`/dashboard/bookings`); // Revalidate relevant paths
      revalidatePath(`/profile`);
      revalidatePath(`/control-panel/orders`);

      return { 
        success: true, 
        data: {
          // Return the actual payment result URL instead of the bypass string
          paymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/booking/payment-result?bookingId=${booking._id.toString()}&status=awaiting confirmation`, 
          bookingId: booking._id.toString(),
          orderId: booking.orderId,
          status: 'awaiting confirmation'
        }
      };
    } catch (devError) {
      console.error('Error during development mode payment bypass:', devError);
      return { 
        success: false, 
        error: devError instanceof Error ? devError.message : 'Failed during dev bypass' 
      };
    }
  }
  // --- End Development Mode Bypass ---

  // Original Production Logic Starts Here
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }
    
    const user = await User.findById(booking.userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    const netopiaAuthToken = process.env.NETOPIA_AUTH_TOKEN;
    const netopiaPosSignature = process.env.NETOPIA_POS_SIGNATURE;

    if (!netopiaAuthToken || !netopiaPosSignature) {
      return { success: false, error: 'Missing Netopia credentials in environment variables' };
    }

    // Determine the payment amount - use advancePaymentAmount if available, otherwise full price
    const paymentAmount = booking.advancePaymentAmount || booking.price;
    // Use phone number from booking if provided, otherwise fallback to user's profile phone
    const phoneToUse = booking.phoneNumber || user.phone || '';
    
    // Prepare user address information
    const userAddress = user.address && user.address.length > 0 ? user.address[0] : {};
    
    // Build the request payload
    const payload = {
      config: {
        emailTemplate: "confirm",
        notifyUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/webhooks/netopia`,
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/booking/payment-result?bookingId=${booking._id}`,
        language: "ro"
      },
      payment: {
        options: {
          installments: 1,
          bonus: 0
        }
      },
      order: {
        posSignature: netopiaPosSignature,
        dateTime: new Date().toISOString(),
        description: `Adventure booking: ${booking.adventureTitle}`,
        orderID: booking.orderId,
        amount: paymentAmount,
        currency: "RON",
        billing: {
          email: user.email,
          phone: phoneToUse,
          firstName: user.name,
          lastName: user.surname,
          city: userAddress.city || "",
          country: 642, // Romania country code
          countryName: "Romania",
          state: userAddress.state || "",
          postalCode: userAddress.zipCode || "",
          details: userAddress.street || ""
        }
      }
    };

    // Store original payment URL in booking.comments for retry purposes
    const paymentDetails = {
      paymentAttempt: booking.paymentAttempt ? booking.paymentAttempt + 1 : 1,
      paymentType: 'netopia',
      paymentAmount
    };
    
    booking.paymentDetails = paymentDetails;
    await booking.save();

    // Make the API request to Netopia
    const apiUrl = process.env.NETOPIA_USE_SANDBOX === 'true' 
      ? process.env.NETOPIA_SANDBOX_URL 
      : process.env.NETOPIA_PRODUCTION_URL;
    
    console.log(`Using Netopia API URL: ${apiUrl}/payment/card/start`);
    console.log('Request payload:', JSON.stringify(payload, null, 2));
    console.log('Request headers:', {
      'Content-Type': 'application/json',
      'Authorization': `${netopiaAuthToken.substring(0, 10)}...`
    });
      
    const response = await fetch(`${apiUrl}/payment/card/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': netopiaAuthToken
      },
      body: JSON.stringify(payload)
    });

    // Log response details
    console.log(`Response status: ${response.status} ${response.statusText}`);
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    // Parse the response JSON if possible
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing response JSON:', parseError);
      throw new Error(`Netopia API error: ${response.status} ${response.statusText} - Invalid JSON response`);
    }

    if (!response.ok) {
      throw new Error(`Netopia API error: ${response.status} ${response.statusText} - ${JSON.stringify(data)}`);
    }

    if (!data.payment?.paymentURL) {
      throw new Error('No payment URL in Netopia response');
    }

    // Store the payment URL in the booking for future reference
    booking.paymentUrl = data.payment.paymentURL;
    booking.status = 'pending_payment';
    await booking.save();

    // Update the corresponding order in the user's orders array
    await User.updateOne(
      { _id: booking.userId, 'orders.orderId': booking.orderId },
      { 
        $set: { 
          'orders.$.status': 'pending_payment',
          'orders.$.paymentUrl': data.payment.paymentURL,
          'orders.$.paymentDetails': paymentDetails,
          'orders.$.phoneNumber': booking.phoneNumber
        } 
      }
    );

    return { 
      success: true, 
      data: {
        paymentUrl: data.payment.paymentURL,
        bookingId: booking._id.toString(),
        orderId: booking.orderId
      }
    };
  } catch (error) {
    console.error('Error initiating Netopia payment:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to initiate payment' 
    };
  }
}

/**
 * Handle Netopia webhook response
 */
export async function handleNetopiaWebhook(payload: any) {
  await dbConnect();
  
  try {
    const { order, payment } = payload;
    
    if (!order?.orderID || !payment?.status) {
      throw new Error('Invalid webhook payload: missing required fields');
    }
    
    const orderId = order.orderID;
    const paymentStatus = payment.status;
    const paymentCode = payment.code;
    const paymentMessage = payment.message;
    
    console.log(`Processing webhook for orderId: ${orderId}, paymentStatus: ${paymentStatus}`);
    
    // Check if this is a voucher purchase (starts with VCH-)
    if (orderId.startsWith('VCH-')) {
      const { handleVoucherWebhook } = await import('./voucherPurchase');
      return await handleVoucherWebhook(orderId, paymentStatus, payment);
    }
    
    // Find the payment intent or booking by orderId
    // First try to find a payment intent (starting with INT-) 
    const isPaymentIntent = orderId.startsWith('INT-');
    
    if (isPaymentIntent) {
      // This is a payment intent
      const paymentIntent = await (await import('../models/paymentIntent')).default.findOne({ intentId: orderId });
      
      if (!paymentIntent) {
        throw new Error(`Payment intent not found for intentId: ${orderId}`);
      }
      
      // Find the user with this intent
      const user = await User.findById(paymentIntent.userId);
      if (!user) {
        throw new Error(`User not found for payment intent: ${orderId}`);
      }
      
      // Map Netopia payment status to our internal status
      let intentStatus = 'pending';
      let statusMessage = '';
      
      const statusMap: Record<number, { status: string, message: string }> = {
        1: { status: "pending", message: "Payment pending" },
        2: { status: "processing", message: "Payment processing" },
        3: { status: "awaiting confirmation", message: "Payment confirmed, awaiting capacity confirmation" },
        4: { status: "cancelled", message: "Payment cancelled by user" },
        5: { status: "declined", message: "Payment declined by bank" },
        7: { status: "expired", message: "Payment expired" },
        8: { status: "error", message: "Payment processing error" },
        9: { status: "error", message: "Payment processing error" },
        10: { status: "error", message: "Payment processing error" },
        12: { status: "declined", message: "Expired card" },
        16: { status: "declined", message: "Payment declined. Card presents a risk" },
        17: { status: "declined", message: "Invalid card number" },
        18: { status: "declined", message: "Closed card" },
        19: { status: "declined", message: "Expired card" },
        20: { status: "declined", message: "Insufficient funds" },
        21: { status: "declined", message: "Invalid CVV code" },
        22: { status: "declined", message: "Issuing bank error" },
        23: { status: "expired", message: "Payment session expired" },
        26: { status: "declined", message: "Card limit exceeded" },
        34: { status: "declined", message: "Transaction not allowed for this card" },
        35: { status: "declined", message: "Transaction declined by bank" },
        36: { status: "declined", message: "Transaction declined by anti-fraud system" },
        39: { status: "declined", message: "3DSecure authentication failed" },
        99: { status: "error", message: "General payment processing error" }
      };
      
      const statusInfo = statusMap[paymentStatus];
      if (statusInfo) {
        intentStatus = statusInfo.status;
        statusMessage = statusInfo.message;
      } else {
        intentStatus = 'error';
        statusMessage = `Unknown payment status: ${paymentStatus}`;
      }
      
      // For successful payments, also verify the payment code
      if (paymentStatus === 3 && paymentCode !== '00') {
        intentStatus = 'declined';
        statusMessage = `Invalid payment code for successful payment: ${paymentCode}`;
      }
      
      // Add payment message if available
      if (paymentMessage) {
        statusMessage += ` - ${paymentMessage}`;
      }
      
      // Add payment transaction details
      const transactionDetails = {
        ntpID: payment.ntpID,
        status: paymentStatus,
        code: paymentCode,
        message: paymentMessage,
        amount: payment.amount,
        currency: payment.currency,
        dateTime: new Date(),
        cardMasked: payment.instrument?.panMasked || '',
        authCode: payment.data?.AuthCode || '',
        rrn: payment.data?.RRN || ''
      };
      
      // Update payment intent status and transaction details
      paymentIntent.paymentStatus = intentStatus;
      paymentIntent.paymentTransactionDetails = transactionDetails;
      await paymentIntent.save();
      
      console.log(`Updated payment intent status to: ${intentStatus}`);
      
      // Prevent duplicate conversions and emails
      if ((paymentIntent as any).convertedToBookingId) {
        console.log(`Webhook already processed for intent ${orderId}, skipping conversion and emails.`);
        return {
          success: true,
          message: 'Webhook already processed',
          bookingId: (paymentIntent as any).convertedToBookingId,
          orderId: paymentIntent.intentId
        };
      }
      
      // Send appropriate email notifications based on payment status
      if (paymentStatus === 3) {  // Payment successful
        // Send payment confirmation email
        await emailService.sendPaymentConfirmation(
          `${user.name} ${user.surname}`,
          user.email,
          {
            orderId: paymentIntent.intentId,
            adventureTitle: paymentIntent.adventureTitle,
            date: paymentIntent.startDate,
            amount: payment.amount,
            currency: payment.currency,
            transactionId: payment.ntpID,
            paymentMethod: 'Card payment (Netopia)'
          }
        );
        
        // Convert the payment intent to a booking
        const { convertPaymentIntentToBooking } = await import('./paymentIntent');
        const conversionResult = await convertPaymentIntentToBooking(paymentIntent._id.toString());
        
        if (!conversionResult.success) {
          console.error('Failed to convert payment intent to booking:', conversionResult.error);
        }
        
        return {
          success: true,
          message: 'Payment confirmed and booking created',
          bookingStatus: 'confirmed',
          intentId: paymentIntent._id.toString(),
          orderId: paymentIntent.intentId
        };
      } else if ([4, 5, 7, 12, 16, 17, 18, 19, 20, 21, 22, 23, 26, 34, 35, 36, 39].includes(paymentStatus)) {
        // Send payment failed email for declined/failed payments
        await emailService.sendPaymentFailedNotification(
          `${user.name} ${user.surname}`,
          user.email,
          {
            orderId: paymentIntent.intentId,
            adventureTitle: paymentIntent.adventureTitle,
            date: paymentIntent.startDate,
            failureReason: statusMessage,
            paymentRetryUrl: `${process.env.NEXT_PUBLIC_APP_URL}/booking/payment-intent?intentId=${paymentIntent._id.toString()}`
          }
        );
      }
      
      return {
        success: true,
        message: statusMessage,
        bookingStatus: intentStatus,
        intentId: paymentIntent._id.toString(),
        orderId: paymentIntent.intentId
      };
    } else {
      // This is an existing booking (legacy support)
      const booking = await Booking.findOne({ orderId });
      
      if (!booking) {
        throw new Error(`Booking not found for orderId: ${orderId}`);
      }
      
      // Find the user with this order
      const user = await User.findOne({ 'orders.orderId': orderId });
      if (!user) {
        throw new Error(`User not found for orderId: ${orderId}`);
      }
      
      // Map Netopia payment status to our internal status
      let bookingStatus = 'pending';
      let statusMessage = '';
      
      const statusMap: Record<number, { status: string, message: string }> = {
        1: { status: "pending", message: "Payment pending" },
        2: { status: "processing", message: "Payment processing" },
        3: { status: "awaiting confirmation", message: "Payment confirmed, awaiting capacity confirmation" },
        4: { status: "cancelled", message: "Payment cancelled by user" },
        5: { status: "declined", message: "Payment declined by bank" },
        7: { status: "expired", message: "Payment expired" },
        8: { status: "error", message: "Payment processing error" },
        9: { status: "error", message: "Payment processing error" },
        10: { status: "error", message: "Payment processing error" },
        12: { status: "declined", message: "Expired card" },
        16: { status: "declined", message: "Payment declined. Card presents a risk" },
        17: { status: "declined", message: "Invalid card number" },
        18: { status: "declined", message: "Closed card" },
        19: { status: "declined", message: "Expired card" },
        20: { status: "declined", message: "Insufficient funds" },
        21: { status: "declined", message: "Invalid CVV code" },
        22: { status: "declined", message: "Issuing bank error" },
        23: { status: "expired", message: "Payment session expired" },
        26: { status: "declined", message: "Card limit exceeded" },
        34: { status: "declined", message: "Transaction not allowed for this card" },
        35: { status: "declined", message: "Transaction declined by bank" },
        36: { status: "declined", message: "Transaction declined by anti-fraud system" },
        39: { status: "declined", message: "3DSecure authentication failed" },
        99: { status: "error", message: "General payment processing error" }
      };
      
      const statusInfo = statusMap[paymentStatus];
      if (statusInfo) {
        bookingStatus = statusInfo.status;
        statusMessage = statusInfo.message;
      } else {
        bookingStatus = 'error';
        statusMessage = `Unknown payment status: ${paymentStatus}`;
      }
      
      // For successful payments, also verify the payment code
      if (paymentStatus === 3 && paymentCode !== '00') {
        bookingStatus = 'declined';
        statusMessage = `Invalid payment code for successful payment: ${paymentCode}`;
      }
      
      // Add payment message if available
      if (paymentMessage) {
        statusMessage += ` - ${paymentMessage}`;
      }
      
      // Add payment transaction details
      const transactionDetails = {
        ntpID: payment.ntpID,
        status: paymentStatus,
        code: paymentCode,
        message: paymentMessage,
        amount: payment.amount,
        currency: payment.currency,
        dateTime: new Date(),
        cardMasked: payment.instrument?.panMasked || '',
        authCode: payment.data?.AuthCode || '',
        rrn: payment.data?.RRN || ''
      };
      
      // Update booking status and transaction details
      booking.status = bookingStatus;
      booking.paymentTransactionDetails = transactionDetails;
      booking.statusMessage = statusMessage;
      await booking.save();
      
      // Update the corresponding order in the user's orders array
      await User.updateOne(
        { _id: booking.userId, 'orders.orderId': booking.orderId },
        { 
          $set: { 
            'orders.$.status': bookingStatus,
            'orders.$.statusMessage': statusMessage,
            'orders.$.paymentTransactionDetails': transactionDetails
          } 
        }
      );
      
      // Send appropriate email notifications based on payment status
      if (paymentStatus === 3) {  // Payment successful
        // Send payment confirmation email
        await emailService.sendPaymentConfirmation(
          `${user.name} ${user.surname}`,
          user.email,
          {
            orderId: booking.orderId,
            adventureTitle: booking.adventureTitle,
            date: booking.startDate,
            amount: payment.amount,
            currency: payment.currency,
            transactionId: payment.ntpID,
            paymentMethod: 'Card payment (Netopia)'
          }
        );
      } else if ([4, 5, 7, 12, 16, 17, 18, 19, 20, 21, 22, 23, 26, 34, 35, 36, 39].includes(paymentStatus)) {
        // Send payment failed email for declined/failed payments
        await emailService.sendPaymentFailedNotification(
          `${user.name} ${user.surname}`,
          user.email,
          {
            orderId: booking.orderId,
            adventureTitle: booking.adventureTitle,
            date: booking.startDate,
            failureReason: statusMessage,
            paymentRetryUrl: `${process.env.NEXT_PUBLIC_APP_URL}/booking/payment?bookingId=${booking._id}`
          }
        );
      }
      
      return {
        success: true,
        message: statusMessage,
        bookingStatus,
        bookingId: booking._id.toString(),
        orderId: booking.orderId
      };
    }
  } catch (error) {
    console.error('Error handling Netopia webhook:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process payment webhook'
    };
  }
}

/**
 * Get payment details for a booking
 */
export async function getBookingPaymentDetails(bookingId: string) {
  await dbConnect();
  
  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }
    
    // Get payment-related information
    const paymentInfo = {
      bookingId: booking._id.toString(),
      orderId: booking.orderId,
      adventureTitle: booking.adventureTitle,
      price: booking.price,
      advancePaymentAmount: booking.advancePaymentAmount,
      advancePaymentPercentage: booking.advancePaymentPercentage,
      status: booking.status,
      statusMessage: booking.statusMessage,
      paymentUrl: booking.paymentUrl,
      paymentDetails: booking.paymentDetails,
      paymentTransactionDetails: booking.paymentTransactionDetails
    };
    
    return { success: true, data: paymentInfo };
  } catch (error) {
    console.error('Error getting booking payment details:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get payment details' 
    };
  }
} 