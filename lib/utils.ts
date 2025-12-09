import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isValid } from "date-fns"
import crypto from "crypto"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 

export function formatDate(date: Date | string | number | null | undefined): string {
  if (!date) return 'No date';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (!isValid(dateObj)) {
    console.error('Invalid date:', date);
    return 'Invalid date';
  }
  
  return format(dateObj, 'MMMM d, yyyy');
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'RON',
  }).format(price);
}

/**
 * Formats an image URL consistently across the application
 * @param url - The URL to format
 * @param fallbackSrc - Optional fallback image URL if the provided URL is empty or invalid
 * @returns The properly formatted image URL
 */
export function formatImageUrl(url: string, fallbackSrc: string = '/images/placeholder.jpg'): string {
  if (!url) return fallbackSrc;
  if (url.startsWith('http')) return url;
  if (url === '/placeholder-adventure.jpg' || url === 'placeholder-adventure.jpg') 
    return '/placeholder-adventure.jpg';
  if (url.startsWith('/uploads/')) return `https://adventure-time.ro${url}`;
  if (url.startsWith('/')) return url;
  return `/${url}`;
}

/**
 * Generates a secure random token for password resets or email verification
 * @param length The byte length of the token (will be encoded to hex string, so final string will be 2x this length)
 * @returns A random string token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// Utility to check development mode that works in both server and client components
export const isDevelopmentMode = (): boolean => {
  // For client-side
  if (typeof window !== 'undefined') {
    // Next.js injects this in client-side code
    // @ts-ignore
    return process.env.NODE_ENV === 'development';
  }
  
  // For server-side
  return process.env.NODE_ENV === 'development';
} 

/**
 * Normalizes a booking status string to handle inconsistencies
 */
export function normalizeStatus(status: string): string {
  if (!status) return status;
  
  // Trim whitespace
  const trimmedStatus = status.trim();
  
  // Common status normalization
  if (trimmedStatus.includes('awaiting') || trimmedStatus.includes('wait')) {
    return 'awaiting confirmation';
  }
  
  return trimmedStatus;
} 