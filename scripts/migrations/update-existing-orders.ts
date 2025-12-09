#!/usr/bin/env ts-node

/**
 * Migration script to update existing orders with missing adventure details
 * This script will find all orders without proper adventure details and
 * update them by retrieving the information from the corresponding bookings or adventures
 */

import dbConnect from '../../lib/db';
import User from '../../lib/models/user';
import Booking from '../../lib/models/booking';
import Adventure from '../../lib/models/adventure';
import mongoose from 'mongoose';

async function migrateOrderDetails() {
  try {
    console.log('Connecting to database...');
    await dbConnect();
    console.log('Connected to database');

    console.log('Finding users with orders...');
    const users = await User.find({ 'orders.0': { $exists: true } });
    console.log(`Found ${users.length} users with orders`);

    let totalOrdersProcessed = 0;
    let totalOrdersUpdated = 0;
    
    for (const user of users) {
      console.log(`Processing orders for user: ${user.name} ${user.surname} (${user._id})`);
      
      // Track which orders need to be updated
      const ordersToUpdate = [];
      
      for (const order of user.orders) {
        totalOrdersProcessed++;
        const orderId = order.orderId;
        
        // Check if this order is missing essential details
        const needsUpdate = !order.adventureTitle || !order.location || !order.meetingPoint || !order.difficulty || !order.details;
        
        if (needsUpdate) {
          console.log(`Order ${orderId} needs adventure details update`);
          
          // Try to find the corresponding booking
          const booking = await Booking.findOne({ orderId });
          
          if (booking) {
            console.log(`Found booking for order: ${orderId}`);
            
            // Try to find the adventure
            let adventure = null;
            if (booking.adventureId) {
              try {
                adventure = await Adventure.findById(booking.adventureId);
              } catch (error) {
                console.error(`Error finding adventure: ${error}`);
              }
            }
            
            if (adventure) {
              console.log(`Found adventure for order: ${orderId}`);
              
              // Calculate remaining payment
              const advancePaymentAmount = booking.advancePaymentAmount || 0;
              const totalPrice = booking.price || 0;
              const remainingPayment = totalPrice - advancePaymentAmount;
              
              // Update the order with all details from adventure and booking
              order.adventureTitle = adventure.title || booking.adventureTitle;
              order.location = adventure.location || booking.location;
              order.meetingPoint = adventure.meetingPoint || booking.meetingPoint;
              order.difficulty = adventure.difficulty || booking.difficulty;
              order.remainingPayment = remainingPayment;
              order.advancePaymentPercentage = adventure.advancePaymentPercentage || booking.advancePaymentPercentage;
              
              // Create or update the details object
              order.details = {
                title: adventure.title || booking.adventureTitle,
                location: adventure.location || booking.location,
                meetingPoint: adventure.meetingPoint || booking.meetingPoint,
                difficulty: adventure.difficulty || booking.difficulty,
                advancePaymentPercentage: adventure.advancePaymentPercentage || booking.advancePaymentPercentage,
                remainingPayment: remainingPayment,
                requirements: adventure.requirements || [],
                includedItems: adventure.includedItems || [],
                excludedItems: adventure.excludedItems || [],
                equipmentNeeded: adventure.equipmentNeeded || [],
                duration: adventure.duration || { value: 0, unit: 'hours' },
                minimumAge: adventure.minimumAge,
                minimumParticipants: adventure.minimumParticipants,
                maximumParticipants: adventure.maximumParticipants
              };
              
              ordersToUpdate.push(order);
              totalOrdersUpdated++;
            } else {
              console.log(`No adventure found for booking: ${booking._id}, using booking details only`);
              
              // Calculate remaining payment
              const advancePaymentAmount = booking.advancePaymentAmount || 0;
              const totalPrice = booking.price || 0;
              const remainingPayment = totalPrice - advancePaymentAmount;
              
              // Update with booking details only
              order.adventureTitle = booking.adventureTitle;
              order.location = booking.location;
              order.meetingPoint = booking.meetingPoint;
              order.difficulty = booking.difficulty;
              order.remainingPayment = remainingPayment;
              order.advancePaymentPercentage = booking.advancePaymentPercentage;
              
              // Create or update the details object with booking information
              order.details = {
                title: booking.adventureTitle,
                location: booking.location,
                meetingPoint: booking.meetingPoint,
                difficulty: booking.difficulty,
                advancePaymentPercentage: booking.advancePaymentPercentage,
                remainingPayment: remainingPayment
              };
              
              ordersToUpdate.push(order);
              totalOrdersUpdated++;
            }
          } else {
            console.log(`No booking found for order: ${orderId}, skipping`);
          }
        }
      }
      
      if (ordersToUpdate.length > 0) {
        console.log(`Saving ${ordersToUpdate.length} updated orders for user ${user._id}`);
        await user.save();
      }
    }
    
    console.log('Order migration complete!');
    console.log(`Processed ${totalOrdersProcessed} orders total`);
    console.log(`Updated ${totalOrdersUpdated} orders with missing adventure details`);
    
  } catch (error) {
    console.error('Error in migration script:', error);
  } finally {
    console.log('Closing database connection...');
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

// Run the migration
migrateOrderDetails().catch(console.error); 