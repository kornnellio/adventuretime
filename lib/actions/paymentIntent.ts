'use server';

import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { format, startOfDay, isAfter, isSameDay, isBefore, addDays, addHours } from 'date-fns';
import dbConnect from '../db';
import PaymentIntent, { IPaymentIntent } from '../models/paymentIntent';
import Booking from '../models/booking';
import User from '../models/user';
import Adventure from '../models/adventure';
import { emailService } from '../email';
import { revalidatePath } from 'next/cache';
import { serializeData } from '../utils/serializer';
import { ro } from 'date-fns/locale';
import fs from 'fs';
import path from 'path';
import { incrementCouponUsage } from './coupon';

// Helper function to log errors to a file
async function logConversionErrorToFile(paymentIntentIdOrMongoId: string, error: any, contextMessage: string) {
  const logDir = path.join(process.cwd(), 'errors');
  const logFile = path.join(logDir, 'conversion_errors.log');
  const timestamp = new Date().toISOString();
  
  let errorMessage = `${timestamp} - ID (Intent/Mongo): ${paymentIntentIdOrMongoId} - Context: ${contextMessage}\n`;
  if (error instanceof Error) {
    errorMessage += `Error: ${error.message}\nStack: ${error.stack}\n`;
  } else if (typeof error === 'object' && error !== null) {
    errorMessage += `Error Object: ${JSON.stringify(error)}\n`;
  } else {
    errorMessage += `Error: ${String(error)}\n`;
  }
  errorMessage += '-----------------------------------------------------\n';

  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(logFile, errorMessage);
  } catch (fileLogError) {
    console.error('Failed to write to error log file:', fileLogError);
    // Fallback to console logging if file logging fails
    console.error('Original error intended for file log:', errorMessage);
  }
}

// Helper functions for sending emails
async function sendReservationConfirmation(
  name: string,
  email: string,
  reservationDetails: any
): Promise<{ success: boolean; error?: string }> {
  try {
    return await emailService.sendReservationConfirmation(
      name, 
      email, 
      reservationDetails
    );
  } catch (error) {
    console.error('Error in sendReservationConfirmation helper:', error);
    return { success: false, error: 'Failed to send reservation confirmation email' };
  }
}

interface KayakSelections {
  caiacSingle: number;
  caiacDublu: number;
  placaSUP: number;
}

interface CouponData {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  discount: number;
}

/**
 * Create a payment intent for an adventure booking
 */
