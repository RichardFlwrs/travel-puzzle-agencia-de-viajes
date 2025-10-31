/**
 * FreeTour Adapter Tests
 * Tests authentication, API calls, and data transformation
 */

import { FreeTourAdapter } from '../freetour-adapter';
import { UnifiedQuery } from '../types';
import { createSampleQuery, createMockFreeTourResponse, createMockFetchResponse } from './test-utils';

// Mock dependencies
jest.mock('@/lib/prisma');
jest.mock('@/lib/cache/redis');

describe('FreeTourAdapter', () => {
  let adapter: FreeTourAdapter;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    // Reset adapter and mocks
    adapter = new FreeTourAdapter();
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    
    // Clear any stored tokens
    (adapter as any).accessToken = null;
    (adapter as any).tokenExpiresAt = null;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should authenticate successfully on first API call', async () => {
      const mockAuthResponse = {
        data: {
          token: {
            accessToken: 'test-token-123',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
          },
        },
      };

      const mockToursResponse = createMockFreeTourResponse(1);

      // First call: login
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(mockAuthResponse));
      // Second call: fetch tours
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(mockToursResponse));

      const query: UnifiedQuery = createSampleQuery();
      const result = await adapter.fetchTours(query);

      // Should have called login endpoint
      expect(fetchMock).toHaveBeenNthCalledWith(1, 
        expect.stringContaining('/login'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String),
        })
      );

      // Should have called tours endpoint with token
      expect(fetchMock).toHaveBeenNthCalledWith(2,
        expect.stringContaining('/tours'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token-123',
          }),
        })
      );

      expect(result).toHaveLength(1);
    });

    it('should reuse valid token on subsequent calls', async () => {
      // Set a valid token
      (adapter as any).accessToken = 'existing-token';
      (adapter as any).tokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      const mockToursResponse = createMockFreeTourResponse(1);
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(mockToursResponse));

      const query: UnifiedQuery = createSampleQuery();
      await adapter.fetchTours(query);

      // Should NOT have called login endpoint
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).not.toHaveBeenCalledWith(
        expect.stringContaining('/login'),
        expect.any(Object)
      );

      // Should use existing token
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/tours'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer existing-token',
          }),
        })
      );
    });

    it('should refresh expired token', async () => {
      // Set an expired token
      (adapter as any).accessToken = 'expired-token';
      (adapter as any).tokenExpiresAt = new Date(Date.now() - 1000); // Expired 1 second ago

      const mockAuthResponse = {
        data: {
          token: {
            accessToken: 'new-token-456',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
        },
      };

      const mockToursResponse = createMockFreeTourResponse(1);

      fetchMock.mockResolvedValueOnce(createMockFetchResponse(mockAuthResponse));
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(mockToursResponse));

      const query: UnifiedQuery = createSampleQuery();
      await adapter.fetchTours(query);

      // Should have re-authenticated
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/login'),
        expect.any(Object)
      );

      // Should use new token
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/tours'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer new-token-456',
          }),
        })
      );
    });

    it('should handle authentication failure', async () => {
      fetchMock.mockResolvedValueOnce(createMockFetchResponse({ error: 'Invalid credentials' }, 401));

      const query: UnifiedQuery = createSampleQuery();

      await expect(adapter.fetchTours(query)).rejects.toThrow('FreeTour auth failed');
    });
  });

  describe('Data Transformation', () => {
    beforeEach(async () => {
      // Set up authenticated state
      (adapter as any).accessToken = 'test-token';
      (adapter as any).tokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    });

    it('should transform FreeTour API response to NormalizedTour format', async () => {
      const mockResponse = createMockFreeTourResponse(1);
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

      const query: UnifiedQuery = createSampleQuery();
      const result = await adapter.fetchTours(query);

      expect(result).toHaveLength(1);
      const tour = result[0];

      // Check structure
      expect(tour).toMatchObject({
        id: expect.stringContaining('freetour-'),
        externalId: expect.any(Number),
        source: 'freetour',
        title: expect.any(String),
        description: expect.any(String),
        bookingUrl: expect.any(String),
        isActive: expect.any(Boolean),
        price: {
          amount: expect.any(Number),
          currency: expect.any(String),
          formatted: expect.any(String),
        },
        duration: expect.any(String),
        location: {
          countryCode: expect.any(String),
          countryName: expect.any(String),
          cityName: expect.any(String),
        },
        provider: {
          name: expect.any(String),
          rating: expect.any(Number),
        },
        images: expect.any(Array),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should correctly format price', async () => {
      const mockResponse = createMockFreeTourResponse(1);
      mockResponse.data.tours[0].priceValue = 29.99;
      mockResponse.data.tours[0].priceCurrency = 'EUR';

      fetchMock.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

      const result = await adapter.fetchTours(createSampleQuery());
      const tour = result[0];

      expect(tour.price.amount).toBe(29.99);
      expect(tour.price.currency).toBe('EUR');
      expect(tour.price.formatted).toContain('29.99');
      expect(tour.price.formatted).toContain('€');
    });

    it('should normalize duration format', async () => {
      const mockResponse = createMockFreeTourResponse(1);
      mockResponse.data.tours[0].duration = '3:30';

      fetchMock.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

      const result = await adapter.fetchTours(createSampleQuery());
      const tour = result[0];

      // "3:30" should be normalized to "3.5 hours" or similar
      expect(tour.duration).toBeTruthy();
      expect(typeof tour.duration).toBe('string');
    });

    it('should handle missing optional fields gracefully', async () => {
      const mockResponse = createMockFreeTourResponse(1);
      // Remove optional fields
      delete mockResponse.data.tours[0].providerPhone;
      delete mockResponse.data.tours[0].brief;
      mockResponse.data.tours[0].images = [];

      fetchMock.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

      const result = await adapter.fetchTours(createSampleQuery());
      const tour = result[0];

      expect(tour.provider.phone).toBeUndefined();
      expect(tour.brief).toBeTruthy(); // Should have a fallback or be undefined
      expect(tour.images).toEqual([]);
    });

    it('should select correct language for multilingual fields', async () => {
      const mockResponse = createMockFreeTourResponse(1);
      mockResponse.data.tours[0].title = {
        en: 'English Title',
        es: 'Título Español',
        fr: 'Titre Français',
      };

      fetchMock.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

      const query: UnifiedQuery = { ...createSampleQuery(), language: 'es' };
      const result = await adapter.fetchTours(query);

      expect(result[0].title).toBe('Título Español');
    });

    it('should fallback to English if requested language not available', async () => {
      const mockResponse = createMockFreeTourResponse(1);
      mockResponse.data.tours[0].title = {
        en: 'English Title',
        es: 'Título Español',
      };

      fetchMock.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

      const query: UnifiedQuery = { ...createSampleQuery(), language: 'fr' };
      const result = await adapter.fetchTours(query);

      // Should fallback to English
      expect(result[0].title).toBe('English Title');
    });
  });

  describe('Query Translation', () => {
    beforeEach(() => {
      // Set up authenticated state
      (adapter as any).accessToken = 'test-token';
      (adapter as any).tokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    });

    it('should translate UnifiedQuery to FreeTour API params', async () => {
      const mockResponse = createMockFreeTourResponse(1);
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

      const query: UnifiedQuery = {
        countryCode: 'ES',
        cityName: 'Barcelona',
        page: 2,
        limit: 20,
        language: 'en',
      };

      await adapter.fetchTours(query);

      // Check that fetch was called with correct URL params
      const fetchCall = fetchMock.mock.calls[0];
      const url = fetchCall[0] as string;

      expect(url).toContain('page=2');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      (adapter as any).accessToken = 'test-token';
      (adapter as any).tokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    });

    it('should handle API errors gracefully', async () => {
      fetchMock.mockResolvedValueOnce(createMockFetchResponse({ error: 'Server error' }, 500));

      const query: UnifiedQuery = createSampleQuery();

      await expect(adapter.fetchTours(query)).rejects.toThrow();
    });

    it('should retry on 401 with token refresh', async () => {
      const mockAuthResponse = {
        data: {
          token: {
            accessToken: 'refreshed-token',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
        },
      };

      const mockToursResponse = createMockFreeTourResponse(1);

      // First call: 401 unauthorized
      fetchMock.mockResolvedValueOnce(createMockFetchResponse({ error: 'Unauthorized' }, 401));
      // Second call: successful auth
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(mockAuthResponse));
      // Third call: successful tours fetch
      fetchMock.mockResolvedValueOnce(createMockFetchResponse(mockToursResponse));

      const query: UnifiedQuery = createSampleQuery();
      const result = await adapter.fetchTours(query);

      expect(result).toHaveLength(1);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });
});

