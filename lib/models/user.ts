import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IAddress {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

export interface IOrder {
  orderId: string;
  date: Date; // Legacy field for backward compatibility
  startDate?: Date; // New field for start date
  endDate?: Date; // New field for end date
  products: any[];
  total: number;
  advancePayment?: number;
  status: string;
  statusMessage?: string;
  // Coupon-related fields
  couponCode?: string;
  couponDiscount?: number;
  couponType?: 'percentage' | 'fixed';
  couponValue?: number;
  originalPrice?: number; // Store the price before discount
  // Additional basic fields directly on the order
  location?: string;
  meetingPoint?: string;
  difficulty?: string;
  remainingPayment?: number;
  advancePaymentPercentage?: number;
  adventureTitle?: string;
  phoneNumber?: string;
  comments?: string;
  // Payment-related fields
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
  details?: {
    location?: string;
    meetingPoint?: string;
    difficulty?: string;
    advancePaymentPercentage?: number;
    remainingPayment?: number;
    title?: string;
    requirements?: string[];
    includedItems?: string[];
    excludedItems?: string[];
    equipmentNeeded?: string[];
    duration?: {
      value: number;
      unit: string;
    };
    [key: string]: any;
  };
  kayakSelections: {
    caiacSingle: number;
    caiacDublu: number;
    placaSUP: number;
  };
}

export interface IUser extends Document {
  name: string;
  surname: string;
  username: string;
  email: string;
  password?: string;
  oauth_provider: string | null;
  address: IAddress[];
  phone?: string;
  sign_up_date: Date;
  orders: IOrder[];
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  comparePassword: (password: string) => Promise<boolean>;
}

const AddressSchema = new Schema<IAddress>({
  street: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String },
  zipCode: { type: String }
});

const OrderSchema = new Schema<IOrder>({
  orderId: { type: String, required: true },
  date: { type: Date, default: Date.now }, // Keep for backward compatibility
  startDate: { type: Date }, // New field
  endDate: { type: Date }, // New field
  products: [Schema.Types.Mixed],
  total: { type: Number, required: true },
  advancePayment: { type: Number },
  status: { type: String, default: 'awaiting confirmation' },
  statusMessage: { type: String },
  // Coupon-related fields
  couponCode: { type: String },
  couponDiscount: { type: Number, min: 0 },
  couponType: { type: String, enum: ['percentage', 'fixed'] },
  couponValue: { type: Number, min: 0 },
  originalPrice: { type: Number, min: 0 },
  // Replace quantity with kayak selections
  kayakSelections: {
    type: {
      caiacSingle: { type: Number, min: 0, default: 0 },
      caiacDublu: { type: Number, min: 0, default: 0 },
      placaSUP: { type: Number, min: 0, default: 0 }
    },
    _id: false,
    default: {
      caiacSingle: 0,
      caiacDublu: 0,
      placaSUP: 0
    }
  },
  // Additional basic fields directly on the order
  location: { type: String },
  meetingPoint: { type: String },
  difficulty: { type: String },
  remainingPayment: { type: Number },
  advancePaymentPercentage: { type: Number },
  adventureTitle: { type: String },
  phoneNumber: { type: String },
  comments: { type: String },
  // Payment-related fields
  paymentUrl: { type: String },
  paymentDetails: { type: Schema.Types.Mixed },
  paymentTransactionDetails: { type: Schema.Types.Mixed },
  // Add a nested details object to store all adventure-specific details
  details: {
    type: {
      location: { type: String },
      meetingPoint: { type: String },
      difficulty: { type: String },
      advancePaymentPercentage: { type: Number },
      remainingPayment: { type: Number },
      title: { type: String },
      requirements: { type: [String] },
      includedItems: { type: [String] },
      excludedItems: { type: [String] },
      equipmentNeeded: { type: [String] },
      duration: {
        value: { type: Number },
        unit: { type: String }
      },
      totalPrice: { type: Number },
      quantity: { type: Number }
    },
    _id: false, // Don't create an _id for this subdocument
    default: {}
  }
});

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  surname: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  oauth_provider: { type: String, default: null },
  address: { type: [AddressSchema], default: [] },
  phone: { type: String },
  sign_up_date: { type: Date, default: Date.now },
  orders: { type: [OrderSchema], default: [] },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  const user = this;
  
  // Only hash the password if it has been modified or is new
  if (!user.isModified('password') || !user.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

// Delete the model if it exists to prevent OverwriteModelError
// This is useful in development with hot reloading
const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User; 
