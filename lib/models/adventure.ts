import mongoose from 'mongoose';
const { Schema, model, models } = mongoose;

export interface IAdventure {
  title: string;
  images: string[]; // Array of image URLs for the carousel
  dates: {
    startDate: Date;
    endDate: Date;
  }[]; // Array of date ranges for the adventure
  price: number;
  includedItems: string[]; // What's included bullet points
  additionalInfo: string[]; // Additional information bullet points
  location: string;
  meetingPoint?: string; // Meeting point for the adventure (optional)
  difficulty: 'easy' | 'moderate' | 'hard' | 'extreme';
  duration: {
    value: number;
    unit: 'hours' | 'days';
  };
  shortDescription: string; // Short TinyMCE content for overview
  longDescription: string; // Long TinyMCE content for detailed information
  advancePaymentPercentage: number; // Percentage of advance payment required
  createdAt: Date;
  updatedAt: Date;
  
  // Legacy fields for backward compatibility (optional)
  date?: Date;
  endDate?: Date;

  // New field for same-day booking cutoff hour
  bookingCutoffHour?: number;

  // New field for slug
  slug?: string; // Made slug optional

  // New fields for kayak type availability
  availableKayakTypes?: {
    caiacSingle: boolean;
    caiacDublu: boolean;
    placaSUP: boolean;
  };

  // New field for category reference
  category?: mongoose.Types.ObjectId | string;

  // New fields for recurring activities
  isRecurring?: boolean;
  recurringPattern?: {
    daysOfWeek: number[]; // Array of numbers 0-6 (Sunday=0, Monday=1, etc.)
    year: number; // Which year to generate recurring dates for
    startTime?: string; // Optional start time in HH:MM format
    endTime?: string; // Optional end time in HH:MM format
  };
}

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

const AdventureSchema = new Schema<IAdventure>(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title for the adventure'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple documents without the slug field
      // Add required: true if all adventures MUST eventually have a slug
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'AdventureCategory',
      required: false, // Making it optional for backward compatibility
    },
    images: {
      type: [String],
      required: isDevelopment ? false : [true, 'Please provide at least one image for the adventure'],
      validate: {
        validator: function(images: string[]) {
          // Skip validation in development mode
          if (isDevelopment) return true;
          return images.length > 0;
        },
        message: 'At least one image is required'
      },
      default: () => isDevelopment ? ['/placeholder-adventure.jpg'] : [],
    },
    dates: {
      type: [{
        startDate: {
          type: Date,
          required: [true, 'Please provide a start date']
        },
        endDate: {
          type: Date, 
          required: [true, 'Please provide an end date']
        }
      }],
      validate: {
        validator: function(dates: any[]) {
          return dates.length > 0;
        },
        message: 'At least one date range is required'
      },
      default: []
    },
    date: {
      type: Date,
      required: false,
    },
    endDate: {
      type: Date,
      required: false,
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price for the adventure'],
      min: 0,
    },
    includedItems: {
      type: [String],
      default: [],
    },
    additionalInfo: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      required: [true, 'Please provide a location for the adventure'],
      trim: true,
    },
    meetingPoint: {
      type: String,
      required: false,
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'moderate', 'hard', 'extreme'],
      required: [true, 'Please provide a difficulty level for the adventure'],
    },
    duration: {
      value: {
        type: Number,
        required: [true, 'Please provide a duration value'],
        min: 1,
      },
      unit: {
        type: String,
        enum: ['hours', 'days'],
        required: [true, 'Please specify if the duration is in hours or days'],
      },
    },
    shortDescription: {
      type: String,
      required: [true, 'Please provide a short description for the adventure'],
    },
    longDescription: {
      type: String,
      required: [true, 'Please provide a detailed description for the adventure'],
    },
    advancePaymentPercentage: {
      type: Number,
      required: [true, 'Please provide the advance payment percentage'],
      min: 0,
      max: 100,
      default: 30,
    },
    bookingCutoffHour: {
      type: Number,
      required: false,
      min: 0,
      max: 23,
      default: null
    },
    availableKayakTypes: {
      type: {
        caiacSingle: {
          type: Boolean,
          default: true,
        },
        caiacDublu: {
          type: Boolean,
          default: false,
        },
        placaSUP: {
          type: Boolean,
          default: false,
        }
      },
      _id: false, // Don't create an _id for this subdocument
      default: {
        caiacSingle: true,
        caiacDublu: false,
        placaSUP: false
      }
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      type: {
        daysOfWeek: {
          type: [Number],
          validate: {
            validator: function(days: number[]) {
              return days.every(day => day >= 0 && day <= 6);
            },
            message: 'Days of week must be between 0 (Sunday) and 6 (Saturday)'
          }
        },
        year: {
          type: Number,
          min: new Date().getFullYear(),
          max: new Date().getFullYear() + 10,
        },
        startTime: {
          type: String,
          validate: {
            validator: function(time: string) {
              if (!time) return true; // Optional field
              return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
            },
            message: 'Start time must be in HH:MM format'
          }
        },
        endTime: {
          type: String,
          validate: {
            validator: function(time: string) {
              if (!time) return true; // Optional field
              return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
            },
            message: 'End time must be in HH:MM format'
          }
        }
      },
      _id: false,
      required: false,
    }
  },
  {
    timestamps: true,
  }
);

export default models.Adventure || model<IAdventure>('Adventure', AdventureSchema); 