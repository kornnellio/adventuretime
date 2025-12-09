import mongoose from 'mongoose';
const { Schema, model, models } = mongoose;

export interface IAdventureCategory {
  title: string;
  description: string;
  image: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdventureCategorySchema = new Schema<IAdventureCategory>(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title for the adventure category'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description for the adventure category'],
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Please provide an image for the adventure category'],
    },
  },
  {
    timestamps: true,
  }
);

export default models.AdventureCategory || model<IAdventureCategory>('AdventureCategory', AdventureCategorySchema); 