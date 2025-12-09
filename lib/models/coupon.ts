import mongoose, { Schema, model, models } from 'mongoose';

export interface ICoupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  description?: string;
  minPurchase?: number;
  maxUses?: number;
  usedCount: number;
  appliesTo: 'all' | 'specific';
  applicableAdventures?: string[]; // Array of adventure IDs
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: [true, 'Please provide a coupon code'],
      trim: true,
      uppercase: true,
      unique: true,
    },
    type: {
      type: String,
      required: [true, 'Please specify the coupon type'],
      enum: ['percentage', 'fixed'],
    },
    value: {
      type: Number,
      required: [true, 'Please provide the coupon value'],
      min: [0, 'Value cannot be negative'],
    },
    description: {
      type: String,
      trim: true,
    },
    minPurchase: {
      type: Number,
      min: [0, 'Minimum purchase cannot be negative'],
    },
    maxUses: {
      type: Number,
      min: [0, 'Maximum uses cannot be negative'],
    },
    usedCount: {
      type: Number,
      default: 0,
      min: [0, 'Used count cannot be negative'],
    },
    appliesTo: {
      type: String,
      enum: ['all', 'specific'],
      default: 'all',
    },
    applicableAdventures: {
      type: [String],
      default: [],
    },
    startDate: {
      type: Date,
      required: [true, 'Please provide a start date'],
    },
    endDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Validate that percentage discounts are between 0 and 100
CouponSchema.path('value').validate(function(value: number) {
  if (this.type === 'percentage' && (value < 0 || value > 100)) {
    return false;
  }
  return true;
}, 'Percentage discount must be between 0 and 100');

// Validate that if appliesTo is 'specific', then applicableAdventures should not be empty
CouponSchema.path('applicableAdventures').validate(function(value: string[]) {
  if (this.appliesTo === 'specific' && (!value || value.length === 0)) {
    return false;
  }
  return true;
}, 'Please specify applicable adventures when coupon applies to specific adventures');

export default models.Coupon || model<ICoupon>('Coupon', CouponSchema); 