'use server';

import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import dbConnect from '../db';
import Booking, { IBooking } from '../models/booking';
import User from '../models/user';
import Adventure from '../models/adventure';
import { emailService } from '../email';
import { format, startOfDay, isAfter, isSameDay } from 'date-fns';
import { serializeData } from '../utils/serializer';
import Coupon from '../models/coupon';
import { incrementCouponUsage } from './coupon';

// Helper functions for sending emails
async function sendOrderConfirmation(params: {
  to: string;
  username: string;
  orderDetails: {
    orderId: string;
    adventure: string;
    date: string;
    time?: string;
    items: string;
    total: number;
    advancePayment: number;
    remainingPayment: number;
    kayakSelections?: {
      caiacSingle: number;
      caiacDublu: number;
      placaSUP: number;
    };
    couponCode?: string;
    couponDiscount?: number;
  }
}): Promise<{ success: boolean; error?: string }> {
  try {
    return await emailService.sendOrderConfirmation(params);
  } catch (error) {
    console.error('Error in sendOrderConfirmation helper:', error);
    return { success: false, error: 'Failed to send order confirmation email' };
  }
}

async function sendReservationChangeNotification(
  name: string,
  email: string,
  changeType: 'update' | 'cancellation',
  reservationDetails: any
): Promise<{ success: boolean; error?: string }> {
  try {
    return await emailService.sendReservationChangeNotification(
      name, 
      email, 
      changeType, 
      reservationDetails
    );
  } catch (error) {
    console.error(`Error in sendReservationChangeNotification helper (${changeType}):`, error);
    return { success: false, error: `Failed to send ${changeType} notification email` };
  }
}

export type BookingWithDetails = IBooking & {
  _id: string;
};

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
 * Create a new booking for an adventure
 */
