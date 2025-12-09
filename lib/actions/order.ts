'use server';

import dbConnect from '../db';
import User, { IOrder } from '../models/user';
import { revalidatePath } from 'next/cache';
import { emailService } from '../email';
// We will dynamically import these to avoid circular dependencies
// import Booking from '../models/booking';
// import { updateBookingStatus } from './booking';

export type OrderWithUser = IOrder & {
  _id: string;
  user: {
    _id: string;
    name: string;
    surname: string;
    email: string;
  };
};

export async function getOrders() {
  await dbConnect();
  try {
    // Find all users that have at least one order
    const users = await User.find({ 'orders.0': { $exists: true } });
    
    // Extract orders from all users and add user information
    const orders: OrderWithUser[] = [];
    
    users.forEach(user => {
      user.orders.forEach((order: any) => {
        // Log the order status to debug
        console.log(`Order ${order.orderId} has status: ${order.status}`);
        
        // Ensure status field exists and has correct value
        const orderStatus = order.status || 'awaiting confirmation';
        
        orders.push({
          ...order.toObject(),
          _id: order._id.toString(),
          // Ensure status is preserved correctly
          status: orderStatus,
          user: {
            _id: user._id.toString(),
            name: user.name,
            surname: user.surname,
            email: user.email
          }
        });
      });
    });
    
    // Sort orders by date descending (newest first)
    orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Log the number of orders and their statuses before serialization
    console.log(`Found ${orders.length} orders with statuses:`, 
      orders.map(o => `${o.orderId}: ${o.status}`));
    
    // Fully serialize the data to remove any MongoDB/Mongoose methods
    const safeOrders = JSON.parse(JSON.stringify(orders));
    
    return { success: true, data: safeOrders };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return { success: false, error: 'Failed to fetch orders' };
  }
}

export async function getOrderById(userId: string, orderId: string) {
  await dbConnect();
  try {
    // Add a small delay to prevent rapid successive calls
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const user = await User.findById(userId);
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    const order = user.orders.id(orderId);
    
    if (!order) {
      return { success: false, error: 'Order not found' };
    }
    
    // Construct the order with user information
    const orderWithUser = {
      ...order.toObject(),
      _id: order._id.toString(),
      user: {
        _id: user._id.toString(),
        name: user.name,
        surname: user.surname,
        email: user.email
      }
    };
    
    // Serialize before returning
    const safeOrder = JSON.parse(JSON.stringify(orderWithUser));
    
    return { success: true, data: safeOrder };
  } catch (error) {
    console.error('Error fetching order:', error);
    return { success: false, error: 'Failed to fetch order' };
  }
}

