'use server';

import dbConnect from '../db';
import Coupon, { ICoupon } from '../models/coupon';
import { revalidatePath } from 'next/cache';

export type CouponFormData = Omit<ICoupon, 'createdAt' | 'updatedAt' | 'usedCount'>;

export async function getCoupons() {
  await dbConnect();
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    
    // Fully serialize the data to remove any MongoDB/Mongoose methods
    const safeCoupons = JSON.parse(JSON.stringify(coupons));
    
    return { success: true, data: safeCoupons };
  } catch (error) {
    console.error('Error fetching coupons:', error);
    return { success: false, error: 'Failed to fetch coupons' };
  }
}

export async function getCouponById(id: string) {
  await dbConnect();
  try {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      return { success: false, error: 'Coupon not found' };
    }
    
    // Fully serialize the data to remove any MongoDB/Mongoose methods
    const safeCoupon = JSON.parse(JSON.stringify(coupon));
    
    return { success: true, data: safeCoupon };
  } catch (error) {
    console.error('Error fetching coupon:', error);
    return { success: false, error: 'Failed to fetch coupon' };
  }
}

export async function createCoupon(data: CouponFormData) {
  await dbConnect();
  try {
    // Initialize usedCount to 0
    const couponData = { ...data, usedCount: 0 };
    
    const coupon = await Coupon.create(couponData);
    // Serialize before returning
    const safeCoupon = JSON.parse(JSON.stringify(coupon));
    revalidatePath('/control-panel/coupons');
    return { success: true, data: safeCoupon };
  } catch (error: any) {
    console.error('Error creating coupon:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to create coupon' 
    };
  }
}

export async function updateCoupon(id: string, data: Partial<CouponFormData>) {
  await dbConnect();
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    
    if (!coupon) {
      return { success: false, error: 'Coupon not found' };
    }
    
    // Serialize before returning
    const safeCoupon = JSON.parse(JSON.stringify(coupon));
    
    revalidatePath('/control-panel/coupons');
    revalidatePath(`/control-panel/coupons/${id}`);
    
    return { success: true, data: safeCoupon };
  } catch (error: any) {
    console.error('Error updating coupon:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to update coupon' 
    };
  }
}

export async function deleteCoupon(id: string) {
  await dbConnect();
  try {
    const coupon = await Coupon.findByIdAndDelete(id);
    
    if (!coupon) {
      return { success: false, error: 'Coupon not found' };
    }
    
    // Serialize before returning
    const safeCoupon = JSON.parse(JSON.stringify(coupon));
    
    revalidatePath('/control-panel/coupons');
    
    return { success: true, data: safeCoupon };
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return { success: false, error: 'Failed to delete coupon' };
  }
}

export async function incrementCouponUsage(code: string) {
  await dbConnect();
  try {
    const coupon = await Coupon.findOneAndUpdate(
      { code: code.toUpperCase() },
      { $inc: { usedCount: 1 } },
      { new: true }
    );
    
    if (!coupon) {
      return { success: false, error: 'Coupon not found' };
    }
    
    // Check if coupon has reached max uses
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      await Coupon.findByIdAndUpdate(coupon._id, { isActive: false });
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error incrementing coupon usage:', error);
    return { success: false, error: 'Failed to update coupon usage' };
  }
}

export async function validateCoupon(code: string, adventureId?: string, amount?: number) {
  await dbConnect();
  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    
    if (!coupon) {
      return { 
        success: false, 
        valid: false, 
        error: 'Coupon not found' 
      };
    }
    
    // Check if coupon is active
    if (!coupon.isActive) {
      return { 
        success: true, 
        valid: false, 
        message: 'This coupon is no longer active' 
      };
    }
    
    // Check expiration date
    const now = new Date();
    if (coupon.startDate > now) {
      return { 
        success: true, 
        valid: false, 
        message: 'This coupon is not valid yet' 
      };
    }
    
    if (coupon.endDate && coupon.endDate < now) {
      return { 
        success: true, 
        valid: false, 
        message: 'This coupon has expired' 
      };
    }
    
    // Check if max uses has been reached
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return { 
        success: true, 
        valid: false, 
        message: 'This coupon has reached its maximum number of uses' 
      };
    }
    
    // Check if the coupon applies to the specified adventure
    if (coupon.appliesTo === 'specific' && adventureId) {
      if (!coupon.applicableAdventures?.includes(adventureId)) {
        return { 
          success: true, 
          valid: false, 
          message: 'This coupon is not applicable to this adventure' 
        };
      }
    }
    
    // Check minimum purchase amount
    if (coupon.minPurchase && amount && amount < coupon.minPurchase) {
      return { 
        success: true, 
        valid: false, 
        message: `This coupon requires a minimum purchase of $${coupon.minPurchase}` 
      };
    }
    
    // Coupon is valid
    const safeCoupon = JSON.parse(JSON.stringify(coupon));
    return { 
      success: true, 
      valid: true, 
      data: safeCoupon 
    };
  } catch (error) {
    console.error('Error validating coupon:', error);
    return { 
      success: false, 
      valid: false, 
      error: 'Failed to validate coupon' 
    };
  }
} 

export async function getCouponByCode(code: string) {
  await dbConnect();
  try {
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    
    if (!coupon) {
      return { success: false, error: 'Coupon not found' };
    }
    
    // Fully serialize the data to remove any MongoDB/Mongoose methods
    const safeCoupon = JSON.parse(JSON.stringify(coupon));
    
    return { success: true, data: safeCoupon };
  } catch (error) {
    console.error('Error fetching coupon by code:', error);
    return { success: false, error: 'Failed to fetch coupon' };
  }
} 