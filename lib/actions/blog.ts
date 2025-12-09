'use server';

import dbConnect from '../db';
import Blog, { IBlog } from '../models/blog';
import { revalidatePath } from 'next/cache';

export type BlogFormData = Omit<IBlog, 'createdAt' | 'updatedAt'>;

export async function getBlogs() {
  await dbConnect();
  try {
    const blogs = await Blog.find({}).sort({ createdAt: -1 });
    
    // Fully serialize the data to remove any MongoDB/Mongoose methods
    const safeBlogs = JSON.parse(JSON.stringify(blogs));
    
    return { success: true, data: safeBlogs };
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return { success: false, error: 'Failed to fetch blogs' };
  }
}

export async function getBlogById(id: string) {
  await dbConnect();
  try {
    const blog = await Blog.findById(id);
    if (!blog) {
      return { success: false, error: 'Blog not found' };
    }
    
    // Fully serialize the data to remove any MongoDB/Mongoose methods
    const safeBlog = JSON.parse(JSON.stringify(blog));
    
    return { success: true, data: safeBlog };
  } catch (error) {
    console.error('Error fetching blog:', error);
    return { success: false, error: 'Failed to fetch blog' };
  }
}

export async function createBlog(data: BlogFormData) {
  await dbConnect();
  try {
    const blog = await Blog.create(data);
    // Serialize before returning
    const safeBlog = JSON.parse(JSON.stringify(blog));
    revalidatePath('/control-panel/blogs');
    return { success: true, data: safeBlog };
  } catch (error: any) {
    console.error('Error creating blog:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to create blog' 
    };
  }
}

export async function updateBlog(id: string, data: Partial<BlogFormData>) {
  await dbConnect();
  try {
    const blog = await Blog.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    
    if (!blog) {
      return { success: false, error: 'Blog not found' };
    }
    
    // Serialize before returning
    const safeBlog = JSON.parse(JSON.stringify(blog));
    
    revalidatePath('/control-panel/blogs');
    revalidatePath(`/control-panel/blogs/${id}`);
    
    return { success: true, data: safeBlog };
  } catch (error: any) {
    console.error('Error updating blog:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to update blog' 
    };
  }
}

export async function deleteBlog(id: string) {
  await dbConnect();
  try {
    const blog = await Blog.findByIdAndDelete(id);
    
    if (!blog) {
      return { success: false, error: 'Blog not found' };
    }
    
    // Serialize before returning
    const safeBlog = JSON.parse(JSON.stringify(blog));
    
    revalidatePath('/control-panel/blogs');
    
    return { success: true, data: safeBlog };
  } catch (error) {
    console.error('Error deleting blog:', error);
    return { success: false, error: 'Failed to delete blog' };
  }
}

export async function getAllTags() {
  await dbConnect();
  try {
    // Get all unique tags from all blog posts
    const tags = await Blog.distinct('tags');
    return { success: true, data: tags };
  } catch (error) {
    console.error('Error fetching tags:', error);
    return { success: false, error: 'Failed to fetch tags' };
  }
} 