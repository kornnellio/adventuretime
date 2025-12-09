'use server';

import dbConnect from '../db';
import User from '../models/user';
import Adventure from '../models/adventure';
import Blog from '../models/blog';
import Coupon from '../models/coupon';
import { IOrder } from '../models/user';

export interface DashboardStats {
  adventures: {
    total: number;
    active: number;
  };
  users: {
    total: number;
    recentlyJoined: number; // Users joined in the last 30 days
  };
  orders: {
    total: number;
    pending: number;
    revenue: number; // Total revenue from all orders
    recentRevenue: number; // Revenue in the last 30 days
  };
  coupons: {
    active: number;
    usageCount: number;
  };
  blogs: {
    total: number;
  };
}

export async function getDashboardStats(): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
  await dbConnect();
  
  try {
    // Calculate date 30 days ago for filtering
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get adventure stats
    const adventures = await Adventure.find({});
    const activeAdventures = await Adventure.find({ 
      date: { $gte: new Date() } 
    });
    
    // Get user stats
    const users = await User.find({});
    const recentUsers = await User.find({
      sign_up_date: { $gte: thirtyDaysAgo }
    });
    
    // Get blog stats
    const blogs = await Blog.find({});
    
    // Get coupon stats
    const activeCoupons = await Coupon.find({
      $or: [
        { expirationDate: { $gte: new Date() } },
        { expirationDate: { $exists: false } }
      ]
    });
    
    // Calculate order stats
    let totalOrders = 0;
    let pendingOrders = 0;
    let totalRevenue = 0;
    let recentRevenue = 0;
    
    // Find users with orders and process them
    const usersWithOrders = await User.find({ 'orders.0': { $exists: true } });
    
    usersWithOrders.forEach(user => {
      user.orders.forEach((order: IOrder) => {
        // Count total orders
        totalOrders++;
        
        // Count pending orders
        if (order.status.toLowerCase() === 'pending') {
          pendingOrders++;
        }
        
        // Calculate total revenue
        totalRevenue += order.total;
        
        // Calculate recent revenue
        const orderDate = new Date(order.date);
        if (orderDate >= thirtyDaysAgo) {
          recentRevenue += order.total;
        }
      });
    });
    
    // Calculate coupon usage
    let couponUsageCount = 0;
    const couponsWithUsageCount = await Coupon.find({}).select('usageCount');
    couponsWithUsageCount.forEach(coupon => {
      couponUsageCount += coupon.usageCount || 0;
    });
    
    // Compile all stats
    const stats: DashboardStats = {
      adventures: {
        total: adventures.length,
        active: activeAdventures.length
      },
      users: {
        total: users.length,
        recentlyJoined: recentUsers.length
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        revenue: totalRevenue,
        recentRevenue: recentRevenue
      },
      coupons: {
        active: activeCoupons.length,
        usageCount: couponUsageCount
      },
      blogs: {
        total: blogs.length
      }
    };
    
    return { success: true, data: stats };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return { success: false, error: 'Failed to fetch dashboard statistics' };
  }
} 