import { cache, generateCacheKey, getCacheTTL } from '@/lib/cache/redis';
import {
  getToursWithFilters,
  getCountriesWithTourCount,
  getCitiesWithTourCount,
  getToursMetadata,
  getTourById,
  type TourFilters,
} from '@/lib/db/repositories/tour-repository';
import type { PaginationParams, PaginatedResponse } from '@/lib/db/pagination';
import type { TourWithRelations } from '@/lib/db/repositories/tour-repository';

/**
 * Cached Tour Service
 * Wraps database queries with Redis caching layer
 */
export class CachedTourService {
  /**
   * Get tours with filters (cached)
   */
  async getCachedTours(
    filters: TourFilters,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<TourWithRelations>> {
    const cacheKey = generateCacheKey('tours', { filters, pagination });
    const ttl = getCacheTTL('tours');

    // Try cache first
    const cached = await cache.get<PaginatedResponse<TourWithRelations>>(cacheKey);
    if (cached) {
      console.log(`[Cache] HIT: ${cacheKey}`);
      return cached;
    }

    console.log(`[Cache] MISS: ${cacheKey}`);

    // Query database
    const result = await getToursWithFilters(filters, pagination);

    // Cache the result
    await cache.set(cacheKey, result, ttl);

    return result;
  }

  /**
   * Get single tour by ID (cached)
   */
  async getCachedTourById(
    tourId: string,
    language: string = 'en'
  ): Promise<TourWithRelations | null> {
    const cacheKey = generateCacheKey('tour', { tourId, language });
    const ttl = getCacheTTL('tours');

    // Try cache first
    const cached = await cache.get<TourWithRelations>(cacheKey);
    if (cached) {
      console.log(`[Cache] HIT: ${cacheKey}`);
      return cached;
    }

    console.log(`[Cache] MISS: ${cacheKey}`);

    // Query database
    const result = await getTourById(tourId, language);

    // Cache the result
    if (result) {
      await cache.set(cacheKey, result, ttl);
    }

    return result;
  }

  /**
   * Get countries with tour count (cached)
   */
  async getCachedCountries(language: string = 'en'): Promise<unknown[]> {
    const cacheKey = generateCacheKey('countries', { language });
    const ttl = getCacheTTL('filters');

    // Try cache first
    const cached = await cache.get<unknown[]>(cacheKey);
    if (cached) {
      console.log(`[Cache] HIT: ${cacheKey}`);
      return cached;
    }

    console.log(`[Cache] MISS: ${cacheKey}`);

    // Query database
    const result = await getCountriesWithTourCount(language);

    // Cache the result
    await cache.set(cacheKey, result, ttl);

    return result;
  }

  /**
   * Get cities with tour count (cached)
   */
  async getCachedCities(
    countryId?: number,
    language: string = 'en'
  ): Promise<unknown[]> {
    const cacheKey = generateCacheKey('cities', { countryId, language });
    const ttl = getCacheTTL('filters');

    // Try cache first
    const cached = await cache.get<unknown[]>(cacheKey);
    if (cached) {
      console.log(`[Cache] HIT: ${cacheKey}`);
      return cached;
    }

    console.log(`[Cache] MISS: ${cacheKey}`);

    // Query database
    const result = await getCitiesWithTourCount(countryId, language);

    // Cache the result
    await cache.set(cacheKey, result, ttl);

    return result;
  }

  /**
   * Get tours metadata (cached)
   */
  async getCachedMetadata(): Promise<{
    lastUpdated: string | null;
    totalTours: number;
    syncStatus: string;
  }> {
    const cacheKey = 'tours:metadata';
    const ttl = getCacheTTL('metadata');

    // Try cache first
    const cached = await cache.get<{
      lastUpdated: string | null;
      totalTours: number;
      syncStatus: string;
    }>(cacheKey);
    if (cached) {
      console.log(`[Cache] HIT: ${cacheKey}`);
      return cached;
    }

    console.log(`[Cache] MISS: ${cacheKey}`);

    // Query database
    const result = await getToursMetadata();

    // Cache the result
    await cache.set(cacheKey, result, ttl);

    return result;
  }

  /**
   * Invalidate all tour-related caches
   * Call this after syncing tours from API
   */
  async invalidateTourCache(): Promise<void> {
    console.log('[Cache] Invalidating all tour caches...');

    // Note: Upstash doesn't support SCAN or wildcard deletion easily
    // In production, you might want to:
    // 1. Track cache keys in a Set
    // 2. Use a cache prefix version number
    // 3. Or accept that old cached data will expire naturally via TTL

    // For now, we'll invalidate specific known patterns
    const keysToInvalidate = [
      'tours:metadata',
      // Add more specific keys if needed
    ];

    await cache.del(...keysToInvalidate);
    
    console.log('[Cache] Tour cache invalidated');
  }

  /**
   * Invalidate specific tour cache
   */
  async invalidateTour(tourId: string): Promise<void> {
    // Invalidate all language versions of this tour
    const languages = ['en', 'es', 'pt', 'de', 'fr', 'it'];
    const keys = languages.map(lang => generateCacheKey('tour', { tourId, lang }));
    
    await cache.del(...keys);
    console.log(`[Cache] Invalidated tour: ${tourId}`);
  }

  /**
   * Invalidate country/city filter caches
   */
  async invalidateFilterCache(): Promise<void> {
    console.log('[Cache] Invalidating filter caches...');
    
    // This is a simplified approach
    // In production, track filter cache keys or use versioning
    const languages = ['en', 'es', 'pt', 'de', 'fr', 'it'];
    const keys = languages.map(lang => generateCacheKey('countries', { lang }));
    
    await cache.del(...keys);
    console.log('[Cache] Filter cache invalidated');
  }

  /**
   * Warm up cache by pre-loading common queries
   */
  async warmCache(): Promise<void> {
    console.log('[Cache] Warming up cache...');

    try {
      // Pre-load tours for each language
      const languages = ['en', 'es', 'pt', 'de', 'fr', 'it'];
      
      for (const language of languages) {
        // Load first page of tours
        await this.getCachedTours(
          { language },
          { page: 1, limit: 20 }
        );

        // Load countries
        await this.getCachedCountries(language);

        // Load metadata
        await this.getCachedMetadata();
      }

      console.log('[Cache] Cache warmed successfully');
    } catch (error) {
      console.error('[Cache] Error warming cache:', error);
    }
  }
}

// Export singleton instance
export const cachedTourService = new CachedTourService();

