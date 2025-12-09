# Netopia Payment Integration Documentation

This document provides a comprehensive explanation of the Netopia payment integration implemented in the AdventureTime project, covering all aspects from initialization to webhook handling.

## Table of Contents

1. [Overview](#overview)
2. [Environment Setup](#environment-setup)
3. [Payment Flow](#payment-flow)
4. [Backend Implementation](#backend-implementation)
   - [Initiating Payment](#initiating-payment)
   - [Webhook Handling](#webhook-handling)
   - [Helper Functions](#helper-functions)
5. [Frontend Implementation](#frontend-implementation)
   - [Payment Page](#payment-page)
   - [Payment Result Page](#payment-result-page)
   - [Booking Success Page](#booking-success-page)
   - [User Bookings Component](#user-bookings-component)
6. [Error Handling](#error-handling)
7. [Payment Status Mapping](#payment-status-mapping)
8. [Database Schema](#database-schema)
9. [Email Notifications](#email-notifications)

## Overview

The project implements Netopia Payments (mobilPay) as a payment processor for online card payments for adventure bookings. The integration follows these key steps:
1. Payment initiation from the booking success page or dashboard bookings
2. Redirect to Netopia's secure payment page
3. Webhook handling for payment status updates
4. Booking/order status updates based on payment results
5. Confirmation displayed to the user

## Environment Setup

Required environment variables:
```
NETOPIA_AUTH_TOKEN=your_auth_token
NETOPIA_POS_SIGNATURE=your_pos_signature
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

These credentials are obtained from your Netopia merchant account.

## Payment Flow

1. User creates a booking and is directed to booking success page
2. User selects to pay the advance payment online
3. Backend initiates payment with Netopia API
4. User is redirected to Netopia's secure payment page in a new window
5. User completes payment on Netopia's secure page
6. Netopia sends payment result via webhook to our server
7. Our server updates the booking and order status based on the payment result
8. Frontend displays the result to the user on the payment-result page and sends appropriate email notifications

## Backend Implementation

### Initiating Payment

Payment initialization is handled by the `initiateNetopiaPayment` function in `lib/actions/payment.ts`:

```typescript
export async function initiateNetopiaPayment(bookingId: string) {
  await dbConnect();
  
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

    // Build the request payload
    const payload = {
      config: {
        emailTemplate: "confirm",
        notifyUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/webhooks/netopia`,
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/booking/payment-result?bookingId=${booking._id}`,
        language: "ro"
      },
      // ... rest of the payload ...
    };

    // Make API request and update booking status
    // ...
  }
  // ...
}
```

### Webhook Handling

Netopia sends payment status updates to our webhook endpoint defined in `app/api/webhooks/netopia/route.ts`:

```typescript
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!body || !body.order || !body.payment) {
      return NextResponse.json({ success: false, error: 'Invalid webhook payload' }, { status: 400 });
    }
    
    // Process the webhook notification
    const result = await handleNetopiaWebhook(body);
    
    // ... handle result and return appropriate response ...
  } catch (error) {
    // ... handle errors ...
  }
}
```

The webhook processing logic is implemented in the `handleNetopiaWebhook` function in `lib/actions/payment.ts`.

### Helper Functions

Several helper functions support the payment processing:

1. **getBookingPaymentDetails**: Retrieves payment information for a booking
2. **updateBookingStatus**: Updates a booking's status (reused from existing code)
3. **sendPaymentConfirmation/sendPaymentFailedNotification**: Email notification functions

## Frontend Implementation

### Payment Page

The payment page (`app/booking/payment/page.tsx`) provides a user interface for initiating payments:

- Displays booking details
- Provides a "Pay Now" button to initiate payment
- Shows payment status and previous transaction details if available
- Allows users to return to their bookings dashboard

### Payment Result Page

The payment result page (`app/booking/payment-result/page.tsx`) displays the result of a payment:

- Polls for payment status updates in real-time
- Shows appropriate success/failure messages based on payment status
- Displays transaction details when available
- Provides options to retry payment or view bookings

### Booking Success Page

The booking success page (`app/booking/success/page.tsx`) has been updated to include a payment option:

- Shows a "Pay Advance Online" button for bookings that are eligible for payment
- Displays payment status information
- Provides context about advance payment vs. full payment

### User Bookings Component

The user bookings component (`components/dashboard/user-bookings.tsx`) has been updated to include payment options:

- "Pay Advance" button for bookings awaiting payment
- "Retry Payment" button for bookings with failed payments
- Visual status indicators for different payment states

## Error Handling

The integration includes comprehensive error handling:

1. Input validation before initiating payment
2. Error handling during payment initialization
3. Webhook validation to prevent malicious requests
4. Booking status validation to ensure correct transitions
5. Frontend error handling with user-friendly messages
6. Transaction tracking for debugging purposes

## Payment Status Mapping

Netopia returns numeric status codes that are mapped to internal booking statuses:

```typescript
const statusMap: Record<number, { status: string, message: string }> = {
  1: { status: "pending", message: "Payment pending" },
  2: { status: "processing", message: "Payment processing" },
  3: { status: "payment_confirmed", message: "Payment confirmed" },
  4: { status: "cancelled", message: "Payment cancelled by user" },
  5: { status: "declined", message: "Payment declined by bank" },
  // ... additional status mappings ...
};
```

## Database Schema

The Booking and User models have been extended to support payment processing:

### Booking Model Additions

```typescript
// Payment-related fields
paymentUrl?: string;
paymentAttempt?: number;
paymentDetails?: {
  paymentAttempt: number;
  paymentType: string;
  paymentAmount: number;
  [key: string]: any;
};
paymentTransactionDetails?: {
  ntpID: string;
  status: number;
  code: string;
  message: string;
  amount: number;
  currency: string;
  dateTime: Date;
  cardMasked: string;
  authCode: string;
  rrn: string;
  [key: string]: any;
};
```

### User Order Schema Additions

Similar fields have been added to the User model's Order schema.

## Email Notifications

Two new email notification templates have been implemented:

1. **Payment Confirmation Email**: Sent when a payment is successfully processed
2. **Payment Failed Notification**: Sent when a payment fails, with retry instructions

These emails provide users with clear information about their payment status and next steps. 