export async function createBooking(
  adventureId: string,
  userId: string,
  bookingDate: Date,
  comments?: string,
  caiacSelections: KayakSelections = { caiacSingle: 0, caiacDublu: 0, placaSUP: 0 },
  couponData?: CouponData
) {
  await dbConnect();
  
  try {
    // Get the adventure and user
    const [adventure, user] = await Promise.all([
      Adventure.findById(adventureId),
      User.findById(userId)
    ]);
    
    if (!adventure) {
      return { success: false, error: 'Adventure not found' };
    }
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    // Generate a unique order ID
    const orderId = `ADV-${uuidv4().substring(0, 8).toUpperCase()}`;
    
    // Validate booking date - must be in the future
    const now = new Date();
    const bookingStart = startOfDay(new Date(bookingDate));
    
    if (isAfter(now, bookingStart)) {
      return { success: false, error: 'Booking date must be in the future' };
    }
    
    // If the adventure has a booking cutoff hour, respect it
    if (adventure.bookingCutoffHour !== null && 
        adventure.bookingCutoffHour !== undefined && 
        isSameDay(now, bookingStart)) {
      // Check if current hour is past the cutoff hour
      const cutoffHour = adventure.bookingCutoffHour;
      const currentHour = now.getHours();
      
      if (currentHour >= cutoffHour) {
        return { 
          success: false, 
          error: `Bookings for today must be made before ${cutoffHour}:00` 
        };
      }
    }
    
    // Validate kayak selections
    const totalKayaks = caiacSelections.caiacSingle + caiacSelections.caiacDublu + caiacSelections.placaSUP;
    
    if (totalKayaks <= 0) {
      return { success: false, error: 'At least one kayak must be selected' };
    }
    
    // Create journey start and end dates based on adventure duration
    const startDate = new Date(bookingDate);
    let endDate = new Date(startDate);
    
    if (adventure.duration.unit === 'hours') {
      endDate.setHours(endDate.getHours() + adventure.duration.value);
    } else { // days
      endDate.setDate(endDate.getDate() + adventure.duration.value);
    }
    
    // Get adventure first image for thumbnail
    const adventureImage = adventure.images && adventure.images.length > 0 
      ? adventure.images[0] 
      : null;
    
    // Calculate total participants and base price
    const totalParticipants = 
      caiacSelections.caiacSingle + 
      (caiacSelections.caiacDublu * 2) + 
      caiacSelections.placaSUP;
    
    // Calculate total price based on kayak selections and base price
    const baseTotalPrice = 
      (caiacSelections.caiacSingle * adventure.price) + 
      (caiacSelections.caiacDublu * adventure.price * 2) + 
      (caiacSelections.placaSUP * adventure.price);
    
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
      
      // Increment coupon usage count using the proper function
      const incrementResult = await incrementCouponUsage(couponData.code);
      if (!incrementResult.success) {
        console.error('Failed to increment coupon usage:', incrementResult.error);
        // Continue with booking creation even if coupon increment fails
      }
    }
    
    // Calculate advance payment amount based on the discounted total price
    const advancePaymentAmount = Math.round(totalPrice * (adventure.advancePaymentPercentage / 100));
    
    // Create a summary of the items being booked
    const bookingSummary = [];
    if (caiacSelections.caiacSingle > 0) {
      bookingSummary.push(`${caiacSelections.caiacSingle} Caiac Single`);
    }
    if (caiacSelections.caiacDublu > 0) {
      bookingSummary.push(`${caiacSelections.caiacDublu} Caiac Dublu`);
    }
    if (caiacSelections.placaSUP > 0) {
      bookingSummary.push(`${caiacSelections.placaSUP} Placă SUP`);
    }
    
    // Create the booking with the provided date and explicitly set status
    // If advance payment is required, set status to 'pending' instead of 'awaiting confirmation'
    const bookingStatus = advancePaymentAmount > 0 ? 'pending' : 'awaiting confirmation';
    console.log(`Creating booking with status: ${bookingStatus}`);
    
    const booking = new Booking({
      orderId,
      adventureId,
      userId,
      username: `${user.name} ${user.surname}`,
      adventureTitle: adventure.title,
      date: bookingDate, // Keep for backward compatibility
      startDate: startDate,
      endDate: endDate,
      price: adventure.price, // This is the per-person price
      kayakSelections: caiacSelections,
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
      status: bookingStatus, // Set based on whether advance payment is required
      comments,
      adventureImage, // Store the adventure image
      location: adventure.location,
      meetingPoint: adventure.meetingPoint,
      difficulty: adventure.difficulty,
      duration: adventure.duration,
    });
    
    await booking.save();
    
    // Verify the booking status after save
    console.log(`Saved booking with ID ${booking._id} and status: ${booking.status}`);
    
    // Also add the order to the user's orders array with explicit status
    const orderStatus = advancePaymentAmount > 0 ? 'pending' : 'awaiting confirmation';
    console.log(`Creating order in user.orders with status: ${orderStatus}`);
    
    // Push the order to the user's orders array
    user.orders.push({
      orderId,
      date: bookingDate,
      startDate: startDate,
      endDate: endDate,
      products: [{
        name: adventure.title,
        quantity: totalParticipants,
        price: adventure.price
      }],
      total: totalPrice, // Store the total price after any discounts
      advancePayment: advancePaymentAmount,
      // Add coupon data if provided
      ...(couponData && {
        couponCode: couponData.code,
        couponType: couponData.type,
        couponValue: couponData.value,
        couponDiscount: couponDiscount,
        originalPrice: baseTotalPrice
      }),
      status: orderStatus,
      kayakSelections: caiacSelections,
      location: adventure.location,
      meetingPoint: adventure.meetingPoint,
      difficulty: adventure.difficulty,
      remainingPayment: totalPrice - advancePaymentAmount,
      advancePaymentPercentage: adventure.advancePaymentPercentage,
      adventureTitle: adventure.title,
      comments,
      // Add detailed adventure information for easy reference
      details: {
        location: adventure.location,
        meetingPoint: adventure.meetingPoint,
        difficulty: adventure.difficulty,
        advancePaymentPercentage: adventure.advancePaymentPercentage,
        remainingPayment: totalPrice - advancePaymentAmount,
        title: adventure.title,
        requirements: adventure.requirements,
        includedItems: adventure.includedItems,
        excludedItems: adventure.excludedItems,
        equipmentNeeded: adventure.equipmentNeeded,
        duration: adventure.duration,
        totalPrice: totalPrice,
        quantity: totalParticipants
      }
    });
    
    await user.save();
    
    // Send order confirmation email
    try {
      console.log(`Attempting to send order confirmation email to: ${user.email}`);
      console.log('Email data:', {
        username: `${user.name} ${user.surname}`,
        orderDetails: {
          orderId,
          adventure: adventure.title,
          caiacSelections,
          bookingSummary
        }
      });
      
      const emailResult = await sendOrderConfirmation({
        to: user.email,
        username: `${user.name} ${user.surname}`,
        orderDetails: {
          orderId,
          adventure: adventure.title,
          date: format(startDate, 'PPP', { locale: undefined }), // Format date nicely
          time: format(startDate, 'p', { locale: undefined }), // Format time nicely
          items: bookingSummary.join(', '), // Use the summary in email
          total: totalPrice,
          advancePayment: advancePaymentAmount,
          remainingPayment: totalPrice - advancePaymentAmount,
          kayakSelections: caiacSelections, // Add the kayak selections to the email
          // Add coupon info if any
          ...(couponData && {
            couponCode: couponData.code,
            couponDiscount: couponDiscount
          })
        }
      });
      
      console.log('Email sending result:', emailResult);
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError);
      // Don't fail the booking creation if email fails
    }
    
    // Revalidate relevant pages to update cache
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/bookings');
    revalidatePath('/control-panel/bookings');
    
    return { 
      success: true, 
      data: {
        bookingId: booking._id,
        orderId: booking.orderId,
        status: booking.status,
        startDate: booking.startDate,
        endDate: booking.endDate,
        advancePaymentAmount,
        total: totalPrice
      }
    };
    
  } catch (error) {
    console.error('Error creating booking:', error);
    return { success: false, error: 'An error occurred while creating the booking' };
  }
}