export async function createPaymentIntent(
  adventureId: string,
  userId: string,
  bookingDate: Date,
  comments?: string,
  kayakSelections: KayakSelections = { caiacSingle: 0, caiacDublu: 0, placaSUP: 0 },
  couponData?: CouponData
) {
  await dbConnect();
  let currentPaymentIntentIdForLogging: string | undefined = undefined;
  
  try {
    console.log("Creating payment intent document (without initiating payment yet):", { 
      adventureId, 
      userId, 
      bookingDate, 
      kayakSelections,
      couponData
    });
    
    // Get the adventure details first
    const adventure = await Adventure.findById(adventureId);
    if (!adventure) {
      return { success: false, error: 'Adventure not found' };
    }
    
    // Validate kayak selections based on available types
    if (!adventure.availableKayakTypes) {
      // Default to only single kayaks if not specified
      if (kayakSelections.caiacDublu > 0 || kayakSelections.placaSUP > 0) {
        return { 
          success: false, 
          error: 'Acest tip de aventură acceptă doar caiac single. Te rugăm să ajustezi selecția.' 
        };
      }
    } else {
      // Check if selected kayak types are available for this adventure
      if (kayakSelections.caiacSingle > 0 && !adventure.availableKayakTypes.caiacSingle) {
        return { 
          success: false, 
          error: 'Caiac Single nu este disponibil pentru această aventură. Te rugăm să ajustezi selecția.' 
        };
      }
      if (kayakSelections.caiacDublu > 0 && !adventure.availableKayakTypes.caiacDublu) {
        return { 
          success: false, 
          error: 'Caiac Dublu nu este disponibil pentru această aventură. Te rugăm să ajustezi selecția.' 
        };
      }
      if (kayakSelections.placaSUP > 0 && !adventure.availableKayakTypes.placaSUP) {
        return { 
          success: false, 
          error: 'Placă SUP nu este disponibilă pentru această aventură. Te rugăm să ajustezi selecția.' 
        };
      }
    }
    
    // Ensure at least one kayak is selected
    const totalKayaks = kayakSelections.caiacSingle + kayakSelections.caiacDublu + kayakSelections.placaSUP;
    if (totalKayaks <= 0) {
      return {
        success: false,
        error: 'Trebuie să selectezi cel puțin o ambarcațiune pentru a face o rezervare.'
      };
    }

    // --- Time Check Logic --- 
    const now = new Date();
    const currentHour = now.getHours();
    const adventureStartDate = new Date(bookingDate);
    const adventureStartDay = startOfDay(adventureStartDate);
    const today = startOfDay(now);

    // 1. Check if booking is for a past day
    if (isBefore(adventureStartDay, today)) {
      return {
        success: false,
        error: 'Nu se pot face rezervări pentru zile trecute. Te rugăm să selectezi o dată în viitor.'
      };
    }

    // 2. Check if booking is for today 
    if (isSameDay(adventureStartDate, today)) {
      const cutoffHour = adventure.bookingCutoffHour;
      
      // Check if cutoff hour applies and has passed
      if (cutoffHour !== null && cutoffHour !== undefined && currentHour >= cutoffHour) {
        return {
          success: false,
          error: `Rezervările pentru ziua curentă se pot face doar până la ora ${cutoffHour}:00.`
        };
      }
      
      // Regardless of cutoff hour, check if the specific adventure start time has passed
      if (adventureStartDate <= now) {
         return {
            success: false,
            error: 'Nu se pot face rezervări pentru aventuri care au început deja. Te rugăm să selectezi o dată și oră în viitor.'
         };
      }
    }
    // --- End Time Check Logic --- 

    // Get the user details
    let userObjectId;
    try {
      userObjectId = new mongoose.Types.ObjectId(userId);
    } catch (error) {
      console.error('Invalid user ID format:', error);
      return { success: false, error: 'Invalid user ID format' };
    }
    
    const user = await User.findById(userObjectId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    // Generate a unique intent ID
    const intentIdForDoc = `INT-${uuidv4().substring(0, 8).toUpperCase()}`;
    currentPaymentIntentIdForLogging = intentIdForDoc; // Set for logging in catch block
    
    // Get the adventure image if available
    const adventureImage = adventure.images && adventure.images.length > 0 
      ? adventure.images[0] 
      : undefined;
    
    // Calculate total price based on kayak selections
    // Caiac Single = 1x base price
    // Caiac Dublu = 2x base price
    // Placa SUP = 1x base price
    const baseTotalPrice = 
      (kayakSelections.caiacSingle * adventure.price) + 
      (kayakSelections.caiacDublu * adventure.price * 2) + 
      (kayakSelections.placaSUP * adventure.price);
    
    // Apply coupon discount if provided
    let totalPrice = baseTotalPrice;
    let couponDiscount = 0;
    
    if (couponData) {
      if (couponData.type === 'percentage') {
        couponDiscount = Math.round((baseTotalPrice * couponData.value) / 100);
      } else { // fixed amount
        couponDiscount = Math.min(couponData.value, baseTotalPrice); // Can't discount more than base price
      }
      
      totalPrice = Math.max(0, baseTotalPrice - couponDiscount);
    }
    
    // Calculate advance payment amount
    const advancePaymentAmount = Math.round(totalPrice * (adventure.advancePaymentPercentage / 100));
    
    // Determine end date based on adventure details
    let startDate = new Date(bookingDate);
    let endDate: Date;
    
    // Find the matching date pair in the adventure's dates array
    if (adventure.dates && Array.isArray(adventure.dates) && adventure.dates.length > 0) {
      // Try to find the date pair that matches the bookingDate
      const matchingDatePair = adventure.dates.find((datePair: { startDate: Date | string; endDate: Date | string }) => {
        const pairStartDate = new Date(datePair.startDate);
        return pairStartDate.toDateString() === startDate.toDateString();
      });
      
      if (matchingDatePair) {
        // Use the matching date pair's end date
        endDate = new Date(matchingDatePair.endDate);
      } else {
        // If no matching date pair found, use legacy endDate field or calculate based on duration
        if (adventure.endDate) {
          endDate = new Date(adventure.endDate);
        } else if (adventure.duration) {
          endDate = new Date(startDate);
          if (adventure.duration.unit === 'days') {
            endDate.setDate(endDate.getDate() + adventure.duration.value);
          } else if (adventure.duration.unit === 'hours') {
            endDate.setHours(endDate.getHours() + adventure.duration.value);
          }
        } else {
          // Default to one day after start date
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 1);
        }
      }
    } else {
      // Use legacy approach if no dates array
      if (adventure.endDate) {
        endDate = new Date(adventure.endDate);
      } else if (adventure.duration) {
        endDate = new Date(startDate);
        if (adventure.duration.unit === 'days') {
          endDate.setDate(endDate.getDate() + adventure.duration.value);
        } else if (adventure.duration.unit === 'hours') {
          endDate.setHours(endDate.getHours() + adventure.duration.value);
        }
      } else {
        // Default to one day after start date
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
      }
    }
    
    // Create the payment intent document
    const paymentIntentDoc = new PaymentIntent({
      intentId: intentIdForDoc,
      userId,
      adventureId,
      adventureTitle: adventure.title,
      startDate: startDate,
      endDate: endDate,
      price: adventure.price, // Store the per-person price
      kayakSelections: kayakSelections,
      advancePaymentPercentage: adventure.advancePaymentPercentage,
      advancePaymentAmount: advancePaymentAmount,
      // Add coupon data if provided
      ...(couponData && {
        couponCode: couponData.code,
        couponType: couponData.type,
        couponValue: couponData.value,
        couponDiscount: couponDiscount,
        originalPrice: baseTotalPrice
      }),
      paymentStatus: 'pending',
      comments,
      adventureImage,
      location: adventure.location,
      meetingPoint: adventure.meetingPoint,
      difficulty: adventure.difficulty,
      duration: adventure.duration,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
    });
    
    await paymentIntentDoc.save();
    currentPaymentIntentIdForLogging = paymentIntentDoc.intentId; // Update with actual saved intentId

    // Create a summary of the items being booked
    const bookingSummary = [];
    if (kayakSelections.caiacSingle > 0) {
      bookingSummary.push(`${kayakSelections.caiacSingle} Caiac Single`);
    }
    if (kayakSelections.caiacDublu > 0) {
      bookingSummary.push(`${kayakSelections.caiacDublu} Caiac Dublu`);
    }
    if (kayakSelections.placaSUP > 0) {
      bookingSummary.push(`${kayakSelections.placaSUP} Placă SUP`);
    }
    
    // Initiate Netopia payment using the correct function from this file
    // The initiatePaymentForIntent function is designed to work with a paymentIntentId
    const paymentResponse = await initiatePaymentForIntent(paymentIntentDoc._id.toString());
    
    if (!paymentResponse.success) {
      // Log the error from payment initiation if needed, or rely on its internal logging
      console.error(`Failed to initiate payment for intent ${paymentIntentDoc.intentId}:`, paymentResponse.error);
      await logConversionErrorToFile(paymentIntentDoc.intentId, paymentResponse.error || 'Unknown error from initiatePaymentForIntent', 'Payment initiation call failed in createPaymentIntent');
      return { 
        success: false, 
        // Ensure the error message from initiatePaymentForIntent is propagated
        error: paymentResponse.error || 'Failed to generate payment URL' 
      };
    }
    
    // Update the payment intent with the payment URL from the correct response structure
    if (paymentResponse.data && paymentResponse.data.paymentUrl) {
      paymentIntentDoc.paymentUrl = paymentResponse.data.paymentUrl;
      // paymentStatus might be updated by initiatePaymentForIntent (e.g., to 'processing')
      // Re-save if initiatePaymentForIntent doesn't save it after adding paymentUrl
      // Checking initiatePaymentForIntent, it saves paymentUrl and sets status to 'processing'
      // So, direct save here might be redundant or could simply be: await paymentIntentDoc.save(); if other fields were changed.
      // For now, let's assume initiatePaymentForIntent handles its own state saving post-API call.
      // However, it's safer to ensure our local paymentIntent object reflects any changes if we use its properties later.
      // The original code saved paymentIntentDoc after setting paymentUrl. Let's see if this is still needed.
      // `initiatePaymentForIntent` *does* save the `paymentIntentDoc` after getting the URL and setting status to processing.
      // So, this re-save might not be strictly necessary unless other fields on `paymentIntentDoc` are modified here *after* the call.
      // The original code DID save it. Let's keep it for safety or if paymentIntentDoc instance needs to be updated in this scope.
      
    } else if (paymentResponse.data && !paymentResponse.data.paymentUrl && process.env.NODE_ENV === 'development') {
      // Handle dev mode bypass from initiatePaymentForIntent which might not return a URL if conversion happens immediately
      console.log("Development mode: Payment URL might be a redirect to payment-result directly if conversion already happened.");
    } else if (!paymentResponse.data || !paymentResponse.data.paymentUrl) {
        const errorMsg = 'Payment URL was not generated, though initiation reported success.';
        console.error(`Payment initiation response for intent ${paymentIntentDoc.intentId} missing paymentUrl. Data:`, paymentResponse.data);
        await logConversionErrorToFile(paymentIntentDoc.intentId, { responseData: paymentResponse.data }, 'Payment URL missing after successful initiation in createPaymentIntent');
        return {
            success: false,
            error: errorMsg
        };
    }
    
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/bookings');

    // Ensure the data returned to client is what it expects
    return { 
      success: true, 
      data: {
        intentId: paymentIntentDoc._id.toString(), // Client might expect this as bookingId or intentId
        startDate: paymentIntentDoc.startDate,
        endDate: paymentIntentDoc.endDate,
        adventure: paymentIntentDoc.adventureTitle,
        price: totalPrice, // This is the final price after discount
        kayakSummary: bookingSummary.join(', '),
        advancePaymentAmount: advancePaymentAmount,
        paymentUrl: paymentResponse.data.paymentUrl // Ensure this is the correct URL
      }
    };
    
  } catch (error: any) {
    console.error('Error creating payment intent document:', error);
    // Log to file in case of unexpected errors in createPaymentIntent itself
    // Although paymentIntentId might not exist yet if error is early
    const intentIdToLog = currentPaymentIntentIdForLogging || 'UNKNOWN_INTENT_ID_PRE_SAVE';
    await logConversionErrorToFile(intentIdToLog, error, 'Main catch block in createPaymentIntent');
    return { 
      success: false, 
      error: `An error occurred while creating the payment intent document: ${error.message}` 
    };
  }
}

