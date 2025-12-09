'use server';

import dbConnect from '../db';
import User, { IUser } from '../models/user';
import { revalidatePath } from 'next/cache';

export type UserFormData = Omit<IUser, 'comparePassword'>;

export async function getUsers() {
  await dbConnect();
  try {
    const users = await User.find({}).sort({ sign_up_date: -1 });
    
    // Fully serialize the data to remove any MongoDB/Mongoose methods
    const safeUsers = JSON.parse(JSON.stringify(users));
    
    return { success: true, data: safeUsers };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { success: false, error: 'Failed to fetch users' };
  }
}

export async function getUserById(id: string) {
  await dbConnect();
  try {
    const user = await User.findById(id);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    // Fully serialize the data to remove any MongoDB/Mongoose methods
    const safeUser = JSON.parse(JSON.stringify(user));
    
    return { success: true, data: safeUser };
  } catch (error) {
    console.error('Error fetching user:', error);
    return { success: false, error: 'Failed to fetch user' };
  }
}

export async function updateUser(id: string, data: Partial<UserFormData>) {
  await dbConnect();
  try {
    // Remove password from update data if it's empty
    if (data.password === '') {
      delete data.password;
    }
    
    const user = await User.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    // Serialize before returning
    const safeUser = JSON.parse(JSON.stringify(user));
    
    revalidatePath('/control-panel/users');
    revalidatePath(`/control-panel/users/${id}`);
    
    return { success: true, data: safeUser };
  } catch (error: any) {
    console.error('Error updating user:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to update user' 
    };
  }
}

export async function deleteUser(id: string) {
  await dbConnect();
  try {
    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    // Serialize before returning
    const safeUser = JSON.parse(JSON.stringify(user));
    
    revalidatePath('/control-panel/users');
    
    return { success: true, data: safeUser };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: 'Failed to delete user' };
  }
} 