/**
 * Get all bookings for a user
 */
export async function getUserBookings(userId: string) {
  await dbConnect();
  
  try {
    if (!userId) {
      return { success: false, error: 'User ID is required' };
    }
    
    console.log('Getting bookings for user:', userId);
    
    // Create a query based on string userId - don't try to convert to ObjectId
    const bookings = await Booking.find({ userId }).sort({ createdAt: -1 });
    
    console.log(`Found ${bookings.length} bookings for user ${userId}`);
    
    // Serialize the bookings
    const safeBookings = bookings.map(booking => ({
      ...booking.toObject(),
      _id: booking._id.toString()
    }));
    
    return { success: true, data: safeBookings };
  } catch (error: any) {
    console.error('Error fetching user bookings:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to fetch bookings' 
    };
  }
}

/**
 * Get all bookings (admin function)
 */
export async function getAllBookings() {
  await dbConnect();
  
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    
    // Serialize the bookings
    const safeBookings = bookings.map(booking => ({
      ...booking.toObject(),
      _id: booking._id.toString()
    }));
    
    return { success: true, data: safeBookings };
  } catch (error: any) {
    console.error('Error fetching all bookings:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to fetch bookings' 
    };
  }
}

/**
 * Get a booking by ID
 */
export async function getBookingById(bookingId: string) {
  await dbConnect();
  
  try {
    // Convert string ID to ObjectId if needed
    let bookingObjectId;
    let booking;
    
    try {
      if (mongoose.Types.ObjectId.isValid(bookingId)) {
        bookingObjectId = new mongoose.Types.ObjectId(bookingId);
        booking = await Booking.findById(bookingObjectId);
      }
    } catch (error) {
      console.error('Invalid booking ID format:', error);
    }
    
    // If not found by ID, try to find by orderId
    if (!booking) {
      booking = await Booking.findOne({ orderId: bookingId });
    }
    
    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }
    
    // Convert Mongoose document to a plain object and fully serialize it
    const bookingObj = booking.toObject();
    
    return { success: true, data: serializeData(bookingObj) };
  } catch (error: any) {
    console.error('Error fetching booking:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to fetch booking' 
    };
  }
}

