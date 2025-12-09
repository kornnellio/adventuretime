import mongoose, { Schema, model, models } from 'mongoose';

export interface IBlog {
  title: string;
  image: string; // Image URL for the blog header/thumbnail
  author: {
    id: string; // User ID
    name: string; // Author's name
  };
  content: string; // TinyMCE rich text content
  tags: string[]; // Array of tag strings
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title for the blog post'],
      trim: true,
    },
    image: {
      type: String,
      required: [true, 'Please provide an image for the blog post'],
    },
    author: {
      id: {
        type: String,
        required: [true, 'Author ID is required'],
      },
      name: {
        type: String,
        required: [true, 'Author name is required'],
      },
    },
    content: {
      type: String,
      required: [true, 'Please provide content for the blog post'],
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function(tags: string[]) {
          // Ensure unique tags
          const uniqueTags = new Set(tags);
          return uniqueTags.size === tags.length;
        },
        message: 'Tags must be unique'
      }
    },
  },
  {
    timestamps: true,
  }
);

export default models.Blog || model<IBlog>('Blog', BlogSchema); 