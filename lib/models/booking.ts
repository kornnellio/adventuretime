import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface IBooking extends Document {
  orderId: string;
  adventureId: string;
  userId: string;
  username: string;
  adventureTitle: string;
  startDate: Date;
  endDate: Date;
  date?: Date;
  price: number;  // This will now store the base price per person
  // Replace quantity with kayak selections
  kayakSelections: {
    caiacSingle: number;
    caiacDublu: number;
    placaSUP: number;
  };
  advancePaymentPercentage: number;
  advancePaymentAmount: number;
  // Coupon-related fields
  couponCode?: string;
  couponDiscount?: number;
  couponType?: 'percentage' | 'fixed';
  couponValue?: number;
  originalPrice?: number; // Store the price before discount
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'awaiting confirmation' | 'pending_payment' | 'payment_confirmed' | 'declined' | 'expired' | 'error' | 'processing';
  statusMessage?: string;
  comments?: string;
  adventureImage?: string;
  location?: string;
  meetingPoint?: string;
  difficulty?: string;
  duration?: {
    value: number;
    unit: string;
  };
  requirements?: string[];
  includedItems?: string[];
  excludedItems?: string[];
  equipmentNeeded?: string[];
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
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    orderId: {
      type: String,
      required: [true, 'Order ID is required'],
      unique: true,
    },
    adventureId: {
      type: String,
      required: [true, 'Adventure ID is required'],
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
    },
    adventureTitle: {
      type: String,
      required: [true, 'Adventure title is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    date: {
      type: Date,
      required: false,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    kayakSelections: {
      type: {
        caiacSingle: {
          type: Number,
          min: 0,
          default: 0
        },
        caiacDublu: {
          type: Number,
          min: 0,
          default: 0
        },
        placaSUP: {
          type: Number,
          min: 0,
          default: 0
        }
      },
      _id: false, // Don't create an _id for this subdocument
      required: [true, 'Kayak selections are required'],
      default: {
        caiacSingle: 0,
        caiacDublu: 0,
        placaSUP: 0
      },
      validate: {
        validator: function(selections: any) {
          // At least one kayak type must be selected
          const total = selections.caiacSingle + selections.caiacDublu + selections.placaSUP;
          return total > 0;
        },
        message: 'At least one kayak must be selected'
      }
    },
    advancePaymentPercentage: {
      type: Number,
      required: [true, 'Advance payment percentage is required'],
      min: 0,
      max: 100,
      default: 30,
    },
    advancePaymentAmount: {
      type: Number,
      required: [true, 'Advance payment amount is required'],
      min: 0,
    },
    // Coupon-related fields
    couponCode: {
      type: String,
      required: false,
    },
    couponDiscount: {
      type: Number,
      required: false,
      min: 0,
    },
    couponType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: false,
    },
    couponValue: {
      type: Number,
      required: false,
      min: 0,
    },
    originalPrice: {
      type: Number,
      required: false,
      min: 0,
    },
    status: {
      type: String,
      enum: {
        values: [
          'pending', 
          'confirmed', 
          'cancelled', 
          'completed', 
          'awaiting confirmation',
          'pending_payment',
          'payment_confirmed',
          'declined',
          'expired',
          'error',
          'processing'
        ],
        message: '{VALUE} is not a valid status'
      },
      default: 'awaiting confirmation',
      set: function(v: string) {
        // Trim any whitespace to ensure consistency
        return v ? v.trim() : v;
      }
    },
    statusMessage: {
      type: String
    },
    comments: {
      type: String,
    },
    adventureImage: {
      type: String,
    },
    location: {
      type: String,
    },
    meetingPoint: {
      type: String,
    },
    difficulty: {
      type: String,
    },
    duration: {
      value: { type: Number },
      unit: { type: String }
    },
    requirements: {
      type: [String]
    },
    includedItems: {
      type: [String]
    },
    excludedItems: {
      type: [String]
    },
    equipmentNeeded: {
      type: [String]
    },
    // Payment-related fields
    paymentUrl: {
      type: String
    },
    paymentAttempt: {
      type: Number,
      default: 0
    },
    paymentDetails: {
      type: Schema.Types.Mixed
    },
    paymentTransactionDetails: {
      type: Schema.Types.Mixed
    },
    phoneNumber: {
      type: String
    },
  },
  {
    timestamps: true,
  }
);

// Check if the model exists before creating it
const Booking = models.Booking || model<IBooking>('Booking', BookingSchema);

export default Booking; 