/**
 * Update a booking's status
 */
export async function updateBookingStatus(
  bookingId: string,
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'awaiting confirmation' | 'processing' | 'pending_payment' | 'payment_confirmed' | 'declined' | 'expired' | 'error',
  comments?: string
) {
  await dbConnect();
  
  try {
    // Convert string ID to ObjectId if needed
    let bookingObjectId;
    try {
      bookingObjectId = new mongoose.Types.ObjectId(bookingId);
    } catch (error) {
      console.error('Invalid booking ID format:', error);
      return { success: false, error: 'Invalid booking ID format' };
    }
    
    // Get the booking before update to compare status change
    const oldBooking = await Booking.findById(bookingObjectId);
    if (!oldBooking) {
      return { success: false, error: 'Booking not found' };
    }
    
    const previousStatus = oldBooking.status;
    
    // Get the adventure details (we'll need these for syncing data)
    const adventure = await Adventure.findById(oldBooking.adventureId);
    
    // --- Correct Price Calculation Start ---
    const unitPrice = adventure ? Number(adventure.price || 0) : Number(oldBooking.price || 0);
    const caiacSelections = oldBooking.caiacSelections || { caiacSingle: 0, caiacDublu: 0, placaSUP: 0 };
    
    const calculatedTotalPrice = 
      (Number(caiacSelections.caiacSingle || 0) * unitPrice) + 
      (Number(caiacSelections.caiacDublu || 0) * unitPrice * 2) + 
      (Number(caiacSelections.placaSUP || 0) * unitPrice);
      
    const advancePaymentAmount = Number(oldBooking.advancePaymentAmount || 0);
    const calculatedRemainingPayment = calculatedTotalPrice - advancePaymentAmount;
    const advancePaymentPercentage = oldBooking.advancePaymentPercentage || (adventure ? adventure.advancePaymentPercentage : 0);
    // --- Correct Price Calculation End ---

    // Get complete adventure details for data sync
    let adventureDetails = {
      location: adventure?.location || oldBooking.location || 'Unknown',
      meetingPoint: adventure?.meetingPoint || oldBooking.meetingPoint,
      difficulty: adventure?.difficulty || oldBooking.difficulty,
      requirements: adventure?.requirements || [],
      includedItems: adventure?.includedItems || [],
      excludedItems: adventure?.excludedItems || [],
      equipmentNeeded: adventure?.equipmentNeeded || [],
      duration: adventure?.duration || { value: 0, unit: 'hours' },
      minimumAge: adventure?.minimumAge,
      minimumParticipants: adventure?.minimumParticipants,
      maximumParticipants: adventure?.maximumParticipants
    };

    // Update the booking
    const booking = await Booking.findByIdAndUpdate(
      bookingObjectId,
      {
        status,
        location: adventureDetails.location,
        meetingPoint: adventureDetails.meetingPoint,
        difficulty: adventureDetails.difficulty,
        // Save the correctly calculated values
        advancePaymentPercentage: advancePaymentPercentage,
        advancePaymentAmount: advancePaymentAmount,
        comments: comments || oldBooking.comments
      },
      { new: true }
    );
    
    if (!booking) {
      return { success: false, error: 'Booking not found after update' };
    }
    
    // Get the user document
    const user = await User.findOne({ 'orders.orderId': booking.orderId });
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    // Find the matching order in the user's orders array
    const orderIndex = user.orders.findIndex((o: any) => o.orderId === booking.orderId);
    
    if (orderIndex === -1) {
      console.error(`Order ${booking.orderId} not found in user's orders array`);
      return { success: false, error: 'Order not found in user profile' };
    }
    
    // Get the current order from user's orders array
    const currentOrder = user.orders[orderIndex];
    
    // Use the values from the order instead of recalculating
    const remainingPayment = currentOrder.remainingPayment;
    const orderTotalPrice = currentOrder.total || calculatedTotalPrice; // Preserve the order's total price
    
    // Prepare updated order data with all the necessary details
    const updatedOrder = {
      ...currentOrder.toObject(), // Keep existing order data
      status, // Update the status
      // Ensure the correct dates are present
      startDate: booking.startDate || booking.date,
      endDate: booking.endDate,
      // Ensure all financial details are preserved/updated
      total: orderTotalPrice, // Use the order's total price
      advancePayment: advancePaymentAmount, // Use existing paid amount
      // Store everything directly on the order object for easier access
      location: adventureDetails.location,
      meetingPoint: adventureDetails.meetingPoint,
      difficulty: adventureDetails.difficulty,
      remainingPayment: remainingPayment, // Use the value from the order
      advancePaymentPercentage: advancePaymentPercentage,
      adventureTitle: booking.adventureTitle,
      // Additional details to preserve in a more comprehensive format
      details: {
        location: adventureDetails.location,
        meetingPoint: adventureDetails.meetingPoint,
        difficulty: adventureDetails.difficulty,
        totalPrice: orderTotalPrice, // Use the order's total price
        advancePaymentPercentage: advancePaymentPercentage,
        remainingPayment: remainingPayment, // Use the value from the order
        title: booking.adventureTitle,
        requirements: adventureDetails.requirements,
        includedItems: adventureDetails.includedItems,
        excludedItems: adventureDetails.excludedItems,
        equipmentNeeded: adventureDetails.equipmentNeeded,
        duration: adventureDetails.duration,
        minimumAge: adventureDetails.minimumAge,
        minimumParticipants: adventureDetails.minimumParticipants,
        maximumParticipants: adventureDetails.maximumParticipants
      }
    };

    // Update the specific order in the user's orders array with the full details
    user.orders[orderIndex] = updatedOrder;
    
    // Save the user document with the updated order
    await user.save();
    
    console.log(`Updated order ${booking.orderId} in user's orders array with full details and status: ${status}`);
    
    // If status changed to confirmed, send confirmation email
    if (previousStatus !== status && status === 'confirmed') {
      try {
        const userName = `${user.name} ${user.surname}`;
        
        // Format the dates for display - use new date fields if available
        const formattedDate = format(new Date(booking.startDate || booking.date), 'dd.MM.yyyy');
        let formattedEndDate;
        if (booking.endDate) {
          formattedEndDate = format(new Date(booking.endDate), 'dd.MM.yyyy');
        } else if (adventure && adventure.endDate) {
          formattedEndDate = format(new Date(adventure.endDate), 'dd.MM.yyyy');
        }
        
        // Calculate hours if adventure has duration
        let startTime = undefined;
        let endTime = undefined;
        let durationText = undefined;
        
        if (adventure && adventure.duration) {
          if (adventure.duration.unit === 'hours') {
            // Calculate start and end times if available
            const startDate = new Date(booking.startDate || booking.date);
            startTime = startDate.getHours() + ':' + (startDate.getMinutes() < 10 ? '0' : '') + startDate.getMinutes();
            
            const endDate = new Date(booking.endDate || startDate);
            endDate.setHours(endDate.getHours() + (booking.endDate ? 0 : adventure.duration.value));
            endTime = endDate.getHours() + ':' + (endDate.getMinutes() < 10 ? '0' : '') + endDate.getMinutes();
            
            durationText = `${adventure.duration.value} ore`;
          } else if (adventure.duration.unit === 'days') {
            durationText = `${adventure.duration.value} zile`;
          }
        }
        
        // Log detailed payment information for debugging
        console.log(`Sending confirmation email with detailed payment info:
          Total price: ${orderTotalPrice} lei
          Advance payment: ${advancePaymentAmount} lei
          Remaining payment: ${remainingPayment} lei
          Percentage: ${advancePaymentPercentage}%
          Location: ${updatedOrder.location}
          Start date: ${formattedDate}
          End date: ${formattedEndDate || 'N/A'}`);
        
        // Log the updated order data
        console.log(`Updated order in user document:
          Total: ${updatedOrder.total} 
          Advance payment: ${updatedOrder.advancePayment}
          Remaining payment: ${updatedOrder.remainingPayment}
          Advance payment percentage: ${updatedOrder.advancePaymentPercentage}%
          Created on: ${new Date(updatedOrder.date).toISOString()}
          Location: ${updatedOrder.location}
          Start date: ${updatedOrder.startDate ? new Date(updatedOrder.startDate).toISOString() : 'Not set'}
          End date: ${updatedOrder.endDate ? new Date(updatedOrder.endDate).toISOString() : 'Not set'}`);
        
        // Send confirmation email with payment details and comprehensive adventure info
        await sendReservationChangeNotification(
          userName,
          user.email,
          'update',
          {
            reservationId: booking.orderId,
            adventureTitle: booking.adventureTitle,
            date: formattedDate,
            endDate: formattedEndDate,
            newDate: formattedDate,
            startTime: startTime,
            endTime: endTime,
            duration: durationText,
            location: updatedOrder.location || adventure?.location || booking.location || 'Unknown',
            meetingPoint: adventureDetails.meetingPoint,
            difficulty: adventureDetails.difficulty,
            totalPrice: orderTotalPrice, // Use the order's total price
            advancePayment: advancePaymentAmount,
            remainingPayment: remainingPayment,
            comments: booking.comments,
            customFields: {
              advancePaymentPercentage: advancePaymentPercentage,
              requirements: adventureDetails.requirements,
              includedItems: adventureDetails.includedItems,
              excludedItems: adventureDetails.excludedItems,
              equipmentNeeded: adventureDetails.equipmentNeeded,
              minimumAge: adventureDetails.minimumAge,
              minimumParticipants: adventureDetails.minimumParticipants,
              maximumParticipants: adventureDetails.maximumParticipants
            }
          }
        );
        
        console.log('Reservation status change email sent successfully');
      } catch (emailError) {
        console.error('Error sending status change email:', emailError);
        // Don't fail the update if email sending fails
      }
    }
    
    // If status changed to cancelled, send cancellation email
    if (previousStatus !== status && status === 'cancelled') {
      try {
        const userName = `${user.name} ${user.surname}`;
        
        // Format the dates for display
        const formattedDate = format(new Date(booking.startDate || booking.date), 'dd.MM.yyyy');
        let formattedEndDate;
        if (booking.endDate) {
          formattedEndDate = format(new Date(booking.endDate), 'dd.MM.yyyy');
        } else if (adventure && adventure.endDate) {
          formattedEndDate = format(new Date(adventure.endDate), 'dd.MM.yyyy');
        }
        
        // Calculate hours if adventure has duration
        let startTime = undefined;
        let endTime = undefined;
        let durationText = undefined;
        
        if (adventure && adventure.duration) {
          if (adventure.duration.unit === 'hours') {
            // Calculate start and end times if available
            const startDate = new Date(booking.startDate || booking.date);
            startTime = startDate.getHours() + ':' + (startDate.getMinutes() < 10 ? '0' : '') + startDate.getMinutes();
            
            const endDate = new Date(booking.endDate || startDate);
            endDate.setHours(endDate.getHours() + (booking.endDate ? 0 : adventure.duration.value));
            endTime = endDate.getHours() + ':' + (endDate.getMinutes() < 10 ? '0' : '') + endDate.getMinutes();
            
            durationText = `${adventure.duration.value} ore`;
          } else if (adventure.duration.unit === 'days') {
            durationText = `${adventure.duration.value} zile`;
          }
        }
        
        console.log(`Sending cancellation email for booking:
          Booking ID: ${booking.orderId}
          Adventure: ${booking.adventureTitle}
          Date: ${formattedDate}
          User: ${userName}
          Email: ${user.email}`);
        
        // Get cancellation reason from comments if available
        const cancellationReason = comments || 'No reason provided';
        
        // Calculate refund amount (if advance payment exists)
        let refundAmount = undefined;
        if (advancePaymentAmount > 0) {
          refundAmount = advancePaymentAmount;
        }
        
        // Send cancellation email
        await sendReservationChangeNotification(
          userName,
          user.email,
          'cancellation',
          {
            reservationId: booking.orderId,
            adventureTitle: booking.adventureTitle,
            date: formattedDate,
            endDate: formattedEndDate,
            startTime: startTime,
            endTime: endTime,
            duration: durationText,
            location: updatedOrder.location || adventure?.location || booking.location || 'Unknown',
            totalPrice: calculatedTotalPrice, // Pass calculated total
            refundAmount: refundAmount,
            cancellationReason: cancellationReason,
            customFields: {
              unitPrice: unitPrice,
              advancePaymentPercentage: advancePaymentPercentage
            }
          }
        );
        
        console.log('Reservation cancellation email sent successfully');
      } catch (emailError) {
        console.error('Error sending cancellation email:', emailError);
        // Don't fail the update if email sending fails
      }
    }
    
    // Revalidate relevant paths
    revalidatePath('/dashboard');
    revalidatePath('/profile');
    revalidatePath(`/adventures/${booking.adventureId}`);
    revalidatePath('/control-panel/bookings');
    
    // Serialize the booking
    const safeBooking = {
      ...booking.toObject(),
      _id: booking._id.toString()
    };
    
    return { success: true, data: safeBooking };
  } catch (error: any) {
    console.error('Error updating booking status:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to update booking status' 
    };
  }
}

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId: string) {
  return updateBookingStatus(bookingId, 'cancelled');
}