/**
 * New server action to update phone number and then initiate Netopia payment.
 */
export async function initiatePaymentWithPhoneNumber(intentMongoId: string, phoneNumber: string) {
  await dbConnect();
  let paymentIntentForContext: IPaymentIntent | null = null;

  try {
    console.log(`Initiating payment with phone for intentMongoId: ${intentMongoId}, phoneNumber: ${phoneNumber}`);

    // Step 1: Update phone number
    const phoneUpdateResult = await updatePaymentIntentPhone(intentMongoId, phoneNumber);
    if (!phoneUpdateResult.success) {
      console.error(`Failed to update phone number for intentMongoId ${intentMongoId}:`, phoneUpdateResult.error);
      // Log this failure, as it precedes payment initiation
      await logConversionErrorToFile(intentMongoId, phoneUpdateResult.error || 'Phone update failed', 'Updating phone in initiatePaymentWithPhoneNumber');
      return { 
        success: false, 
        error: phoneUpdateResult.error || 'Failed to update phone number for payment intent.' 
      };
    }

    // Fetch the payment intent to get its details for logging and ensure it exists
    paymentIntentForContext = await PaymentIntent.findById(intentMongoId);
    if (!paymentIntentForContext) {
        const notFoundError = 'PaymentIntent not found after phone update';
        await logConversionErrorToFile(intentMongoId, notFoundError, 'Lookup after phone update in initiatePaymentWithPhoneNumber');
        return {success: false, error: notFoundError };
    }

    // Step 2: Initiate payment with Netopia (this function already handles dev vs prod)
    console.log(`Calling initiatePaymentForIntent for intent: ${paymentIntentForContext.intentId} (MongoID: ${intentMongoId})`);
    const netopiaPaymentResponse = await initiatePaymentForIntent(intentMongoId, phoneNumber); 

    if (!netopiaPaymentResponse.success) {
      console.error(`Netopia payment initiation failed for intent ${paymentIntentForContext.intentId}:`, netopiaPaymentResponse.error);
      return { 
        success: false, 
        error: netopiaPaymentResponse.error || 'Failed to initiate Netopia payment.'
      };
    }
    
    // Ensure data and paymentUrl exist before trying to use them
    if (!netopiaPaymentResponse.data || !netopiaPaymentResponse.data.paymentUrl) {
      const errorMsg = 'Payment URL not found in Netopia response after successful initiation.';
      console.error(errorMsg, `IntentID: ${paymentIntentForContext.intentId}`, netopiaPaymentResponse);
      await logConversionErrorToFile(paymentIntentForContext.intentId, { error: errorMsg, responseData: netopiaPaymentResponse.data }, 'Missing paymentUrl in initiatePaymentWithPhoneNumber');
      return { success: false, error: errorMsg };
    }

    console.log(`Successfully initiated Netopia payment for intent ${paymentIntentForContext.intentId}. Payment URL: ${netopiaPaymentResponse.data.paymentUrl}`);
    return {
      success: true,
      data: {
        paymentUrl: netopiaPaymentResponse.data.paymentUrl,
        paymentIntentId: intentMongoId, // Keep this for consistency, it's the Mongo ID
        intentId: paymentIntentForContext.intentId // The INT-xxxx string ID
      }
    };

  } catch (error: any) {
    const intentIdForLog = paymentIntentForContext ? paymentIntentForContext.intentId : intentMongoId;
    console.error(`Critical error in initiatePaymentWithPhoneNumber for ID ${intentIdForLog}:`, error);
    await logConversionErrorToFile(intentIdForLog, error, 'Main catch block in initiatePaymentWithPhoneNumber');
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred while initiating payment with phone number.' 
    };
  }
}

