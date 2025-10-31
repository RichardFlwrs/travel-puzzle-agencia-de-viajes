/**
 * Test utilities for adapter testing
 */

import { UnifiedQuery, NormalizedTour } from '../types';

/**
 * Sample unified query for testing
 */
export const createSampleQuery = (overrides?: Partial<UnifiedQuery>): UnifiedQuery => ({
  countryCode: 'ES',
  cityName: 'Barcelona',
  page: 1,
  limit: 10,
  language: 'en',
  ...overrides,
});

/**
 * Sample normalized tour for testing
 */
export const createSampleTour = (overrides?: Partial<NormalizedTour>): NormalizedTour => ({
  id: 'test-123',
  externalId: '123',
  source: 'test',
  title: 'Test Walking Tour',
  description: 'A test tour description',
  brief: 'Brief description',
  bookingUrl: 'https://example.com/book/123',
  isActive: true,
  price: {
    amount: 25.50,
    currency: 'EUR',
    formatted: '€25.50',
  },
  duration: '2 hours',
  location: {
    countryCode: 'ES',
    countryName: 'Spain',
    cityName: 'Barcelona',
    meetingPoint: {
      address: 'Plaza Catalunya',
      coordinates: {
        lat: 41.3851,
        lng: 2.1734,
      },
    },
  },
  provider: {
    name: 'Test Tours Inc',
    phone: '+34123456789',
    rating: 4.5,
  },
  images: [
    {
      url: 'https://example.com/image1.jpg',
      alt: 'Tour image 1',
      isThumbnail: true,
    },
  ],
  category: {
    id: 1,
    name: 'Cultural',
  },
  reviews: {
    count: 150,
    rating: 4.5,
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

/**
 * Mock FreeTour API response
 */
export const createMockFreeTourResponse = (tourCount: number = 1) => {
  const tours = Array.from({ length: tourCount }, (_, i) => ({
    id: i + 1,
    title: {
      en: `FreeTour ${i + 1}`,
      es: `FreeTour ${i + 1}`,
    },
    description: {
      en: `Description ${i + 1}`,
      es: `Descripción ${i + 1}`,
    },
    brief: {
      en: `Brief ${i + 1}`,
      es: `Breve ${i + 1}`,
    },
    URLs: {
      en: `https://freetour.com/tours/${i + 1}`,
      es: `https://freetour.com/es/tours/${i + 1}`,
    },
    priceValue: 0,
    priceCurrency: 'EUR',
    duration: '2:00',
    providerTitle: 'Test Provider',
    providerPhone: '+34123456789',
    cityId: 1,
    countryId: 1,
    categoryId: 1,
    rating: 4.5,
    reviewsNumber: 100,
    meetingPoint: {
      title: 'Meeting Point',
      address: 'Plaza Catalunya',
      coordinates: '41.3851,2.1734',
    },
    images: [
      {
        id: 1,
        URL: `https://freetour.com/image${i + 1}.jpg`,
        description: 'Tour image',
      },
    ],
    POIs: [],
    includes: ['Guide', 'Map'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }));

  return {
    data: {
      tours,
      pagination: {
        total: tourCount,
        page: 1,
        limit: 10,
      },
    },
  };
};

/**
 * Wait for promises to resolve
 */
export const waitForPromises = () => new Promise((resolve) => setImmediate(resolve));

/**
 * Mock fetch response
 */
export const createMockFetchResponse = (data: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data),
  headers: new Headers(),
});

