'use server';

import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';
import dbConnect from '../db';
import VoucherPurchase from '../models/voucherPurchase';
import User from '../models/user';
import Coupon from '../models/coupon';
import { emailService } from '../email';

const PROCESSING_FEE = 20; // 20 lei processing fee
const ALLOWED_VOUCHER_AMOUNTS = [100, 200, 300, 400, 500];

/**
 * Create a voucher purchase
 */
export async function createVoucherPurchase(
  userId: string,
  voucherAmount: number,
  phoneNumber?: string
) {
  await dbConnect();
  
  try {
    // Validate voucher amount
    if (!ALLOWED_VOUCHER_AMOUNTS.includes(voucherAmount)) {
      return { 
        success: false, 
        error: 'Invalid voucher amount. Allowed amounts: 100, 200, 300, 400, 500 lei' 
      };
    }
    
    // Get the user
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    // Generate a unique order ID
    const orderId = `VCH-${uuidv4().substring(0, 8).toUpperCase()}`;
    
    // Calculate total amount (voucher amount + processing fee)
    const totalAmount = voucherAmount + PROCESSING_FEE;
    
    // Create the voucher purchase
    const voucherPurchase = new VoucherPurchase({
      orderId,
      userId,
      username: `${user.name} ${user.surname}`,
      email: user.email,
      voucherAmount,
      totalAmount,
      processingFee: PROCESSING_FEE,
      status: 'pending_payment',
      phoneNumber: phoneNumber || user.phone,
    });
    
    await voucherPurchase.save();
    
    console.log(`Created voucher purchase ${orderId} for user ${userId}`);
    
    return { 
      success: true, 
      data: {
        voucherPurchaseId: voucherPurchase._id.toString(),
        orderId: voucherPurchase.orderId,
        voucherAmount: voucherPurchase.voucherAmount,
        totalAmount: voucherPurchase.totalAmount,
        processingFee: voucherPurchase.processingFee,
      }
    };
  } catch (error) {
    console.error('Error creating voucher purchase:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create voucher purchase' 
    };
  }
}

/**
 * Initiate Netopia payment for voucher purchase
 */