/**
 * Initiate a payment for a payment intent via Netopia
 */
export async function initiatePaymentForIntent(paymentIntentMongoId: string, phoneNumber?: string) {
  await dbConnect();
  let paymentIntentForLog: IPaymentIntent | null = null;

  try {
    if (!mongoose.Types.ObjectId.isValid(paymentIntentMongoId)) {
        const invalidIdError = new Error('Invalid MongoDB ObjectId format for Payment Intent');
        await logConversionErrorToFile(paymentIntentMongoId, invalidIdError, 'Invalid ID in initiatePaymentForIntent');
        return { success: false, error: invalidIdError.message };
    }
    let paymentIntent = await PaymentIntent.findById(paymentIntentMongoId);
    
    if (!paymentIntent) {
      await logConversionErrorToFile(paymentIntentMongoId, 'PaymentIntent not found by MongoID', 'Initial lookup in initiatePaymentForIntent');
      return { success: false, error: 'Payment intent not found' };
    }
    paymentIntentForLog = paymentIntent;

    if (process.env.NODE_ENV === 'development') {
      console.log(`--- DEVELOPMENT MODE: Initiating DEV Payment for Intent ${paymentIntent.intentId} (MongoID: ${paymentIntentMongoId}) ---`);
      if (phoneNumber && !paymentIntent.phoneNumber) { // Only update if provided and not already set
        paymentIntent.phoneNumber = phoneNumber;
      }
      paymentIntent.paymentStatus = 'confirmed'; 
      paymentIntent.paymentUrl = 'dev-mode-bypass'; 
      
      const ksDev = paymentIntent.kayakSelections || { caiacSingle: 0, caiacDublu: 0, placaSUP: 0 };
      const devPaymentDetails = {
        paymentAttempt: paymentIntent.paymentDetails?.paymentAttempt ? paymentIntent.paymentDetails.paymentAttempt + 1 : 1,
        paymentType: 'dev_bypass',
        paymentAmount: paymentIntent.advancePaymentAmount,
        totalPrice: 
            ((ksDev.caiacSingle || 0) * paymentIntent.price) + 
            ((ksDev.caiacDublu || 0) * paymentIntent.price * 2) +
            ((ksDev.placaSUP || 0) * paymentIntent.price),
        quantity: 
            (ksDev.caiacSingle || 0) + 
            (ksDev.caiacDublu || 0) +
            (ksDev.placaSUP || 0),
        status: 'confirmed',
        message: 'Payment bypassed in development mode for intent',
        dateTime: new Date()
      };
      paymentIntent.paymentDetails = devPaymentDetails;
      paymentIntent.paymentTransactionDetails = devPaymentDetails; 
      await paymentIntent.save();
      
      console.log(`--- DEVELOPMENT MODE: Payment Intent ${paymentIntent.intentId} marked as confirmed & saved ---`);
      
      console.log(`--- DEVELOPMENT MODE: Attempting to convert DEV intent ${paymentIntent.intentId} to booking... ---`);
      const conversionResult = await convertPaymentIntentToBooking(paymentIntent._id.toString());
      if (!conversionResult.success) {
        console.error(`--- DEVELOPMENT MODE: Failed to convert DEV intent ${paymentIntent.intentId} to booking:`, conversionResult.error);
      } else {
        console.log(`--- DEVELOPMENT MODE: Successfully converted DEV intent ${paymentIntent.intentId} to booking ${conversionResult.data?.bookingId} ---`);
      }
      
      revalidatePath('/dashboard'); 
      revalidatePath('/profile');

      return { 
        success: true, 
        data: {
          paymentUrl: conversionResult.success && conversionResult.data?.bookingId
            ? `${process.env.NEXT_PUBLIC_APP_URL}/booking/payment-result?bookingId=${conversionResult.data.bookingId}&status=confirmed`
            : `${process.env.NEXT_PUBLIC_APP_URL}/booking/payment-result?intentId=${paymentIntent._id.toString()}&status=confirmed`,
          paymentIntentId: paymentIntent._id.toString(),
          intentId: paymentIntent.intentId,
          status: 'confirmed' 
        }
      };
    } 

    // Production Logic for initiatePaymentForIntent
    if (phoneNumber && !paymentIntent.phoneNumber) { // If phone number provided and not already on intent, set it.
      paymentIntent.phoneNumber = phoneNumber;
      // This will be saved along with other updates before Netopia call or after successful call. 
    }
    
    const user = await User.findById(paymentIntent.userId);
    if (!user) {
      await logConversionErrorToFile(paymentIntent.intentId, `User not found for userId: ${paymentIntent.userId}`, 'User lookup in initiatePaymentForIntent (Prod)');
      return { success: false, error: 'User not found for payment intent' };
    }
    
    const netopiaAuthToken = process.env.NETOPIA_AUTH_TOKEN;
    const netopiaPosSignature = process.env.NETOPIA_POS_SIGNATURE;

    if (!netopiaAuthToken || !netopiaPosSignature) {
      console.error('Missing Netopia credentials in environment variables');
      await logConversionErrorToFile(paymentIntent.intentId, 'Missing Netopia credentials', 'Netopia credentials check in initiatePaymentForIntent (Prod)');
      return { success: false, error: 'Server configuration error for payment.' };
    }

    const userAddress = user.address && user.address.length > 0 ? user.address[0] : {};
    
    const ks = paymentIntent.kayakSelections || { caiacSingle: 0, caiacDublu: 0, placaSUP: 0 };    
    const quantityForPayload = 
      (ks.caiacSingle || 0) + 
      (ks.caiacDublu || 0) * 2 + 
      (ks.placaSUP || 0);

    const basePriceForPayload = 
      ((ks.caiacSingle || 0) * paymentIntent.price) + 
      ((ks.caiacDublu || 0) * paymentIntent.price * 2) + 
      ((ks.placaSUP || 0) * paymentIntent.price);
              
    const effectiveTotalPriceForPayload = paymentIntent.originalPrice !== undefined ? paymentIntent.originalPrice : basePriceForPayload;
    const finalTotalPriceAfterCouponForPayload = paymentIntent.couponDiscount
      ? Math.max(0, effectiveTotalPriceForPayload - paymentIntent.couponDiscount)
      : effectiveTotalPriceForPayload;

    const advanceAmountForPayload = paymentIntent.advancePaymentAmount;
                
    const payload = {
      config: {
        emailTemplate: "confirm",
        notifyUrl: `${process.env.NEXT_PUBLIC_API_URL}/api/webhooks/netopia`,
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/booking/payment-result?intentId=${paymentIntent._id.toString()}`,
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
        description: `Rezervare ${paymentIntent.adventureTitle} (${paymentIntent.intentId})`,
        orderID: paymentIntent.intentId, 
        amount: advanceAmountForPayload,
        currency: "RON",
        billing: {
          email: user.email,
          phone: paymentIntent.phoneNumber || user.phone || "",
          firstName: user.name || '',
          lastName: user.surname || '',
          city: userAddress.city || "",
          country: 642, 
          countryName: "Romania",
          state: userAddress.state || "",
          postalCode: userAddress.zipCode || "",
          details: userAddress.street || ""
        }
      }
    };

    const paymentDetailsToStore = {
      paymentAttempt: paymentIntent.paymentDetails?.paymentAttempt ? paymentIntent.paymentDetails.paymentAttempt + 1 : 1,
      paymentType: 'netopia',
      paymentAmount: advanceAmountForPayload,
      totalPrice: finalTotalPriceAfterCouponForPayload, 
      quantity: quantityForPayload 
    };
    
    paymentIntent.paymentDetails = paymentDetailsToStore;
    await paymentIntent.save(); // Save phone number and paymentDetails before calling Netopia

    const apiUrl = process.env.NETOPIA_USE_SANDBOX === 'true' 
      ? process.env.NETOPIA_SANDBOX_URL 
      : process.env.NETOPIA_PRODUCTION_URL;
    
    console.log(`Using Netopia API URL: ${apiUrl}/payment/card/start for intent: ${paymentIntent.intentId}`);
              
    const response = await fetch(`${apiUrl}/payment/card/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': netopiaAuthToken
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`Error parsing Netopia response JSON for intent ${paymentIntent.intentId}:`, parseError, `Response Text: ${responseText}`);
      await logConversionErrorToFile(paymentIntent.intentId, { message: 'Netopia JSON parse error', responseText: responseText.substring(0, 500) }, 'Netopia response parsing in initiatePaymentForIntent');
      paymentIntent.paymentStatus = 'error';
      if(paymentIntent.paymentDetails) paymentIntent.paymentDetails.statusMessage = 'Netopia invalid response';
      else paymentIntent.paymentDetails = { statusMessage : 'Netopia invalid response'} as any;
      await paymentIntent.save();
      throw new Error(`Netopia API error: Invalid JSON response`);
    }

    if (!response.ok) {
      console.error(`Netopia API error for intent ${paymentIntent.intentId}: ${response.status} ${response.statusText}`, data);
      await logConversionErrorToFile(paymentIntent.intentId, { status: response.status, body: data }, 'Netopia API error in initiatePaymentForIntent');
      paymentIntent.paymentStatus = 'error';
      if(paymentIntent.paymentDetails) paymentIntent.paymentDetails.statusMessage = `Netopia API Error: ${data?.error?.message || response.statusText}`;
      else paymentIntent.paymentDetails = {statusMessage : `Netopia API Error: ${data?.error?.message || response.statusText}`} as any;
      await paymentIntent.save();
      throw new Error(`Netopia API error: ${response.status} ${response.statusText} - ${JSON.stringify(data)}`);
    }

    if (!data.payment?.paymentURL) {
      console.error(`No paymentURL in Netopia response for intent ${paymentIntent.intentId}:`, data);
      await logConversionErrorToFile(paymentIntent.intentId, { message: 'No paymentURL in Netopia response', responseData: data }, 'Netopia response missing paymentURL in initiatePaymentForIntent');
      paymentIntent.paymentStatus = 'error';
      if(paymentIntent.paymentDetails) paymentIntent.paymentDetails.statusMessage = 'Netopia no payment URL';
      else paymentIntent.paymentDetails = {statusMessage: 'Netopia no payment URL'} as any;
      await paymentIntent.save();
      throw new Error('No payment URL in Netopia response');
    }

    paymentIntent.paymentUrl = data.payment.paymentURL;
    paymentIntent.paymentStatus = 'processing';
    await paymentIntent.save(); 

    return { 
      success: true, 
      data: {
        paymentUrl: data.payment.paymentURL,
        paymentIntentId: paymentIntent._id.toString(),
        intentId: paymentIntent.intentId
      }
    };
  } catch (error: any) {
    const intentIdToLog = paymentIntentForLog ? paymentIntentForLog.intentId : paymentIntentMongoId;
    console.error(`Error initiating payment for intent ${intentIdToLog}:`, error);
    await logConversionErrorToFile(intentIdToLog, error, 'Main catch block in initiatePaymentForIntent');
    // If paymentIntent object exists and an error occurs, try to save error status on it
    if (paymentIntentForLog && paymentIntentForLog.save) {
        try {
            paymentIntentForLog.paymentStatus = 'error';
            if (paymentIntentForLog.paymentDetails) paymentIntentForLog.paymentDetails.statusMessage = error.message || 'Generic error in initiatePaymentForIntent catch';
            else paymentIntentForLog.paymentDetails = { statusMessage: error.message || 'Generic error in initiatePaymentForIntent catch' } as any;
            await paymentIntentForLog.save();
        } catch (saveError) {
            console.error(`Failed to save error status on paymentIntent ${intentIdToLog} during catch block:`, saveError);
            await logConversionErrorToFile(intentIdToLog, saveError, 'Failed to save error status on paymentIntent in initiatePaymentForIntent catch block');
        }
    }
    return { 
      success: false, 
      error: error.message || 'Failed to initiate payment' 
    };
  }
}

