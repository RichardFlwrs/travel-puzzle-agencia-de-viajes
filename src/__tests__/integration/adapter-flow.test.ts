/**
 * Integration Test: Full Adapter Flow
 * Tests the complete flow from API authentication to data transformation to aggregation
 */

import { FreeTourAdapter } from '../../lib/adapters/freetour-adapter';
import { ViatorAdapter } from '../../lib/adapters/viator-adapter';
import { TourAggregator } from '../../lib/services/tour-aggregator';
import { UnifiedQuery } from '../../lib/adapters/types';

jest.mock('@/lib/prisma');
jest.mock('@/lib/cache/redis');

describe('Integration: Complete Adapter Flow', () => {
  describe('FreeTour Adapter Complete Flow', () => {
    let adapter: FreeTourAdapter;
    let fetchMock: jest.Mock;

    beforeEach(() => {
      adapter = new FreeTourAdapter();
      fetchMock = jest.fn();
      global.fetch = fetchMock;
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should complete full flow: auth → fetch → transform', async () => {
      // Mock authentication response
      const authResponse = {
        data: {
          token: {
            accessToken: 'integration-test-token',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
        },
      };

      // Mock tours API response (matching actual FreeTour format)
      const toursResponse = {
        data: {
          tours: [
            {
              id: 999,
              title: { en: 'Integration Test Tour', es: 'Tour de Prueba' },
              description: { en: 'Test description', es: 'Descripción de prueba' },
              brief: { en: 'Test brief', es: 'Breve prueba' },
              URLs: { en: 'https://test.com/tour', es: 'https://test.com/es/tour' },
              price: { value: 15.99, currency: 'EUR' },
              length: '1:30',
              providerTitle: 'Integration Test Provider',
              providerPhone: '+34999999999',
              cityId: 999,
              countryId: 999,
              categoryId: 1,
              rating: 4.7,
              reviewsNumber: 250,
              meetingPoint: {
                title: 'Test Meeting Point',
                address: 'Test Address, 123',
                coordinates: '40.4168,-3.7038',
                googlePlaceId: 'test-place-id',
              },
              images: [
                {
                  id: 1,
                  URL: 'https://test.com/image1.jpg',
                  description: 'Test image',
                },
              ],
              POIs: [],
              includes: ['Test Guide', 'Test Map'],
              videoURL: null,
              isActive: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
          ],
          pagination: {
            total: 1,
            page: 1,
            limit: 10,
          },
        },
      };

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => authResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => toursResponse,
        });

      const query: UnifiedQuery = {
        countryCode: 'ES',
        page: 1,
        limit: 10,
        language: 'en',
      };

      const result = await adapter.fetchTours(query);

      // Verify authentication happened
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/login'),
        expect.objectContaining({ method: 'POST' })
      );

      // Verify tours were fetched with token
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/tours'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer integration-test-token',
          }),
        })
      );

      // Verify transformation
      expect(result).toHaveLength(1);
      const tour = result[0];

      // Check normalized structure
      expect(tour).toMatchObject({
        id: 'freetour-999',
        externalId: 999,
        source: 'freetour',
        title: 'Integration Test Tour',
        description: 'Test description',
        brief: 'Test brief',
        bookingUrl: 'https://test.com/tour',
        isActive: true,
        price: {
          amount: 15.99,
          currency: 'EUR',
          formatted: expect.stringContaining('15.99'),
        },
        duration: expect.any(String),
        location: {
          countryCode: expect.any(String),
          countryName: expect.any(String),
          cityName: expect.any(String),
          meetingPoint: {
            address: 'Test Address, 123',
            coordinates: {
              lat: 40.4168,
              lng: -3.7038,
            },
          },
        },
        provider: {
          name: 'Integration Test Provider',
          phone: '+34999999999',
          rating: 4.7,
        },
        images: [
          {
            url: 'https://test.com/image1.jpg',
            alt: expect.any(String),
            isThumbnail: false,
          },
        ],
      });
    });

    it('should handle language selection correctly', async () => {
      const authResponse = {
        data: {
          token: {
            accessToken: 'test-token',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
        },
      };

      const toursResponse = {
        data: {
          tours: [
            {
              id: 1,
              title: {
                en: 'English Title',
                es: 'Título Español',
                fr: 'Titre Français',
              },
              description: {
                en: 'English Description',
                es: 'Descripción Española',
                fr: 'Description Française',
              },
              brief: { en: 'Brief', es: 'Breve', fr: 'Bref' },
              URLs: { en: 'url', es: 'url', fr: 'url' },
              price: { value: 10, currency: 'EUR' },
              length: '2:00',
              providerTitle: 'Test',
              cityId: 1,
              countryId: 1,
              categoryId: 1,
              rating: 4.5,
              reviewsNumber: 100,
              meetingPoint: { title: 'Test', address: 'Test', coordinates: '0,0', googlePlaceId: 'test' },
              images: [],
              POIs: [],
              includes: [],
              videoURL: null,
              isActive: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
          ],
        },
      };

      fetchMock
        .mockResolvedValueOnce({ ok: true, json: async () => authResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => toursResponse });

      const query: UnifiedQuery = { page: 1, limit: 10, language: 'es' };
      const result = await adapter.fetchTours(query);

      expect(result[0].title).toBe('Título Español');
      expect(result[0].description).toBe('Descripción Española');
    });
  });

  describe('Multi-Provider Aggregation', () => {
    it('should aggregate results from FreeTour and Viator', async () => {
      const aggregator = new TourAggregator();

      // Mock FreeTour authentication
      const authResponse = {
        data: {
          token: {
            accessToken: 'test-token',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
        },
      };

      const freeTourResponse = {
        data: {
          tours: [
            {
              id: 1,
              title: { en: 'FreeTour Tour' },
              description: { en: 'FreeTour Description' },
              brief: { en: 'Brief' },
              URLs: { en: 'url' },
              price: { value: 20, currency: 'EUR' },
              length: '2:00',
              providerTitle: 'FreeTour Provider',
              cityId: 1,
              countryId: 1,
              categoryId: 1,
              rating: 4.5,
              reviewsNumber: 100,
              meetingPoint: { title: 'Test', address: 'Test', coordinates: '0,0', googlePlaceId: 'test' },
              images: [],
              POIs: [],
              includes: [],
              videoURL: null,
              isActive: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
          ],
        },
      };

      const fetchMock = jest.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => authResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => freeTourResponse });

      global.fetch = fetchMock;

      const query: UnifiedQuery = {
        countryCode: 'ES',
        page: 1,
        limit: 20,
        language: 'en',
      };

      const result = await aggregator.aggregateSearch(query, [freeTourAdapter, viatorAdapter]);

      // Should have tours from both providers
      expect(result.tours.length).toBeGreaterThan(1);
      
      const sources = result.tours.map(t => t.source);
      expect(sources).toContain('freetour');
      expect(sources).toContain('viator');

      // Should have correct pagination
      expect(result.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: expect.any(Number),
        totalPages: expect.any(Number),
      });

      // Should have no errors (both providers succeeded)
      expect(result.errors).toHaveLength(0);
    });

    it('should handle partial provider failures gracefully', async () => {
      const aggregator = new TourAggregator();

      // Mock FreeTour to fail
      global.fetch = jest.fn().mockRejectedValue(new Error('FreeTour API down'));

      const query: UnifiedQuery = {
        countryCode: 'ES',
        page: 1,
        limit: 20,
        language: 'en',
      };

      const result = await aggregator.aggregateSearch(query, ['freetour', 'viator']);

      // Should still have Viator tours
      const viatorTours = result.tours.filter(t => t.source === 'viator');
      expect(viatorTours.length).toBeGreaterThan(0);

      // Should record FreeTour error
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        provider: 'freetour',
        error: expect.stringContaining('FreeTour API down'),
      });
    });
  });

  describe('Data Compatibility', () => {
    it('should ensure all adapters return compatible NormalizedTour format', async () => {
      const freeTourAdapter = new FreeTourAdapter();
      const viatorAdapter = new ViatorAdapter();

      // Mock FreeTour authentication
      const authResponse = {
        data: {
          token: {
            accessToken: 'test-token',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
        },
      };

      const freeTourResponse = {
        data: {
          tours: [
            {
              id: 1,
              title: { en: 'Test' },
              description: { en: 'Test' },
              brief: { en: 'Test' },
              URLs: { en: 'url' },
              price: { value: 10, currency: 'EUR' },
              length: '1:00',
              providerTitle: 'Test',
              cityId: 1,
              countryId: 1,
              categoryId: 1,
              rating: 4.5,
              reviewsNumber: 100,
              meetingPoint: { title: 'Test', address: 'Test', coordinates: '0,0', googlePlaceId: 'test' },
              images: [],
              POIs: [],
              includes: [],
              videoURL: null,
              isActive: true,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
          ],
        },
      };

      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => authResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => freeTourResponse });

      const query: UnifiedQuery = { page: 1, limit: 10, language: 'en' };

      const freeTourResults = await freeTourAdapter.fetchTours(query);
      const viatorResults = await viatorAdapter.fetchTours(query);

      // Both should return arrays
      expect(Array.isArray(freeTourResults)).toBe(true);
      expect(Array.isArray(viatorResults)).toBe(true);

      // All tours should have required fields
      const allTours = [...freeTourResults, ...viatorResults];
      
      allTours.forEach(tour => {
        expect(tour).toHaveProperty('id');
        expect(tour).toHaveProperty('externalId');
        expect(tour).toHaveProperty('source');
        expect(tour).toHaveProperty('title');
        expect(tour).toHaveProperty('bookingUrl');
        expect(tour).toHaveProperty('isActive');
        expect(tour).toHaveProperty('price.amount');
        expect(tour).toHaveProperty('price.currency');
        expect(tour).toHaveProperty('price.formatted');
        expect(tour).toHaveProperty('duration');
        expect(tour).toHaveProperty('location.countryCode');
        expect(tour).toHaveProperty('location.countryName');
        expect(tour).toHaveProperty('location.cityName');
        expect(tour).toHaveProperty('provider.name');
        expect(tour).toHaveProperty('images');
        expect(tour).toHaveProperty('createdAt');
        expect(tour).toHaveProperty('updatedAt');

        // Check types
        expect(typeof tour.id).toBe('string');
        expect(typeof tour.title).toBe('string');
        expect(typeof tour.bookingUrl).toBe('string');
        expect(typeof tour.isActive).toBe('boolean');
        expect(typeof tour.price.amount).toBe('number');
        expect(typeof tour.price.currency).toBe('string');
        expect(typeof tour.duration).toBe('string');
        expect(Array.isArray(tour.images)).toBe(true);
        expect(tour.createdAt instanceof Date).toBe(true);
        expect(tour.updatedAt instanceof Date).toBe(true);
      });
    });
  });
});