export async function initiateVoucherPayment(voucherPurchaseId: string, phoneNumber?: string) {
  await dbConnect();
  
  // --- Development Mode Bypass ---
  if (process.env.NODE_ENV === 'development') {
    console.log('--- DEVELOPMENT MODE: Skipping Netopia Payment for Voucher ---');
    try {
      const voucherPurchase = await VoucherPurchase.findById(voucherPurchaseId);
      if (!voucherPurchase) {
        return { success: false, error: 'Voucher purchase not found' };
      }

      const user = await User.findById(voucherPurchase.userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Update phone number if provided
      if (phoneNumber) {
        voucherPurchase.phoneNumber = phoneNumber;
      }

      // Simulate successful payment
      voucherPurchase.status = 'payment_confirmed';
      voucherPurchase.paymentUrl = 'dev-mode-bypass';
      
      const paymentDetails = {
        paymentAttempt: voucherPurchase.paymentAttempt ? voucherPurchase.paymentAttempt + 1 : 1,
        paymentType: 'dev_bypass',
        paymentAmount: voucherPurchase.totalAmount,
        status: 'confirmed',
        message: 'Payment bypassed in development mode',
        dateTime: new Date()
      };
      
      voucherPurchase.paymentDetails = paymentDetails;
      voucherPurchase.paymentTransactionDetails = paymentDetails;
      await voucherPurchase.save();

      // Generate coupon immediately in dev mode
      const couponResult = await generateVoucherCoupon(voucherPurchase._id.toString());
      
      console.log(`--- DEVELOPMENT MODE: Voucher purchase ${voucherPurchase.orderId} confirmed ---`);

      revalidatePath('/dashboard/bookings');
      revalidatePath('/profile');

      return { 
        success: true, 
        data: {
          paymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/booking/payment-result?voucherPurchaseId=${voucherPurchase._id.toString()}&status=confirmed`,
          voucherPurchaseId: voucherPurchase._id.toString(),
          orderId: voucherPurchase.orderId,
          status: 'payment_confirmed',
          generatedCoupon: couponResult.success ? couponResult.data?.code : null
        }
      };
    } catch (devError) {
      console.error('Error during development mode voucher payment bypass:', devError);
      return { 
        success: false, 
        error: devError instanceof Error ? devError.message : 'Failed during dev bypass' 
      };
    }
  }
  // --- End Development Mode Bypass ---

  try {
    const voucherPurchase = await VoucherPurchase.findById(voucherPurchaseId);
    if (!voucherPurchase) {
      return { success: false, error: 'Voucher purchase not found' };
    }
    
    const user = await User.findById(voucherPurchase.userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    const netopiaAuthToken = process.env.NETOPIA_AUTH_TOKEN;
    const netopiaPosSignature = process.env.NETOPIA_POS_SIGNATURE;

    if (!netopiaAuthToken || !netopiaPosSignature) {
      return { success: false, error: 'Missing Netopia credentials in environment variables' };
    }

    // Update phone number if provided
    if (phoneNumber) {
      voucherPurchase.phoneNumber = phoneNumber;
    }
    
    // Prepare user address information
    const userAddress = user.address && user.address.length > 0 ? user.address[0] : {};
    
    // Build the request payload
    const payload = {
      config: {
        emailTemplate: "confirm",
        notifyUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/webhooks/netopia`,
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/booking/payment-result?voucherPurchaseId=${voucherPurchase._id}`,
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
        description: `Voucher purchase: ${voucherPurchase.voucherAmount} lei + ${voucherPurchase.processingFee} lei processing fee`,
        orderID: voucherPurchase.orderId,
        amount: voucherPurchase.totalAmount,
        currency: "RON",
        billing: {
          email: user.email,
          phone: voucherPurchase.phoneNumber || user.phone || '',
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

    // Store payment details
    const paymentDetails = {
      paymentAttempt: voucherPurchase.paymentAttempt ? voucherPurchase.paymentAttempt + 1 : 1,
      paymentType: 'netopia',
      paymentAmount: voucherPurchase.totalAmount
    };
    
    voucherPurchase.paymentDetails = paymentDetails;
    await voucherPurchase.save();

    // Make the API request to Netopia
    const apiUrl = process.env.NETOPIA_USE_SANDBOX === 'true' 
      ? process.env.NETOPIA_SANDBOX_URL 
      : process.env.NETOPIA_PRODUCTION_URL;
    
    console.log(`Using Netopia API URL: ${apiUrl}/payment/card/start for voucher ${voucherPurchase.orderId}`);
      
    const response = await fetch(`${apiUrl}/payment/card/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': netopiaAuthToken
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log(`Netopia response for voucher ${voucherPurchase.orderId}:`, responseText);
    
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

    // Store the payment URL
    voucherPurchase.paymentUrl = data.payment.paymentURL;
    voucherPurchase.status = 'pending_payment';
    await voucherPurchase.save();

    return { 
      success: true, 
      data: {
        paymentUrl: data.payment.paymentURL,
        voucherPurchaseId: voucherPurchase._id.toString(),
        orderId: voucherPurchase.orderId
      }
    };
  } catch (error) {
    console.error('Error initiating voucher payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initiate payment'
    };
  }
}

/**
 * Generate a unique coupon code for a voucher purchase
 */
export async function generateVoucherCoupon(voucherPurchaseId: string) {
  await dbConnect();
  
  try {
    const voucherPurchase = await VoucherPurchase.findById(voucherPurchaseId);
    if (!voucherPurchase) {
      return { success: false, error: 'Voucher purchase not found' };
    }
    
    if (voucherPurchase.generatedCouponCode) {
      return { 
        success: true, 
        data: { code: voucherPurchase.generatedCouponCode },
        message: 'Coupon already generated' 
      };
    }
    
    // Generate a unique coupon code
    let couponCode;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      couponCode = `VOUCHER-${uuidv4().substring(0, 8).toUpperCase()}`;
      attempts++;
      
      // Check if code already exists
      const existingCoupon = await Coupon.findOne({ code: couponCode });
      if (!existingCoupon) break;
      
    } while (attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
      return { success: false, error: 'Failed to generate unique coupon code' };
    }
    
    // Create the coupon
    const coupon = new Coupon({
      code: couponCode,
      type: 'fixed',
      value: voucherPurchase.voucherAmount,
      description: `Gift voucher ${voucherPurchase.voucherAmount} lei - generated from purchase ${voucherPurchase.orderId}`,
      appliesTo: 'all',
      maxUses: 1, // One-time use
      usedCount: 0,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Valid for 1 year
      isActive: true,
    });
    
    await coupon.save();
    
    // Update voucher purchase with generated coupon code
    voucherPurchase.generatedCouponCode = couponCode;
    voucherPurchase.status = 'completed';
    await voucherPurchase.save();
    
    // Send email with voucher code
    await emailService.sendVoucherCouponNotification(
      voucherPurchase.username,
      voucherPurchase.email,
      {
        orderId: voucherPurchase.orderId,
        voucherAmount: voucherPurchase.voucherAmount,
        couponCode: couponCode,
        expiryDate: coupon.endDate
      }
    );
    
    console.log(`Generated coupon ${couponCode} for voucher purchase ${voucherPurchase.orderId}`);
    
    revalidatePath('/control-panel/coupons');
    
    return { 
      success: true, 
      data: { 
        code: couponCode,
        value: voucherPurchase.voucherAmount,
        expiryDate: coupon.endDate
      }
    };
  } catch (error) {
    console.error('Error generating voucher coupon:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to generate coupon' 
    };
  }
}

/**
 * Handle Netopia webhook for voucher purchases
 */
export async function handleVoucherWebhook(orderId: string, paymentStatus: number, paymentData: any) {
  await dbConnect();
  
  try {
    const voucherPurchase = await VoucherPurchase.findOne({ orderId });
    
    if (!voucherPurchase) {
      throw new Error(`Voucher purchase not found for orderId: ${orderId}`);
    }
    
    // Map Netopia payment status to our internal status
    let voucherStatus = 'pending';
    let statusMessage = '';
    
    const statusMap: Record<number, { status: string, message: string }> = {
      1: { status: "pending", message: "Payment pending" },
      2: { status: "processing", message: "Payment processing" },
      3: { status: "payment_confirmed", message: "Payment confirmed" },
      4: { status: "cancelled", message: "Payment cancelled by user" },
      5: { status: "declined", message: "Payment declined by bank" },
      7: { status: "expired", message: "Payment expired" },
      8: { status: "error", message: "Payment processing error" },
      9: { status: "error", message: "Payment processing error" },
      10: { status: "error", message: "Payment processing error" },
      12: { status: "declined", message: "Expired card" },
      16: { status: "declined", message: "Insufficient funds" },
      17: { status: "declined", message: "Invalid card" },
      18: { status: "declined", message: "Restricted card" },
      19: { status: "declined", message: "Security violation" },
      20: { status: "declined", message: "Lost card" },
      21: { status: "declined", message: "Stolen card" },
      22: { status: "declined", message: "Suspected fraud" },
      23: { status: "declined", message: "Pick up card" },
      26: { status: "error", message: "Transaction timeout" },
      34: { status: "declined", message: "Invalid transaction" },
      35: { status: "declined", message: "Invalid amount" },
      36: { status: "declined", message: "Invalid merchant" },
      39: { status: "error", message: "System error" }
    };
    
    const statusInfo = statusMap[paymentStatus] || { status: "error", message: "Unknown payment status" };
    voucherStatus = statusInfo.status;
    statusMessage = statusInfo.message;
    
    // Store transaction details
    const transactionDetails = {
      ntpID: paymentData.ntpID || '',
      status: paymentStatus,
      code: paymentData.code || '',
      message: paymentData.message || statusMessage,
      amount: paymentData.amount || voucherPurchase.totalAmount,
      currency: paymentData.currency || 'RON',
      dateTime: new Date(),
      cardMasked: paymentData.instrument?.panMasked || '',
      authCode: paymentData.data?.AuthCode || '',
      rrn: paymentData.data?.RRN || ''
    };
    
    // Update voucher purchase
    voucherPurchase.status = voucherStatus;
    voucherPurchase.paymentTransactionDetails = transactionDetails;
    voucherPurchase.statusMessage = statusMessage;
    await voucherPurchase.save();
    
    // If payment was successful, generate the coupon
    if (paymentStatus === 3) { // Payment successful
      await generateVoucherCoupon(voucherPurchase._id.toString());
    }
    
    return {
      success: true,
      message: statusMessage,
      voucherStatus,
      voucherPurchaseId: voucherPurchase._id.toString(),
      orderId: voucherPurchase.orderId
    };
  } catch (error) {
    console.error('Error handling voucher webhook:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process voucher payment webhook'
    };
  }
}

/**
 * Get all voucher purchases (admin function)
 */
export async function getAllVoucherPurchases() {
  await dbConnect();
  
  try {
    const voucherPurchases = await VoucherPurchase.find({})
      .sort({ createdAt: -1 })
      .lean();
    
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(voucherPurchases))
    };
  } catch (error) {
    console.error('Error fetching voucher purchases:', error);
    return { 
      success: false, 
      error: 'Failed to fetch voucher purchases' 
    };
  }
}

/**
 * Get voucher purchases for a specific user
 */
export async function getUserVoucherPurchases(userId: string) {
  await dbConnect();
  
  try {
    const voucherPurchases = await VoucherPurchase.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
    
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(voucherPurchases))
    };
  } catch (error) {
    console.error('Error fetching user voucher purchases:', error);
    return { 
      success: false, 
      error: 'Failed to fetch voucher purchases' 
    };
  }
}

/**
 * Get voucher purchase by ID
 */
export async function getVoucherPurchaseById(voucherPurchaseId: string) {
  await dbConnect();
  
  try {
    const voucherPurchase = await VoucherPurchase.findById(voucherPurchaseId).lean();
    
    if (!voucherPurchase) {
      return { success: false, error: 'Voucher purchase not found' };
    }
    
    return { 
      success: true, 
      data: JSON.parse(JSON.stringify(voucherPurchase))
    };
  } catch (error) {
    console.error('Error fetching voucher purchase:', error);
    return { 
      success: false, 
      error: 'Failed to fetch voucher purchase' 
    };
  }
} 