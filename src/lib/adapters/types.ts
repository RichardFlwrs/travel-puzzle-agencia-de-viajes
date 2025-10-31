/**
 * Unified query format used across all tour adapters
 * Uses ISO codes and standard identifiers instead of provider-specific IDs
 */
export interface UnifiedQuery {
  // Location filters (use ISO codes, not provider IDs)
  countryCode?: string;      // ISO 3166-1 alpha-2 (e.g., "ES", "IT", "FR")
  cityName?: string;          // Canonical city name (e.g., "Barcelona", "Rome")
  
  // Date filters
  dateRange?: {
    start: Date;
    end: Date;
  };
  
  // Price filters
  priceRange?: {
    min: number;
    max: number;
    currency?: string;        // ISO 4217 currency code (e.g., "EUR", "USD")
  };
  
  // Category/type filters
  category?: string;          // Standardized category name
  categoryId?: number;        // Optional numeric category ID
  
  // Search
  searchQuery?: string;       // Free text search
  
  // Pagination
  page?: number;
  limit?: number;
  
  // Sorting
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'popularity' | 'duration';
  
  // Language
  language?: string;          // ISO 639-1 language code (e.g., "en", "es")
}

/**
 * Normalized tour structure - common format across all providers
 * All adapters must transform their API responses to this format
 */
export interface NormalizedTour {
  // Identifiers
  id: string;                 // Prefixed with provider (e.g., "freetour-12345")
  externalId: string | number;// Original ID from provider
  source: string;             // Provider name (e.g., "freetour", "viator")
  
  // Basic info
  title: string;
  description: string;
  brief?: string;
  
  // Pricing
  price: {
    amount: number;
    currency: string;
    formatted: string;        // Human-readable (e.g., "€25.50")
    originalAmount?: number;  // If discounted
  };
  
  // Duration
  duration: string;           // Normalized format (e.g., "3 hours", "45 minutes")
  
  // Location (using standard codes)
  location: {
    countryCode: string;      // ISO code
    countryName: string;
    cityName: string;
    cityCode?: string;
    meetingPoint?: {
      address: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
    _providerData?: Record<string, unknown>;      // Internal provider-specific location data
  };
  
  // Provider info
  provider: {
    name: string;
    phone?: string;
    email?: string;
    website?: string;
    rating?: number;
  };
  
  // Media
  images: Array<{
    url: string;
    alt?: string;
    isThumbnail?: boolean;
  }>;
  videoUrl?: string;
  
  // Booking
  bookingUrl: string;
  availability?: {
    isAvailable: boolean;
    nextAvailableDate?: Date;
  };
  
  // Category
  category?: {
    id: string | number;
    name: string;
  };
  
  // Reviews
  reviews: {
    count: number;
    rating: number;
  };
  
  // Inclusions/Exclusions
  includes: string[];
  excludes?: string[];
  
  // Additional info
  highlights?: string[];
  requirements?: string[];
  cancellationPolicy?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

/**
 * Sync result returned after syncing tours to database
 */
export interface SyncResult {
  success: boolean;
  toursCount: number;
  countriesCount?: number;
  citiesCount?: number;
  duration: number;
  error?: string;
}

/**
 * Core adapter interface - all tour providers must implement this
 */
export interface TourAdapter {
  // Adapter identifier
  name: string;
  
  /**
   * Fetch tours from the provider based on unified query
   */
  fetchTours(query: UnifiedQuery): Promise<NormalizedTour[]>;
  
  /**
   * Fetch a single tour by ID
   */
  fetchTourDetails(id: string): Promise<NormalizedTour | null>;
  
  /**
   * Sync tours to database (for providers that support bulk sync)
   */
  syncToDatabase?(): Promise<SyncResult>;
  
  /**
   * Check if the adapter is available (auth successful, API reachable)
   */
  isAvailable(): Promise<boolean>;
}

/**
 * Result from aggregating multiple providers
 */
export interface AggregatedResult {
  tours: NormalizedTour[];
  pagination: {
    total: number;        // Total number of results across all providers
    page: number;         // Current page number
    limit: number;        // Results per page
    totalPages: number;   // Total number of pages
  };
  errors: Array<{         // Providers that failed
    provider: string;
    error: string;
  }>;
}

