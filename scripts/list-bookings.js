#!/usr/bin/env node

/**
 * List Bookings Script
 * 
 * This script connects to the database and lists all bookings
 * to help debug issues with bookings not showing in the UI.
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });
const { MongoClient, ObjectId } = require('mongodb');

// Check if MongoDB URI is set
if (!process.env.MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in your environment variables');
  process.exit(1);
}

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const bookingCollection = db.collection('bookings');
    const paymentIntentCollection = db.collection('paymentintents');
    const userCollection = db.collection('users');
    const adventureCollection = db.collection('adventures');
    
    // Get command line arguments
    const userId = process.argv[2];
    
    // Build query
    const query = {};
    if (userId) {
      try {
        query.userId = new ObjectId(userId);
        console.log(`Filtering by user ID: ${userId}`);
      } catch (error) {
        // If not a valid ObjectId, try to look up user by email
        console.log(`Looking up user by email: ${userId}`);
        const user = await userCollection.findOne({ email: userId });
        if (user) {
          query.userId = user._id;
          console.log(`Found user with ID: ${user._id}`);
        } else {
          console.error(`No user found with email: ${userId}`);
        }
      }
    }
    
    // Fetch bookings
    const bookings = await bookingCollection.find(query).sort({ createdAt: -1 }).limit(10).toArray();
    
    console.log(`Found ${bookings.length} bookings:`);
    
    // Process and display each booking
    for (const booking of bookings) {
      const user = booking.userId ? await userCollection.findOne({ _id: booking.userId }) : null;
      const adventure = booking.adventureId ? await adventureCollection.findOne({ _id: booking.adventureId }) : null;
      
      console.log('\n--------------------------------------');
      console.log(`Booking ID: ${booking._id}`);
      console.log(`Order ID: ${booking.orderId}`);
      console.log(`Created: ${booking.createdAt}`);
      console.log(`Status: ${booking.status}`);
      console.log(`User: ${user ? `${user.name} ${user.surname} (${user.email})` : 'Unknown User'}`);
      console.log(`Adventure: ${adventure ? adventure.title : 'Unknown Adventure'}`);
      console.log(`Date: ${booking.startDate}`);
      
      // Display kayak selections
      if (booking.kayakSelections) {
        console.log('Kayak Selections:');
        console.log(JSON.stringify(booking.kayakSelections, null, 2));
      } else if (booking.quantity) {
        // Legacy booking
        console.log(`Quantity: ${booking.quantity}`);
      }
      
      console.log(`Total Price: ${booking.totalPrice} RON`);
    }
    
    // Check for payment intents
    if (userId) {
      const paymentIntents = await paymentIntentCollection.find(query).sort({ createdAt: -1 }).limit(5).toArray();
      
      if (paymentIntents.length > 0) {
        console.log('\n======================================');
        console.log(`Found ${paymentIntents.length} payment intents:`);
        
        for (const intent of paymentIntents) {
          const adventure = intent.adventureId ? await adventureCollection.findOne({ _id: intent.adventureId }) : null;
          
          console.log('\n--------------------------------------');
          console.log(`Intent ID: ${intent._id}`);
          console.log(`Intent Unique ID: ${intent.intentId}`);
          console.log(`Created: ${intent.createdAt}`);
          console.log(`Status: ${intent.status}`);
          console.log(`Adventure: ${adventure ? adventure.title : 'Unknown Adventure'}`);
          console.log(`Date: ${intent.startDate}`);
          
          // Display kayak selections
          if (intent.kayakSelections) {
            console.log('Kayak Selections:');
            console.log(JSON.stringify(intent.kayakSelections, null, 2));
          } else if (intent.quantity) {
            // Legacy intent
            console.log(`Quantity: ${intent.quantity}`);
          }
          
          console.log(`Total Price: ${intent.totalPrice} RON`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  }); 