export async function updateOrderStatus(
  userId: string, 
  orderId: string, 
  status: 'pending' | 'confirmed' | 'processing' | 'cancelled' | 'completed' | 'awaiting confirmation', 
  statusMessage?: string
) {
  await dbConnect();
  try {
    // First, get the full order to ensure we preserve all details
    const userBeforeUpdate = await User.findOne({ _id: userId, 'orders._id': orderId });
    
    if (!userBeforeUpdate) {
      return { success: false, error: 'User or order not found' };
    }
    
    const existingOrder = userBeforeUpdate.orders.id(orderId);
    
    if (!existingOrder) {
      return { success: false, error: 'Order not found' };
    }
    
    // Recalculate remaining payment so it stays accurate on status change
    const currentTotal = existingOrder.total || 0;
    const currentAdvance = existingOrder.advancePayment || 0;
    const newRemainingPayment = currentTotal - currentAdvance;
    const orderDetails = {
      ...(existingOrder.details || {}),
      remainingPayment: newRemainingPayment,
    };
    
    // IMPORTANT: Also update the corresponding booking in the Booking collection
    // First, find the matching booking by orderId
    const { default: Booking } = await import('../models/booking');
    const matchingBooking = await Booking.findOne({ orderId: existingOrder.orderId });
    
    // If a matching booking exists, update its status too
    if (matchingBooking) {
      // Import the updateBookingStatus function
      const { updateBookingStatus } = await import('./booking');
      
      // Update the booking status
      const bookingUpdateResult = await updateBookingStatus(
        matchingBooking._id.toString(),
        status,
        statusMessage
      );
      
      if (!bookingUpdateResult.success) {
        console.error('Failed to update booking status:', bookingUpdateResult.error);
        // Continue with order update even if booking update fails
      } else {
        console.log(`Successfully updated booking status for booking with ID: ${matchingBooking._id}`);
      }
    } else {
      console.log(`No matching booking found for order: ${existingOrder.orderId}`);
    }
    
    // Update the order status while preserving all other details
    const user = await User.findOneAndUpdate(
      { _id: userId, 'orders._id': orderId },
      {
        $set: {
          'orders.$.status': status,
          ...(statusMessage ? { 'orders.$.statusMessage': statusMessage } : {}),
          // Update details and top-level remaining payment
          'orders.$.details': orderDetails,
          'orders.$.remainingPayment': newRemainingPayment,
        }
      },
      { new: true }
    );
    
    if (!user) {
      return { success: false, error: 'User or order not found after update' };
    }
    
    const updatedOrder = user.orders.id(orderId);
    
    if (!updatedOrder) {
      return { success: false, error: 'Order not found after update' };
    }
    
    // Construct the order with user information
    const orderWithUser = {
      ...updatedOrder.toObject(),
      _id: updatedOrder._id.toString(),
      user: {
        _id: user._id.toString(),
        name: user.name,
        surname: user.surname,
        email: user.email
      }
    };
    
    // Additional details from order.details to include in email notification
    const productDetails = {
      ...updatedOrder.details || {},
      date: updatedOrder.startDate || updatedOrder.date,
      endDate: updatedOrder.endDate,
      location: updatedOrder.details?.location || updatedOrder.location || 'Unknown',
      meetingPoint: updatedOrder.details?.meetingPoint || updatedOrder.meetingPoint,
      difficulty: updatedOrder.details?.difficulty || updatedOrder.difficulty,
      remainingPayment: updatedOrder.details?.remainingPayment || updatedOrder.remainingPayment,
      advancePaymentPercentage: updatedOrder.details?.advancePaymentPercentage || updatedOrder.advancePaymentPercentage,
      title: updatedOrder.details?.title || updatedOrder.adventureTitle,
      requirements: updatedOrder.details?.requirements || [],
      includedItems: updatedOrder.details?.includedItems || [],
      excludedItems: updatedOrder.details?.excludedItems || [],
      equipmentNeeded: updatedOrder.details?.equipmentNeeded || [],
      duration: updatedOrder.details?.duration,
      minimumAge: updatedOrder.details?.minimumAge,
      minimumParticipants: updatedOrder.details?.minimumParticipants,
      maximumParticipants: updatedOrder.details?.maximumParticipants,
      products: updatedOrder.products,
    };
    
    // Send email notification if status changed to confirmed
    if (status === 'confirmed') {
      try {
        // Skip sending email here as it will be sent by the booking update function
        console.log('Skipping order status update email - it will be sent by the booking update function');
        
        /* Comment out the emailService.sendOrderStatusUpdate call
        await emailService.sendOrderStatusUpdate(
          `${user.name} ${user.surname}`,
          user.email,
          {
            orderId: updatedOrder.orderId,
            status: 'confirmed',
            statusMessage: statusMessage || '',
            products: updatedOrder.products,
            total: updatedOrder.total,
            date: updatedOrder.startDate || updatedOrder.date,
            // Include additional details from the enhanced order structure
            startDate: updatedOrder.startDate,
            endDate: updatedOrder.endDate,
            details: productDetails
          }
        );
        */
      } catch (emailError) {
        console.error('Failed to send order confirmation email:', emailError);
        // Continue with the order update even if email fails
      }
    }
    
    // Serialize before returning
    const safeOrder = JSON.parse(JSON.stringify(orderWithUser));
    
    // Revalidate the orders page to reflect the changes
    revalidatePath('/control-panel/orders');
    revalidatePath('/dashboard');
    revalidatePath('/profile');
    
    return { success: true, data: safeOrder };
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to update order status' 
    };
  }
}

export async function deleteOrder(userId: string, orderId: string) {
  await dbConnect();
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    const order = user.orders.id(orderId);
    
    if (!order) {
      return { success: false, error: 'Order not found' };
    }
    
    // Save the order before removing for return value
    const orderToDelete = {
      ...order.toObject(),
      _id: order._id.toString(),
      user: {
        _id: user._id.toString(),
        name: user.name,
        surname: user.surname,
        email: user.email
      }
    };
    
    // IMPORTANT: Also delete the corresponding booking in the Booking collection
    // First, dynamically import the Booking model
    const { default: Booking } = await import('../models/booking');
    
    // Find and delete the corresponding booking by orderId
    try {
      const deletedBooking = await Booking.findOneAndDelete({ orderId: order.orderId });
      if (deletedBooking) {
        console.log(`Successfully deleted booking with orderId: ${order.orderId}`);
      } else {
        console.log(`No corresponding booking found with orderId: ${order.orderId}`);
      }
    } catch (bookingError) {
      console.error('Error deleting booking:', bookingError);
      // Continue with order deletion even if booking deletion fails
    }
    
    // Remove the order from the user's orders array
    user.orders.pull({ _id: orderId });
    await user.save();
    
    // Serialize before returning
    const safeOrder = JSON.parse(JSON.stringify(orderToDelete));
    
    revalidatePath('/control-panel/orders');
    
    return { success: true, data: safeOrder };
  } catch (error) {
    console.error('Error deleting order:', error);
    return { success: false, error: 'Failed to delete order' };
  }
} 