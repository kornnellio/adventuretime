import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface IPaymentIntent extends Document {
  intentId: string;
  userId: string;
  adventureId: string;
  adventureTitle: string;
  startDate: Date;
  endDate: Date;
  price: number; // Base price per person
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
  paymentStatus: 'pending' | 'confirmed' | 'cancelled' | 'declined' | 'expired' | 'error' | 'processing' | 'awaiting confirmation';
  paymentUrl?: string;
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
  phoneNumber?: string;
  createdAt: Date;
  expiresAt: Date;
  /** Booking ID once converted to avoid duplicate conversion */
  convertedToBookingId?: string;
}

const PaymentIntentSchema = new Schema<IPaymentIntent>(
  {
    intentId: {
      type: String,
      required: [true, 'Intent ID is required'],
      unique: true,
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
    },
    adventureId: {
      type: String,
      required: [true, 'Adventure ID is required'],
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
      _id: false,
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
    paymentStatus: {
      type: String,
      enum: {
        values: [
          'pending', 
          'confirmed', 
          'cancelled', 
          'declined',
          'expired',
          'error',
          'processing',
          'awaiting confirmation'
        ],
        message: '{VALUE} is not a valid status'
      },
      default: 'pending',
    },
    paymentUrl: {
      type: String
    },
    paymentDetails: {
      type: Schema.Types.Mixed
    },
    paymentTransactionDetails: {
      type: Schema.Types.Mixed
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
    phoneNumber: {
      type: String
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
      default: function() {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 30); // Default to 30 minutes from now
        return now;
      }
    },
    convertedToBookingId: {
      type: String,
      required: false
    }
  }
);

// Create the model if it doesn't exist
const PaymentIntent = models.PaymentIntent || model<IPaymentIntent>('PaymentIntent', PaymentIntentSchema);

export default PaymentIntent; 