/**
 * Get a payment intent by ID
 */
export async function getPaymentIntentById(paymentIntentIdOrMongoId: string) {
  await dbConnect();
  
  try {
    let paymentIntent;
    if (mongoose.Types.ObjectId.isValid(paymentIntentIdOrMongoId)) {
      paymentIntent = await PaymentIntent.findById(paymentIntentIdOrMongoId);
    } 
    if (!paymentIntent && paymentIntentIdOrMongoId.startsWith('INT-')) {
      // If it starts with INT- it's an intentId, not a mongoId for this search
      paymentIntent = await PaymentIntent.findOne({ intentId: paymentIntentIdOrMongoId }); 
    }
    
    if (!paymentIntent) {
      await logConversionErrorToFile(paymentIntentIdOrMongoId, 'PaymentIntent not found', 'getPaymentIntentById lookup');
      return { success: false, error: 'Payment intent not found' };
    }
    
    const paymentIntentObj = paymentIntent.toObject();
    return { 
      success: true, 
      data: serializeData(paymentIntentObj)
    };
  } catch (error: any) {
    console.error('Error fetching payment intent:', error);
    await logConversionErrorToFile(paymentIntentIdOrMongoId, error, 'Main catch block in getPaymentIntentById');
    return { 
      success: false, 
      error: error.message || 'Failed to fetch payment intent' 
    };
  }
}

