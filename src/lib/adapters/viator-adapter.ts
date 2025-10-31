import { BaseAdapter } from './base-adapter';
import { TourAdapter, NormalizedTour, UnifiedQuery } from './types';

/**
 * Mock Viator API Adapter
 * This is a demonstration adapter showing how to integrate additional providers
 * Replace mock data with real Viator API calls when credentials are available
 */
export class ViatorAdapter extends BaseAdapter implements TourAdapter {
  name = 'viator';
  private apiKey: string | undefined;

  constructor() {
    super();
    // API key from environment (optional for mock)
    this.apiKey = process.env.VIATOR_API_KEY;
  }

  /**
   * Fetch tours from Viator API (MOCK IMPLEMENTATION)
   */
  async fetchTours(query: UnifiedQuery): Promise<NormalizedTour[]> {
    this.log('Fetching tours (mock data)...', 'info');

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate mock tours based on query
    const mockTours = this.generateMockTours(query);

    return mockTours;
  }

  /**
   * Fetch single tour details (MOCK IMPLEMENTATION)
   */
  async fetchTourDetails(id: string): Promise<NormalizedTour | null> {
    this.log(`Fetching tour details for ${id} (mock data)...`, 'info');

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Extract external ID
    const externalId = id.startsWith('viator-') ? id.replace('viator-', '') : id;

    // Return mock tour
    return {
      id: `viator-${externalId}`,
      externalId: externalId,
      source: 'viator',
      title: 'Barcelona Gaudi Architecture Tour',
      description: 'Explore the stunning works of Antoni Gaudi including Sagrada Familia, Park Güell, and Casa Batlló. This comprehensive tour covers the most iconic modernist buildings in Barcelona.',
      brief: 'Discover Gaudi\'s masterpieces in Barcelona',
      price: {
        amount: 45.00,
        currency: 'EUR',
        formatted: '€45.00',
      },
      duration: '3 hours',
      location: {
        countryCode: 'ES',
        countryName: 'Spain',
        cityName: 'Barcelona',
        meetingPoint: {
          address: 'Plaça de Catalunya, Barcelona',
          coordinates: {
            lat: 41.3851,
            lng: 2.1734,
          },
        },
      },
      provider: {
        name: 'Viator Premium Tours',
        rating: 4.8,
      },
      images: [
        {
          url: 'https://images.example.com/sagrada-familia.jpg',
          alt: 'Sagrada Familia',
          isThumbnail: true,
        },
        {
          url: 'https://images.example.com/park-guell.jpg',
          alt: 'Park Güell',
        },
      ],
      bookingUrl: `https://viator.com/tours/${externalId}`,
      category: {
        id: 'architecture',
        name: 'Architecture Tour',
      },
      reviews: {
        count: 1245,
        rating: 4.8,
      },
      includes: [
        'Professional guide',
        'Skip-the-line access to Sagrada Familia',
        'Small group (max 15 people)',
        'Headsets for clear audio',
      ],
      excludes: [
        'Hotel pickup',
        'Food and drinks',
        'Gratuities',
      ],
      highlights: [
        'Visit Sagrada Familia with skip-the-line access',
        'Explore Park Güell with a local expert',
        'See Casa Batlló exterior',
        'Learn about Gaudi\'s unique architectural style',
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };
  }

  /**
   * Generate mock tours based on query
   */
  private generateMockTours(query: UnifiedQuery): NormalizedTour[] {
    const mockData = [
      {
        id: 'VT-12345',
        title: 'Barcelona Gothic Quarter Walking Tour',
        city: 'Barcelona',
        country: 'ES',
        price: 25.00,
        duration: '2 hours',
        rating: 4.7,
        reviews: 856,
      },
      {
        id: 'VT-12346',
        title: 'Rome Colosseum and Ancient Rome Tour',
        city: 'Rome',
        country: 'IT',
        price: 55.00,
        duration: '3.5 hours',
        rating: 4.9,
        reviews: 2134,
      },
      {
        id: 'VT-12347',
        title: 'Paris Louvre Museum Guided Tour',
        city: 'Paris',
        country: 'FR',
        price: 48.00,
        duration: '3 hours',
        rating: 4.6,
        reviews: 1567,
      },
      {
        id: 'VT-12348',
        title: 'Madrid Tapas and Wine Tasting Tour',
        city: 'Madrid',
        country: 'ES',
        price: 68.00,
        duration: '4 hours',
        rating: 4.8,
        reviews: 743,
      },
      {
        id: 'VT-12349',
        title: 'Berlin Historical Walking Tour',
        city: 'Berlin',
        country: 'DE',
        price: 22.00,
        duration: '2.5 hours',
        rating: 4.5,
        reviews: 623,
      },
    ];

    // Filter by country if specified
    let filtered = mockData;
    if (query.countryCode) {
      filtered = filtered.filter(t => t.country === query.countryCode);
    }

    // Filter by price range
    if (query.priceRange) {
      if (query.priceRange.min !== undefined) {
        filtered = filtered.filter(t => t.price >= query.priceRange!.min);
      }
      if (query.priceRange.max !== undefined) {
        filtered = filtered.filter(t => t.price <= query.priceRange!.max);
      }
    }

    // Apply limit
    if (query.limit) {
      filtered = filtered.slice(0, query.limit);
    }

    // Transform to normalized format
    return filtered.map(tour => this.mockToNormalized(tour));
  }

  /**
   * Transform mock tour to normalized format
   */
  private mockToNormalized(mock: {
    id: string;
    title: string;
    city: string;
    country: string;
    price: number;
    duration: string;
    rating: number;
    reviews: number;
  }): NormalizedTour {
    return {
      id: `viator-${mock.id}`,
      externalId: mock.id,
      source: 'viator',
      title: mock.title,
      description: `Experience ${mock.city} with this amazing tour. ${mock.title} offers an unforgettable journey through the city's most iconic locations.`,
      brief: `Explore ${mock.city}'s highlights`,
      price: {
        amount: mock.price,
        currency: 'EUR',
        formatted: this.formatPrice(mock.price, 'EUR'),
      },
      duration: mock.duration,
      location: {
        countryCode: mock.country,
        countryName: this.getCountryName(mock.country),
        cityName: mock.city,
        meetingPoint: {
          address: `Central meeting point in ${mock.city}`,
          coordinates: this.getCityCoordinates(mock.city),
        },
      },
      provider: {
        name: 'Viator Partner Tours',
        rating: mock.rating,
      },
      images: [
        {
          url: `https://images.example.com/${mock.city.toLowerCase()}-1.jpg`,
          alt: mock.title,
          isThumbnail: true,
        },
      ],
      bookingUrl: `https://viator.com/tours/${mock.id}`,
      category: {
        id: 'general',
        name: 'City Tour',
      },
      reviews: {
        count: mock.reviews,
        rating: mock.rating,
      },
      includes: [
        'Professional guide',
        'Small group experience',
        'Local insights',
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };
  }

  /**
   * Get country name from ISO code
   */
  private getCountryName(isoCode: string): string {
    const countries: Record<string, string> = {
      ES: 'Spain',
      IT: 'Italy',
      FR: 'France',
      DE: 'Germany',
      PT: 'Portugal',
      UK: 'United Kingdom',
    };
    return countries[isoCode] || isoCode;
  }

  /**
   * Get city coordinates (mock)
   */
  private getCityCoordinates(city: string): { lat: number; lng: number } {
    const coordinates: Record<string, { lat: number; lng: number }> = {
      Barcelona: { lat: 41.3851, lng: 2.1734 },
      Madrid: { lat: 40.4168, lng: -3.7038 },
      Rome: { lat: 41.9028, lng: 12.4964 },
      Paris: { lat: 48.8566, lng: 2.3522 },
      Berlin: { lat: 52.5200, lng: 13.4050 },
    };
    return coordinates[city] || { lat: 0, lng: 0 };
  }

  /**
   * Handle authentication failure
   */
  protected async handleAuthFailure(): Promise<void> {
    // For API key auth, there's no re-authentication needed
    this.log('API key authentication does not require renewal', 'info');
  }

  /**
   * Check if adapter is available
   */
  async isAvailable(): Promise<boolean> {
    // Mock adapter is always available
    // In real implementation, check if API key is valid
    if (!this.apiKey) {
      this.log('No API key configured, using mock data', 'warn');
    }
    return true;
  }

  /**
   * Sync not supported for Viator (read-only API)
   */
  async syncToDatabase(): Promise<never> {
    throw new Error('Viator adapter does not support database sync (read-only API)');
  }
}

// Export singleton instance
export const viatorAdapter = new ViatorAdapter();

