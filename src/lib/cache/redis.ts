import { Redis } from '@upstash/redis';
import { createHash } from 'crypto';

// Initialize Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache TTL types
export type CacheTTLType = 'tours' | 'filters' | 'metadata';

/**
 * Get cache TTL from environment variables with fallback defaults
 */
export function getCacheTTL(type: CacheTTLType): number {
  const defaults: Record<CacheTTLType, number> = {
    tours: 300,      // 5 minutes
    filters: 1800,   // 30 minutes
    metadata: 60,    // 1 minute
  };

  const envKeys: Record<CacheTTLType, string> = {
    tours: 'CACHE_TTL_TOURS',
    filters: 'CACHE_TTL_FILTERS',
    metadata: 'CACHE_TTL_METADATA',
  };

  const envValue = process.env[envKeys[type]];
  return envValue ? parseInt(envValue, 10) : defaults[type];
}

/**
 * Generate a consistent cache key from a prefix and parameters
 * Uses MD5 hash to create short, consistent keys
 */
export function generateCacheKey(prefix: string, params: unknown): string {
  const paramsString = JSON.stringify(params, Object.keys(params as object).sort());
  const hash = createHash('md5').update(paramsString).digest('hex');
  return `${prefix}:${hash}`;
}

/**
 * Type-safe cache operations
 */
export const cache = {
  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get<T>(key);
      return value;
    } catch (error) {
      console.error(`[Redis] Error getting key ${key}:`, error);
      return null;
    }
  },

  /**
   * Set value in cache with TTL
   */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      await redis.set(key, value, { ex: ttlSeconds });
    } catch (error) {
      console.error(`[Redis] Error setting key ${key}:`, error);
    }
  },

  /**
   * Delete one or more keys from cache
   */
  async del(...keys: string[]): Promise<void> {
    try {
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error(`[Redis] Error deleting keys:`, error);
    }
  },

  /**
   * Delete all keys matching a pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      // Note: Upstash doesn't support SCAN, so this is a placeholder
      // In production, you might want to track cache keys or use Redis Cloud with SCAN support
      console.warn(`[Redis] Pattern deletion not fully supported: ${pattern}`);
      // For now, we'll just log the pattern
    } catch (error) {
      console.error(`[Redis] Error deleting pattern ${pattern}:`, error);
    }
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`[Redis] Error checking key ${key}:`, error);
      return false;
    }
  },
};

