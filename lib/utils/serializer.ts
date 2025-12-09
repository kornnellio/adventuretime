import mongoose from 'mongoose';

/**
 * Utility function to deeply serialize MongoDB documents and objects
 * to plain JavaScript objects suitable for passing to client components.
 * 
 * Handles:
 * - Converting ObjectIds to strings
 * - Converting Dates to ISO strings
 * - Recursively processes arrays and nested objects
 */
export const serializeData = (data: any): any => {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => serializeData(item));
  }
  
  if (data instanceof Date) {
    return data.toISOString();
  }
  
  if (data instanceof mongoose.Types.ObjectId) {
    return data.toString();
  }
  
  if (typeof data === 'object' && data !== null) {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = serializeData(value);
    }
    return result;
  }
  
  return data;
}; 