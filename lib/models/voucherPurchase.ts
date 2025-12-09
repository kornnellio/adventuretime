import mongoose, { Schema, model, models, Document } from 'mongoose';

export interface IVoucherPurchase extends Document {
  orderId: string;
  userId: string;
  username: string;
  email: string;
  voucherAmount: number; // The actual voucher value (100, 200, 300, etc.)
  totalAmount: number; // The amount paid (voucherAmount + 20 processing fee)
  processingFee: number; // Always 20 lei
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'awaiting confirmation' | 'pending_payment' | 'payment_confirmed' | 'declined' | 'expired' | 'error' | 'processing';
  statusMessage?: string;
  generatedCouponCode?: string; // The coupon code generated after successful payment
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

const VoucherPurchaseSchema = new Schema<IVoucherPurchase>(
  {
    orderId: {
      type: String,
      required: [true, 'Order ID is required'],
      unique: true,
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
    },
    voucherAmount: {
      type: Number,
      required: [true, 'Voucher amount is required'],
      enum: [100, 200, 300, 400, 500], // Only allow these amounts
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: 0,
    },
    processingFee: {
      type: Number,
      required: [true, 'Processing fee is required'],
      default: 20,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['pending', 'confirmed', 'cancelled', 'completed', 'awaiting confirmation', 'pending_payment', 'payment_confirmed', 'declined', 'expired', 'error', 'processing'],
      default: 'pending',
    },
    statusMessage: {
      type: String,
    },
    generatedCouponCode: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
    },
    paymentUrl: {
      type: String,
    },
    paymentAttempt: {
      type: Number,
      default: 0,
    },
    paymentDetails: {
      type: Schema.Types.Mixed,
    },
    paymentTransactionDetails: {
      type: Schema.Types.Mixed,
    },
    phoneNumber: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
VoucherPurchaseSchema.index({ userId: 1 });
VoucherPurchaseSchema.index({ status: 1 });
// Note: orderId and generatedCouponCode already have indexes via unique: true

export default models.VoucherPurchase || model<IVoucherPurchase>('VoucherPurchase', VoucherPurchaseSchema); 