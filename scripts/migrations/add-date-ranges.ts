import { config } from 'dotenv';
import mongoose from 'mongoose';
import { format } from 'date-fns';

// Load environment variables from .env.local
config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in .env.local');
}

// Define schemas for migration
const BookingSchema = new mongoose.Schema(
  {
    orderId: String,
    adventureId: String,
    userId: String,
    username: String,
    adventureTitle: String,
    date: Date,
    startDate: Date,
    endDate: Date,
    price: Number,
    advancePaymentPercentage: Number,
    advancePaymentAmount: Number,
    status: String,
    comments: String,
    adventureImage: String,
  },
  {
    timestamps: true,
  }
);

const AdventureSchema = new mongoose.Schema(
  {
    title: String,
    images: [String],
    date: Date,
    endDate: Date,
    dates: [{
      startDate: Date,
      endDate: Date
    }],
    price: Number,
    location: String,
    difficulty: String,
    duration: {
      value: Number,
      unit: String,
    },
    advancePaymentPercentage: Number,
  },
  {
    timestamps: true,
  }
);

const AddressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  country: String,
  zipCode: String
});

const OrderSchema = new mongoose.Schema({
  orderId: String,
  date: Date,
  startDate: Date,
  endDate: Date,
  products: [mongoose.Schema.Types.Mixed],
  total: Number,
  advancePayment: Number,
  status: String,
  statusMessage: String
});

const UserSchema = new mongoose.Schema({
  name: String,
  surname: String,
  username: String,
  email: String,
  password: String,
  oauth_provider: String,
  address: [AddressSchema],
  sign_up_date: Date,
  orders: [OrderSchema],
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

const migrateToDateRanges = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create models
    const Booking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
    const Adventure = mongoose.models.Adventure || mongoose.model('Adventure', AdventureSchema);
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    // 1. Update bookings
    console.log('Migrating bookings...');
    const bookings = await Booking.find({
      $or: [
        { startDate: { $exists: false } },
        { startDate: null },
        { endDate: { $exists: false } },
        { endDate: null }
      ],
      date: { $exists: true, $ne: null }
    });

    console.log(`Found ${bookings.length} bookings without proper date ranges`);

    for (const booking of bookings) {
      if (!booking.date) {
        console.warn(`Booking ${booking.orderId} has no date, skipping`);
        continue;
      }

      // Get adventure for this booking to determine end date
      const adventure = await Adventure.findById(booking.adventureId);
      
      // Set startDate to the current date field
      booking.startDate = booking.date;
      
      // Determine endDate
      if (adventure) {
        // If the adventure has dates array, try to find matching date
        if (adventure.dates && adventure.dates.length > 0) {
          const matchingDatePair = adventure.dates.find((datePair: any) => {
            const pairStartDate = new Date(datePair.startDate);
            const bookingDate = new Date(booking.date);
            return pairStartDate.toDateString() === bookingDate.toDateString();
          });
          
          if (matchingDatePair) {
            booking.endDate = matchingDatePair.endDate;
          } else if (adventure.endDate) {
            booking.endDate = adventure.endDate;
          } else {
            // Calculate based on duration
            const endDate = new Date(booking.date);
            if (adventure.duration && adventure.duration.unit === 'days') {
              endDate.setDate(endDate.getDate() + adventure.duration.value);
            } else if (adventure.duration && adventure.duration.unit === 'hours') {
              endDate.setHours(endDate.getHours() + adventure.duration.value);
            } else {
              // Default to one day after
              endDate.setDate(endDate.getDate() + 1);
            }
            booking.endDate = endDate;
          }
        } else if (adventure.endDate) {
          booking.endDate = adventure.endDate;
        } else {
          // Calculate based on duration
          const endDate = new Date(booking.date);
          if (adventure.duration && adventure.duration.unit === 'days') {
            endDate.setDate(endDate.getDate() + adventure.duration.value);
          } else if (adventure.duration && adventure.duration.unit === 'hours') {
            endDate.setHours(endDate.getHours() + adventure.duration.value);
          } else {
            // Default to one day after
            endDate.setDate(endDate.getDate() + 1);
          }
          booking.endDate = endDate;
        }
      } else {
        // If adventure not found, default to one day after
        const endDate = new Date(booking.date);
        endDate.setDate(endDate.getDate() + 1);
        booking.endDate = endDate;
      }
      
      // Save the updated booking
      await booking.save();
      console.log(`Updated booking ${booking.orderId}: ${format(new Date(booking.startDate), 'yyyy-MM-dd')} -> ${format(new Date(booking.endDate), 'yyyy-MM-dd')}`);
    }

    // 2. Update orders in user documents
    console.log('\nMigrating orders in user documents...');
    const users = await User.find({ 'orders.0': { $exists: true } });
    console.log(`Found ${users.length} users with orders`);

    let orderCount = 0;
    let updatedOrderCount = 0;

    for (const user of users) {
      let userUpdated = false;

      for (const order of user.orders) {
        orderCount++;
        
        if (order.date && (!order.startDate || !order.endDate)) {
          // Find related booking by orderId
          const booking = await Booking.findOne({ orderId: order.orderId });
          
          if (booking && booking.startDate && booking.endDate) {
            // Use the booking's date range
            order.startDate = booking.startDate;
            order.endDate = booking.endDate;
          } else {
            // Default: copy date to startDate and create endDate one day later
            order.startDate = order.date;
            const endDate = new Date(order.date);
            endDate.setDate(endDate.getDate() + 1);
            order.endDate = endDate;
          }
          
          updatedOrderCount++;
          userUpdated = true;
        }
      }

      if (userUpdated) {
        await user.save();
        console.log(`Updated orders for user ${user.email}`);
      }
    }

    console.log(`Migration completed: Updated ${updatedOrderCount} of ${orderCount} orders`);
    process.exit(0);
  } catch (error) {
    console.error('Error in migration:', error);
    process.exit(1);
  }
};

// Run the migration
migrateToDateRanges(); 