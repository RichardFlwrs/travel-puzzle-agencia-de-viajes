import { BaseAdapter } from './base-adapter';
import { TourAdapter, NormalizedTour, UnifiedQuery, SyncResult } from './types';
import { freeTourClient } from '@/lib/api/freetour-client';
import { syncToursFromAPI } from '@/lib/db/sync/tour-sync';
import { locationMapper } from '@/lib/services/location-mapper';
import type { TourAPI } from '@/types';

/**
 * FreeTour API Adapter
 * Transforms FreeTour API responses to normalized tour format
 */
export class FreeTourAdapter extends BaseAdapter implements TourAdapter {
  name = 'freetour';
  private currentLanguage = 'en';

  /**
   * Fetch tours from FreeTour API
   */
  async fetchTours(query: UnifiedQuery): Promise<NormalizedTour[]> {
    try {
      this.currentLanguage = query.language || 'en';
      
      // Authenticate before fetching
      await freeTourClient.authenticate();

      // Translate unified query to FreeTour parameters
      const page = query.page || 1;
      
      // Fetch tours from FreeTour API
      const response = await freeTourClient.fetchTours(page);
      let tours = response.data.tours;

      // Apply filters (FreeTour API doesn't support all filters directly)
      tours = await this.applyFilters(tours, query);

      // Transform to normalized format
      const normalizedTours = await Promise.all(
        tours.map(tour => this.normalizeFreeTour(tour))
      );

      return normalizedTours;
    } catch (error) {
      this.log(`Error fetching tours: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Fetch single tour details
   */
  async fetchTourDetails(id: string): Promise<NormalizedTour | null> {
    try {
      // Extract external ID from prefixed ID (e.g., "freetour-12345" -> "12345")
      const externalId = id.startsWith('freetour-') 
        ? parseInt(id.replace('freetour-', ''), 10)
        : parseInt(id, 10);

      // Fetch all tours and find the specific one
      // Note: FreeTour API doesn't have a single tour endpoint in current client
      const response = await freeTourClient.fetchTours(1);
      const tour = response.data.tours.find(t => t.id === externalId);

      if (!tour) {
        return null;
      }

      return await this.normalizeFreeTour(tour);
    } catch (error) {
      this.log(`Error fetching tour details: ${error}`, 'error');
      return null;
    }
  }

  /**
   * Sync tours to database
   */
  async syncToDatabase(): Promise<SyncResult> {
    try {
      this.log('Starting database sync...', 'info');
      const result = await syncToursFromAPI();
      return result;
    } catch (error) {
      this.log(`Sync failed: ${error}`, 'error');
      throw error;
    }
  }

  /**
   * Apply filters to tours (client-side filtering)
   */
  private async applyFilters(tours: TourAPI[], query: UnifiedQuery): Promise<TourAPI[]> {
    let filtered = tours;

    // Filter by country
    if (query.countryCode) {
      const freeTourCountryId = await locationMapper.getProviderCountryId(
        query.countryCode,
        'freetour'
      );
      
      if (freeTourCountryId) {
        filtered = filtered.filter(t => t.countryId === Number(freeTourCountryId));
      }
    }

    // Filter by city
    if (query.cityName && query.countryCode) {
      const freeTourCityId = await locationMapper.getProviderCityId(
        query.cityName,
        'freetour',
        query.countryCode
      );
      
      if (freeTourCityId) {
        filtered = filtered.filter(t => t.cityId === Number(freeTourCityId));
      }
    }

    // Filter by price range
    if (query.priceRange) {
      if (query.priceRange.min !== undefined) {
        filtered = filtered.filter(t => Number(t.price.value) >= query.priceRange!.min);
      }
      if (query.priceRange.max !== undefined) {
        filtered = filtered.filter(t => Number(t.price.value) <= query.priceRange!.max);
      }
    }

    // Filter by category
    if (query.categoryId) {
      filtered = filtered.filter(t => t.categoryId === query.categoryId);
    }

    // Filter by search query
    if (query.searchQuery) {
      const searchLower = query.searchQuery.toLowerCase();
      filtered = filtered.filter(t => {
        const title = (t.title[this.currentLanguage as keyof typeof t.title] || '').toLowerCase();
        const description = (t.description[this.currentLanguage as keyof typeof t.description] || '').toLowerCase();
        return title.includes(searchLower) || description.includes(searchLower);
      });
    }

    // Apply limit
    if (query.limit) {
      filtered = filtered.slice(0, query.limit);
    }

    return filtered;
  }

  /**
   * Transform FreeTour tour to normalized format
   */
  private async normalizeFreeTour(apiTour: TourAPI): Promise<NormalizedTour> {
    // Get ISO code from FreeTour country ID
    const countryCode = await locationMapper.getIsoCodeFromProviderId(
      apiTour.countryId,
      'freetour'
    ) || 'XX';

    // Get canonical city name
    const cityName = await locationMapper.getCityNameFromProviderId(
      apiTour.cityId,
      'freetour'
    ) || `City ${apiTour.cityId}`;

    const lang = this.currentLanguage as keyof typeof apiTour.title;

    return {
      id: `freetour-${apiTour.id}`,
      externalId: apiTour.id,
      source: 'freetour',

      // Basic info
      title: apiTour.title[lang] || apiTour.title.en || 'Untitled Tour',
      description: apiTour.description[lang] || apiTour.description.en || '',
      brief: apiTour.brief[lang] || apiTour.brief.en,

      // Price
      price: {
        amount: Number(apiTour.price.value),
        currency: apiTour.price.currency,
        formatted: this.formatPrice(Number(apiTour.price.value), apiTour.price.currency),
      },

      // Duration
      duration: this.normalizeDuration(apiTour.length),

      // Location
      location: {
        countryCode,
        countryName: countryCode, // Will be filled from database if needed
        cityName,
        meetingPoint: apiTour.meetingPoint ? {
          address: (apiTour.meetingPoint as unknown as Record<string, unknown>)?.address as string || '',
          coordinates: (apiTour.meetingPoint as unknown as Record<string, unknown>)?.coordinates ? {
            lat: Number(String((apiTour.meetingPoint as unknown as Record<string, unknown>).coordinates).split(',')[0]),
            lng: Number(String((apiTour.meetingPoint as unknown as Record<string, unknown>).coordinates).split(',')[1]),
          } : undefined,
        } : undefined,
        _providerData: {
          countryId: apiTour.countryId,
          cityId: apiTour.cityId,
        },
      },

      // Provider
      provider: {
        name: apiTour.providerTitle,
        phone: apiTour.providerPhone || undefined,
        rating: Number(apiTour.rating || 0),
      },

      // Media
      images: (apiTour.images || []).map((img) => {
        const imgData = img as string | { url?: string; description?: string };
        return {
          url: typeof imgData === 'string' ? imgData : (imgData.url || ''),
          alt: typeof imgData === 'object' && imgData.description ? imgData.description : apiTour.title.en,
          isThumbnail: false,
        };
      }),
      videoUrl: apiTour.videoURL || undefined,

      // Booking
      bookingUrl: apiTour.URLs[lang] || apiTour.URLs.en || '',

      // Category
      category: {
        id: apiTour.categoryId,
        name: this.getCategoryName(apiTour.categoryId),
      },

      // Reviews
      reviews: {
        count: apiTour.reviewsNumber || 0,
        rating: Number(apiTour.rating || 0),
      },

      // Inclusions
      includes: Array.isArray(apiTour.includes) 
        ? apiTour.includes 
        : typeof apiTour.includes === 'string' 
          ? [apiTour.includes] 
          : [],

      // Metadata
      createdAt: new Date(),
      updatedAt: apiTour.updatedAt ? new Date(apiTour.updatedAt) : new Date(),
      isActive: true,
    };
  }

  /**
   * Get category name from ID
   */
  private getCategoryName(categoryId: number): string {
    const categories: Record<number, string> = {
      1: 'Walking Tour',
      2: 'Food Tour',
      3: 'Museum Tour',
      4: 'Historical Tour',
      5: 'Adventure Tour',
      6: 'Cultural Tour',
    };
    return categories[categoryId] || 'General Tour';
  }

  /**
   * Handle authentication failure
   */
  protected async handleAuthFailure(): Promise<void> {
    this.log('Re-authenticating...', 'warn');
    await freeTourClient.authenticate();
  }

  /**
   * Check if adapter is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await freeTourClient.authenticate();
      return true;
    } catch (error) {
      this.log(`Not available: ${error}`, 'error');
      return false;
    }
  }
}

// Export singleton instance
export const freeTourAdapter = new FreeTourAdapter();