/**
 * Convert a successful payment intent to a booking
 */
export async function convertPaymentIntentToBooking(paymentIntentMongoId: string) {
  await dbConnect();
  let paymentIntentForLog: IPaymentIntent | null = null;
  try {
    if (!mongoose.Types.ObjectId.isValid(paymentIntentMongoId)) {
      const invalidIdError = new Error('Invalid MongoDB ObjectId format for Payment Intent');
      await logConversionErrorToFile(paymentIntentMongoId, invalidIdError, 'Invalid ID in convertPaymentIntentToBooking');
      return { success: false, error: invalidIdError.message };
    }
    let paymentIntent = await PaymentIntent.findById(paymentIntentMongoId);
        
    if (!paymentIntent) {
      const errorMsg = 'Payment intent not found by MongoID';
      await logConversionErrorToFile(paymentIntentMongoId, errorMsg, 'Initial payment intent lookup in convertPaymentIntentToBooking');
      return { success: false, error: errorMsg };
    }
    paymentIntentForLog = paymentIntent;

    const userForBooking = await User.findById(paymentIntent.userId);
    if (!userForBooking) {
      const errorMsg = `User (ID: ${paymentIntent.userId}) associated with payment intent not found. Cannot create booking.`;
      await logConversionErrorToFile(paymentIntent.intentId, {userId: paymentIntent.userId, intentMongoDBId: paymentIntent._id }, 'User lookup for booking in convertPaymentIntentToBooking');
      return { success: false, error: errorMsg };
    }

    if (paymentIntent.paymentStatus !== 'confirmed' && paymentIntent.paymentStatus !== 'awaiting confirmation') {
      const errorMsg = `Cannot convert payment intent with status: ${paymentIntent.paymentStatus}`;
      await logConversionErrorToFile(paymentIntent.intentId, { currentStatus: paymentIntent.paymentStatus }, 'Payment intent status check in convertPaymentIntentToBooking');
      return { 
        success: false, 
        error: errorMsg 
      };
    }
    
    const orderId = `ADV-${paymentIntent.intentId}`;
    const kayakSelections = paymentIntent.kayakSelections || { caiacSingle: 0, caiacDublu: 0, placaSUP: 0 };
    let totalKayaks = kayakSelections.caiacSingle + kayakSelections.caiacDublu + kayakSelections.placaSUP;
    if (totalKayaks <= 0) {
      console.warn(`No kayaks found in payment intent ${paymentIntent.intentId}, setting default of 1 single kayak for booking creation.`);
      kayakSelections.caiacSingle = 1;
      totalKayaks = 1; 
    }
    
    const quantity = 
      (kayakSelections.caiacSingle) + 
      (kayakSelections.caiacDublu * 2) + 
      (kayakSelections.placaSUP);
  
    const basePriceBeforeDiscount = 
      (kayakSelections.caiacSingle * paymentIntent.price) + 
      (kayakSelections.caiacDublu * paymentIntent.price * 2) + 
      (kayakSelections.placaSUP * paymentIntent.price);
        
    const effectiveBasePrice = paymentIntent.originalPrice !== undefined ? paymentIntent.originalPrice : basePriceBeforeDiscount;
    const discountedTotalPrice = paymentIntent.couponDiscount 
      ? Math.max(0, effectiveBasePrice - paymentIntent.couponDiscount)
      : effectiveBasePrice;
    
    const remainingPayment = Math.max(0, discountedTotalPrice - paymentIntent.advancePaymentAmount);

    let bookingUsername = `${userForBooking.name || ''} ${userForBooking.surname || ''}`.trim();
    if (!bookingUsername) {
      console.warn(`User ${userForBooking._id} has no name or surname. Using email prefix or placeholder for booking username.`);
      bookingUsername = userForBooking.email ? userForBooking.email.split('@')[0] : `User ${userForBooking._id}`;
    }
    
    const booking = new Booking({
      phoneNumber: paymentIntent.phoneNumber,
      orderId,
      adventureId: paymentIntent.adventureId,
      userId: paymentIntent.userId,
      username: bookingUsername,
      adventureTitle: paymentIntent.adventureTitle,
      startDate: paymentIntent.startDate,
      endDate: paymentIntent.endDate,
      date: paymentIntent.startDate, 
      price: paymentIntent.price, 
      kayakSelections: kayakSelections, 
      advancePaymentPercentage: paymentIntent.advancePaymentPercentage,
      advancePaymentAmount: paymentIntent.advancePaymentAmount,
      ...(paymentIntent.couponCode && {
        couponCode: paymentIntent.couponCode,
        couponType: paymentIntent.couponType,
        couponValue: paymentIntent.couponValue,
        couponDiscount: paymentIntent.couponDiscount,
        originalPrice: paymentIntent.originalPrice
      }),
      status: 'awaiting confirmation',
      comments: paymentIntent.comments,
      adventureImage: paymentIntent.adventureImage,
      location: paymentIntent.location,
      meetingPoint: paymentIntent.meetingPoint,
      difficulty: paymentIntent.difficulty,
      duration: paymentIntent.duration,
      requirements: paymentIntent.requirements,
      includedItems: paymentIntent.includedItems,
      excludedItems: paymentIntent.excludedItems,
      equipmentNeeded: paymentIntent.equipmentNeeded,
      paymentUrl: paymentIntent.paymentUrl,
      paymentDetails: paymentIntent.paymentDetails,
      paymentTransactionDetails: paymentIntent.paymentTransactionDetails
    });
    
    try {
      await booking.save();
      paymentIntent.convertedToBookingId = booking._id.toString();
      await paymentIntent.save();
      
      // Increment coupon usage if a coupon was used
      if (paymentIntent.couponCode) {
        console.log(`Incrementing usage for coupon: ${paymentIntent.couponCode}`);
        const incrementResult = await incrementCouponUsage(paymentIntent.couponCode);
        if (!incrementResult.success) {
          console.error('Failed to increment coupon usage:', incrementResult.error);
          // Log this but don't fail the booking conversion
          await logConversionErrorToFile(paymentIntent.intentId, incrementResult.error || 'Unknown coupon increment error', 'Coupon usage increment failed in convertPaymentIntentToBooking');
        } else {
          console.log(`Successfully incremented usage for coupon: ${paymentIntent.couponCode}`);
        }
      }
    } catch (error: any) {
      if (error.code === 11000 && error.keyPattern?.orderId) {
        console.warn(`Booking with orderId ${orderId} already exists. Ensuring paymentIntent.convertedToBookingId is set.`);
        const existingBooking = await Booking.findOne({ orderId });
        if (existingBooking && !paymentIntent.convertedToBookingId) {
          paymentIntent.convertedToBookingId = existingBooking._id.toString();
          await paymentIntent.save();
          console.log(`Updated paymentIntent ${paymentIntent.intentId} with existing booking ID ${existingBooking._id.toString()}`);
        }
        return {
          success: true,
          data: {
            bookingId: existingBooking!._id.toString(),
            orderId
          },
          message: "Booking already existed, linked to payment intent."
        };
      }
      const errorMsg = `Failed to save booking: ${error.message}`;
      console.error(`Error saving booking for orderId ${orderId} from paymentIntent ${paymentIntent.intentId}:`, error);
      await logConversionErrorToFile(paymentIntent.intentId, error, `Booking save failed for orderId ${orderId}`);
      return { success: false, error: errorMsg };
    }
    
    if (userForBooking && !userForBooking.orders.some((o: import('../models/user').IOrder) => o.orderId === orderId)) {
      const bookingSummary = [];
      if (kayakSelections.caiacSingle > 0) {
        bookingSummary.push(`${kayakSelections.caiacSingle} Caiac Single`);
      }
      if (kayakSelections.caiacDublu > 0) {
        bookingSummary.push(`${kayakSelections.caiacDublu} Caiac Dublu`);
      }
      if (kayakSelections.placaSUP > 0) {
        bookingSummary.push(`${kayakSelections.placaSUP} Placă SUP`);
      }
      
      userForBooking.orders.push({
        phoneNumber: paymentIntent.phoneNumber,
        orderId,
        date: new Date(),
        startDate: paymentIntent.startDate,
        endDate: paymentIntent.endDate,
        products: [{
          id: paymentIntent.adventureId,
          title: paymentIntent.adventureTitle,
          price: paymentIntent.price,
          description: bookingSummary.join(', '), 
          quantity: quantity 
        }],
        total: discountedTotalPrice, 
        advancePayment: paymentIntent.advancePaymentAmount,
        status: 'awaiting confirmation',
        adventureTitle: paymentIntent.adventureTitle,
        kayakSelections: kayakSelections, 
        location: paymentIntent.location || 'Va fi anunțat',
        meetingPoint: paymentIntent.meetingPoint,
        difficulty: paymentIntent.difficulty,
        remainingPayment: remainingPayment, 
        advancePaymentPercentage: paymentIntent.advancePaymentPercentage,
        ...(paymentIntent.couponCode && {
          couponCode: paymentIntent.couponCode,
          couponType: paymentIntent.couponType,
          couponValue: paymentIntent.couponValue,
          couponDiscount: paymentIntent.couponDiscount,
          originalPrice: paymentIntent.originalPrice
        }),
        paymentUrl: paymentIntent.paymentUrl,
        paymentDetails: paymentIntent.paymentDetails,
        paymentTransactionDetails: paymentIntent.paymentTransactionDetails,
        comments: paymentIntent.comments,
        details: {
          title: paymentIntent.adventureTitle,
          location: paymentIntent.location || 'Va fi anunțat',
          meetingPoint: paymentIntent.meetingPoint,
          difficulty: paymentIntent.difficulty,
          advancePaymentPercentage: paymentIntent.advancePaymentPercentage,
          remainingPayment: remainingPayment, 
          requirements: paymentIntent.requirements || [],
          includedItems: paymentIntent.includedItems || [],
          excludedItems: paymentIntent.excludedItems || [],
          equipmentNeeded: paymentIntent.equipmentNeeded || [],
          duration: paymentIntent.duration || { value: 0, unit: 'hours' },
          totalPrice: discountedTotalPrice, 
          ...(paymentIntent.couponCode && {
            couponCode: paymentIntent.couponCode,
            couponType: paymentIntent.couponType,
            couponValue: paymentIntent.couponValue,
            couponDiscount: paymentIntent.couponDiscount,
            originalPrice: paymentIntent.originalPrice
          })
        }
      });
      
      try {
        await userForBooking.save();
      } catch (userSaveError: any) {
        const errorMsg = `Failed to save user order details for orderId ${orderId}: ${userSaveError.message}`;
        console.error(`Error saving user ${userForBooking._id} after adding order ${orderId}:`, userSaveError);
        await logConversionErrorToFile(paymentIntent.intentId, userSaveError, `User save failed after adding order ${orderId} for user ${userForBooking._id}`);
        return { success: false, error: errorMsg };
      }
      
      revalidatePath('/control-panel/orders');
      revalidatePath('/control-panel');
      
      await sendReservationConfirmation(
        userForBooking.name || userForBooking.email.split('@')[0],
        userForBooking.email,
        {
          reservationId: paymentIntent.intentId,
          adventureTitle: paymentIntent.adventureTitle,
          date: format(paymentIntent.startDate, 'dd MMMM yyyy', { locale: ro }),
          startTime: format(paymentIntent.startDate, 'HH:mm'),
          endTime: format(paymentIntent.endDate, 'HH:mm'),
          location: paymentIntent.location || 'Va fi anunțat',
          participants: quantity,
          totalPrice: discountedTotalPrice,
          advancePayment: paymentIntent.advancePaymentAmount,
          status: paymentIntent.paymentStatus,
          comments: paymentIntent.comments,
          ...(paymentIntent.couponCode && {
            couponCode: paymentIntent.couponCode,
            couponType: paymentIntent.couponType,
            couponValue: paymentIntent.couponValue,
            couponDiscount: paymentIntent.couponDiscount,
            originalPrice: effectiveBasePrice
          })
        }
      );
    }
    
    revalidatePath('/dashboard');
    revalidatePath('/profile');
    revalidatePath(`/adventures/${paymentIntent.adventureId}`);
    
    console.log(`Successfully converted payment intent ${paymentIntent.intentId} to booking ${booking._id} with orderId ${orderId}`);
    
    return { 
      success: true, 
      data: { 
        bookingId: booking._id.toString(),
        orderId: orderId, 
        status: booking.status 
      } 
    };
  } catch (error: any) {
    const intentIdToLog = paymentIntentForLog ? paymentIntentForLog.intentId : paymentIntentMongoId;
    const errorMsg = `An unexpected error occurred during booking conversion: ${error.message}`;
    console.error(`Critical error in convertPaymentIntentToBooking for ID ${intentIdToLog}:`, error);
    await logConversionErrorToFile(intentIdToLog, error, 'Main catch block in convertPaymentIntentToBooking');
    return { 
      success: false, 
      error: errorMsg 
    };
  }
}

