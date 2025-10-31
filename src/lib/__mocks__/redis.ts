/**
 * Mock Redis client for testing
 */

const mockRedisData = new Map<string, { value: unknown; expiresAt?: number }>();

export const mockRedis = {
  get: jest.fn(async (key: string) => {
    const item = mockRedisData.get(key);
    if (!item) return null;
    
    if (item.expiresAt && Date.now() > item.expiresAt) {
      mockRedisData.delete(key);
      return null;
    }
    
    return item.value;
  }),
  
  set: jest.fn(async (key: string, value: unknown, options?: { ex?: number }) => {
    const expiresAt = options?.ex ? Date.now() + (options.ex * 1000) : undefined;
    mockRedisData.set(key, { value, expiresAt });
    return 'OK';
  }),
  
  del: jest.fn(async (key: string) => {
    const existed = mockRedisData.has(key);
    mockRedisData.delete(key);
    return existed ? 1 : 0;
  }),
  
  flushall: jest.fn(async () => {
    mockRedisData.clear();
    return 'OK';
  }),
  
  // Helper for tests
  _clear: () => {
    mockRedisData.clear();
  },
  
  _getData: () => mockRedisData,
};

export const redis = mockRedis;

// Mock the cache utilities
export const generateCacheKey = (prefix: string, params: unknown): string => {
  const crypto = require('crypto');
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify(params))
    .digest('hex');
  return `${prefix}:${hash}`;
};

export const getCacheTTL = (type: 'tours' | 'filters' | 'metadata' | 'auth'): number => {
  switch (type) {
    case 'tours':
      return 300;
    case 'filters':
      return 1800;
    case 'metadata':
      return 60;
    case 'auth':
      return 3600;
    default:
      return 300;
  }
};