/**
 * Complete a booking
 */
export async function completeBooking(bookingId: string) {
  return updateBookingStatus(bookingId, 'completed');
}

// Get combined bookings and payment intents for a user
export const getUserBookingsAndIntents = async (userId: string) => {
  try {
    await dbConnect();

    // Fetch bookings
    const bookings = await Booking.find({ userId: userId }).sort({ createdAt: -1 });
    
    // Debug log for bookings status
    console.log("Debug bookings statuses:", bookings.map(b => ({ 
      status: b.status, 
      _id: b._id.toString(),
      orderId: b.orderId,
      caiacSelections: b.caiacSelections
    })));
    
    // Import PaymentIntent model dynamically here to avoid circular dependencies
    const { default: PaymentIntent } = await import('@/lib/models/paymentIntent');
    
    // Fetch payment intents that are pending or processing
    const pendingPaymentIntents = await PaymentIntent.find({
      userId: userId,
      paymentStatus: { $in: ['pending', 'processing', 'declined', 'expired', 'error'] },
      // Don't include ones that have already been converted to bookings
      convertedToBookingId: { $exists: false }
    }).sort({ createdAt: -1 });

    // Debug log for payment intents
    console.log("Debug payment intents statuses:", pendingPaymentIntents.map(pi => ({ 
      status: pi.paymentStatus, 
      _id: pi._id.toString(),
      intentId: pi.intentId,
      caiacSelections: pi.caiacSelections
    })));

    // Map payment intents to match booking structure for frontend
    const mappedIntents = pendingPaymentIntents.map(intent => {
      // Calculate quantity and total price from kayak selections
      const totalKayaks = 
        (intent.caiacSelections?.caiacSingle || 0) + 
        (intent.caiacSelections?.caiacDublu || 0) + 
        (intent.caiacSelections?.placaSUP || 0);
      
      const totalPrice = 
        (intent.caiacSelections?.caiacSingle || 0) * intent.price + 
        (intent.caiacSelections?.caiacDublu || 0) * intent.price * 2 + 
        (intent.caiacSelections?.placaSUP || 0) * intent.price;
      
      // For legacy cases
      const quantity = totalKayaks > 0 ? totalKayaks : (intent.quantity || 1);
      
      return {
        _id: intent._id.toString(),
        orderId: intent.intentId,
        adventureId: intent.adventureId,
        adventureTitle: intent.adventureTitle,
        date: intent.startDate,
        startDate: intent.startDate,
        endDate: intent.endDate,
        price: intent.price,
        advancePaymentPercentage: intent.advancePaymentPercentage,
        advancePaymentAmount: intent.advancePaymentAmount,
        status: intent.paymentStatus,
        isPaymentIntent: true,
        createdAt: intent.createdAt,
        location: intent.location,
        caiacSelections: intent.caiacSelections,
        quantity: quantity,
        paymentAttempt: intent.paymentDetails?.paymentAttempt || 0
      };
    });

    // Combine and sort by creation date
    const combinedResults = [...await Promise.all(bookings.map(async (b) => {
      const bookingObj = b.toObject();
      
      // Get the user to access their orders
      const user = await User.findById(b.userId);
      const userOrder = user?.orders?.find((o: { orderId: string }) => o.orderId === b.orderId);
      
      // Use the remaining payment from user's orders if available
      const remainingPayment = userOrder?.remainingPayment;
      
      return {
        ...bookingObj,
        _id: b._id.toString(),
        isPaymentIntent: false,
        remainingPayment: remainingPayment
      };
    })), ...mappedIntents].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Add computed details like totalPrice, remainingPayment to each booking/intent
    const decoratedResults = combinedResults.map(item => {
      // Calculate quantity from kayak selections for display
      let totalPeople = 0;
      let calculatedTotalPrice = item.totalPrice; // Use pre-calculated total price if available
      
      if (item.caiacSelections) {
        totalPeople = 
          (item.caiacSelections.caiacSingle || 0) + 
          (item.caiacSelections.caiacDublu || 0) * 2 + // Double counts as 2 people
          (item.caiacSelections.placaSUP || 0);
        
        if (!calculatedTotalPrice) {
          calculatedTotalPrice = 
            (item.caiacSelections.caiacSingle || 0) * item.price + 
            (item.caiacSelections.caiacDublu || 0) * item.price * 2 + 
            (item.caiacSelections.placaSUP || 0) * item.price;
        }
      } else {
        // Legacy support
        totalPeople = item.quantity || 1;
        calculatedTotalPrice = item.price * totalPeople;
      }
      
      const remainingPayment = calculatedTotalPrice - (item.advancePaymentAmount || 0);
      
      return {
        ...item,
        quantity: totalPeople, // For displaying total people count
        details: {
          ...(item.details || {}),
          advancePaymentPercentage: item.advancePaymentPercentage,
          remainingPayment,
          totalPrice: calculatedTotalPrice,
          quantity: totalPeople
        }
      };
    });
    
    // Fetch adventure slug for each result to support detail links
    const withSlugs = await Promise.all(
      decoratedResults.map(async (item) => {
        let slug = '';
        try {
          const adventure = await Adventure.findById(item.adventureId);
          slug = adventure?.slug || '';
        } catch (err) {
          console.error(`Error fetching adventure slug for ID ${item.adventureId}:`, err);
        }
        return { ...item, adventureSlug: slug };
      })
    );
    
    // Fully serialize to ensure no MongoDB objects are passed to client
    return {
      success: true,
      data: serializeData(withSlugs)
    };
  } catch (error) {
    console.error('Error fetching user bookings and intents:', error);
    return {
      success: false,
      error: 'Failed to fetch bookings and payment intents'
    };
  }
};

/**
 * Update the phone number for a booking and its corresponding user order
 */
export async function updateBookingPhone(
  bookingId: string,
  phoneNumber: string
) {
  await dbConnect();
  try {
    // Update booking document
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { phoneNumber },
      { new: true }
    );
    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    // Update phone number in user's orders array
    await User.updateOne(
      { _id: booking.userId, 'orders.orderId': booking.orderId },
      { $set: { 'orders.$.phoneNumber': phoneNumber } }
    );

    return { success: true };
  } catch (error: any) {
    console.error('Error updating booking phone number:', error);
    return { success: false, error: error.message || 'Failed to update phone number' };
  }
} 