// Add server action to update phone number on payment intent
export async function updatePaymentIntentPhone(
  intentMongoId: string, // Changed to intentMongoId for clarity
  phoneNumber: string
) {
  await dbConnect();
  try {
    if (!mongoose.Types.ObjectId.isValid(intentMongoId)) {
      const invalidIdError = new Error('Invalid MongoDB ObjectId format for Payment Intent phone update');
      await logConversionErrorToFile(intentMongoId, invalidIdError, 'Invalid ID in updatePaymentIntentPhone');
      return { success: false, error: invalidIdError.message };
    }
    const paymentIntent = await PaymentIntent.findById(intentMongoId);
    if (!paymentIntent) {
      await logConversionErrorToFile(intentMongoId, 'PaymentIntent not found by MongoID', 'updatePaymentIntentPhone lookup');
      return { success: false, error: 'Payment intent not found' };
    }
    paymentIntent.phoneNumber = phoneNumber;
    await paymentIntent.save();
    console.log(`Phone number updated for intent ${paymentIntent.intentId} (MongoID: ${intentMongoId})`);
    return { success: true, data: { intentId: paymentIntent.intentId, mongoId: intentMongoId } }; // Return some useful data
  } catch (error: any) {
    // Determine the intentId string for logging if possible
    let intentIdStrForLog = intentMongoId;
    try {
      const pi = await PaymentIntent.findById(intentMongoId).select('intentId').lean() as IPaymentIntent | null;
      if (pi && pi.intentId) {
        intentIdStrForLog = pi.intentId;
      }
    } catch { /* ignore lookup error for logging */ }

    console.error(`Error updating payment intent phone number for ID ${intentMongoId}:`, error);
    await logConversionErrorToFile(intentIdStrForLog, error, 'Main catch block in updatePaymentIntentPhone');
    return { success: false, error: error.message || 'Failed to update payment intent phone number' };
  }
} 