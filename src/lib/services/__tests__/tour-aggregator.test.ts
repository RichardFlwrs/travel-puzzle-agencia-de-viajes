/**
 * Tour Aggregator Tests
 * Tests multi-provider orchestration, merging, deduplication, and sorting
 */

import { TourAggregator } from '../tour-aggregator';
import { TourAdapter, UnifiedQuery } from '../../adapters/types';
import { createSampleQuery, createSampleTour } from '../../adapters/__tests__/test-utils';
import * as registry from '../../adapters/registry';

// Mock dependencies
jest.mock('@/lib/prisma');
jest.mock('@/lib/cache/redis');

describe('TourAggregator', () => {
  let aggregator: TourAggregator;
  let mockAdapter1: jest.Mocked<TourAdapter>;
  let mockAdapter2: jest.Mocked<TourAdapter>;
  let getAdapterSpy: jest.SpyInstance;

  beforeEach(() => {
    // Create mock adapters with all required methods
    mockAdapter1 = {
      name: 'provider1',
      fetchTours: jest.fn(),
      fetchTourDetails: jest.fn(),
      syncToDatabase: jest.fn(),
      isAvailable: jest.fn().mockResolvedValue(true),
    } as jest.Mocked<TourAdapter>;

    mockAdapter2 = {
      name: 'provider2',
      fetchTours: jest.fn(),
      fetchTourDetails: jest.fn(),
      syncToDatabase: jest.fn(),
      isAvailable: jest.fn().mockResolvedValue(true),
    } as jest.Mocked<TourAdapter>;

    // Mock the registry.getAdapter function
    getAdapterSpy = jest.spyOn(registry, 'getAdapter').mockImplementation((name: string) => {
      if (name === 'provider1') return mockAdapter1;
      if (name === 'provider2') return mockAdapter2;
      throw new Error(`Adapter '${name}' not found`);
    });

    aggregator = new TourAggregator();
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (getAdapterSpy) {
      getAdapterSpy.mockRestore();
    }
  });

  describe('Single Provider', () => {
    it('should fetch tours from a single provider', async () => {
      const mockTours = [
        createSampleTour({ id: 'provider1-1', source: 'provider1' }),
        createSampleTour({ id: 'provider1-2', source: 'provider1' }),
      ];

      mockAdapter1.fetchTours.mockResolvedValue(mockTours);

      const query: UnifiedQuery = createSampleQuery();
      const result = await aggregator.aggregateSearch(query, ['provider1']);

      expect(result.tours).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(mockAdapter1.fetchTours).toHaveBeenCalledWith(query);
    });

    it('should handle empty results', async () => {
      mockAdapter1.fetchTours.mockResolvedValue([]);

      const query: UnifiedQuery = createSampleQuery();
      const result = await aggregator.aggregateSearch(query, ['provider1']);

      expect(result.tours).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Multiple Providers', () => {
    it('should fetch and merge tours from multiple providers', async () => {
      const provider1Tours = [
        createSampleTour({ id: 'provider1-1', source: 'provider1', title: 'Tour A' }),
        createSampleTour({ id: 'provider1-2', source: 'provider1', title: 'Tour B' }),
      ];

      const provider2Tours = [
        createSampleTour({ id: 'provider2-1', source: 'provider2', title: 'Tour C' }),
        createSampleTour({ id: 'provider2-2', source: 'provider2', title: 'Tour D' }),
      ];

      mockAdapter1.fetchTours.mockResolvedValue(provider1Tours);
      mockAdapter2.fetchTours.mockResolvedValue(provider2Tours);

      const query: UnifiedQuery = createSampleQuery();
      const result = await aggregator.aggregateSearch(query, ['provider1', 'provider2']);

      expect(result.tours).toHaveLength(4);
      expect(result.pagination.total).toBe(4);
      expect(result.errors).toHaveLength(0);

      // Check that tours from both providers are present
      const sources = result.tours.map(t => t.source);
      expect(sources).toContain('provider1');
      expect(sources).toContain('provider2');
    });

    it('should call adapters in parallel', async () => {
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      mockAdapter1.fetchTours.mockImplementation(async () => {
        await delay(100);
        return [createSampleTour({ source: 'provider1' })];
      });

      mockAdapter2.fetchTours.mockImplementation(async () => {
        await delay(100);
        return [createSampleTour({ source: 'provider2' })];
      });

      const startTime = Date.now();
      const query: UnifiedQuery = createSampleQuery();
      await aggregator.aggregateSearch(query, ['provider1', 'provider2']);
      const duration = Date.now() - startTime;

      // Should complete in ~100ms (parallel), not ~200ms (sequential)
      expect(duration).toBeLessThan(150);
    });
  });

  describe('Error Handling', () => {
    it('should continue if one provider fails', async () => {
      const successfulTours = [
        createSampleTour({ id: 'provider1-1', source: 'provider1' }),
      ];

      mockAdapter1.fetchTours.mockResolvedValue(successfulTours);
      mockAdapter2.fetchTours.mockRejectedValue(new Error('Provider 2 failed'));

      const query: UnifiedQuery = createSampleQuery();
      const result = await aggregator.aggregateSearch(query, ['provider1', 'provider2']);

      // Should have tours from successful provider
      expect(result.tours).toHaveLength(1);
      expect(result.tours[0].source).toBe('provider1');

      // Should record error
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({
        provider: 'provider2',
        error: expect.stringContaining('Provider 2 failed'),
      });
    });

    it('should return empty results if all providers fail', async () => {
      mockAdapter1.fetchTours.mockRejectedValue(new Error('Provider 1 failed'));
      mockAdapter2.fetchTours.mockRejectedValue(new Error('Provider 2 failed'));

      const query: UnifiedQuery = createSampleQuery();
      const result = await aggregator.aggregateSearch(query, ['provider1', 'provider2']);

      expect(result.tours).toHaveLength(0);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('Deduplication', () => {
    it('should deduplicate tours with same external ID from same source', async () => {
      const duplicatedTours = [
        createSampleTour({ id: 'provider1-123', externalId: '123', source: 'provider1' }),
        createSampleTour({ id: 'provider1-123', externalId: '123', source: 'provider1' }),
      ];

      mockAdapter1.fetchTours.mockResolvedValue(duplicatedTours);

      const query: UnifiedQuery = createSampleQuery();
      const result = await aggregator.aggregateSearch(query, ['provider1']);

      // Should only have one tour after deduplication
      expect(result.tours).toHaveLength(1);
    });

    it('should NOT deduplicate tours from different sources', async () => {
      const provider1Tours = [
        createSampleTour({ id: 'provider1-123', externalId: '123', source: 'provider1' }),
      ];

      const provider2Tours = [
        createSampleTour({ id: 'provider2-456', externalId: '456', source: 'provider2' }),
      ];

      mockAdapter1.fetchTours.mockResolvedValue(provider1Tours);
      mockAdapter2.fetchTours.mockResolvedValue(provider2Tours);

      const query: UnifiedQuery = createSampleQuery();
      const result = await aggregator.aggregateSearch(query, ['provider1', 'provider2']);

      // Should have both tours (different sources)
      expect(result.tours).toHaveLength(2);
    });
  });

  describe('Sorting', () => {
    it('should sort by price ascending', async () => {
      const tours = [
        createSampleTour({ id: '1', price: { amount: 50, currency: 'EUR', formatted: '€50' } }),
        createSampleTour({ id: '2', price: { amount: 20, currency: 'EUR', formatted: '€20' } }),
        createSampleTour({ id: '3', price: { amount: 35, currency: 'EUR', formatted: '€35' } }),
      ];

      mockAdapter1.fetchTours.mockResolvedValue(tours);

      const query: UnifiedQuery = { ...createSampleQuery(), sortBy: 'price_asc' };
      const result = await aggregator.aggregateSearch(query, ['provider1']);

      expect(result.tours[0].price.amount).toBe(20);
      expect(result.tours[1].price.amount).toBe(35);
      expect(result.tours[2].price.amount).toBe(50);
    });

    it('should sort by price descending', async () => {
      const tours = [
        createSampleTour({ id: '1', price: { amount: 20, currency: 'EUR', formatted: '€20' } }),
        createSampleTour({ id: '2', price: { amount: 50, currency: 'EUR', formatted: '€50' } }),
        createSampleTour({ id: '3', price: { amount: 35, currency: 'EUR', formatted: '€35' } }),
      ];

      mockAdapter1.fetchTours.mockResolvedValue(tours);

      const query: UnifiedQuery = { ...createSampleQuery(), sortBy: 'price_desc' };
      const result = await aggregator.aggregateSearch(query, ['provider1']);

      expect(result.tours[0].price.amount).toBe(50);
      expect(result.tours[1].price.amount).toBe(35);
      expect(result.tours[2].price.amount).toBe(20);
    });

    it('should sort by rating', async () => {
      const tours = [
        createSampleTour({ id: '1', provider: { name: 'P1', rating: 3.5 } }),
        createSampleTour({ id: '2', provider: { name: 'P2', rating: 4.8 } }),
        createSampleTour({ id: '3', provider: { name: 'P3', rating: 4.0 } }),
      ];

      mockAdapter1.fetchTours.mockResolvedValue(tours);

      const query: UnifiedQuery = { ...createSampleQuery(), sortBy: 'rating' };
      const result = await aggregator.aggregateSearch(query, ['provider1']);

      expect(result.tours[0].provider.rating).toBe(4.8);
      expect(result.tours[1].provider.rating).toBe(4.0);
      expect(result.tours[2].provider.rating).toBe(3.5);
    });
  });

  describe('Pagination', () => {
    it('should paginate results correctly', async () => {
      const tours = Array.from({ length: 25 }, (_, i) =>
        createSampleTour({ id: `tour-${i}`, title: `Tour ${i}` })
      );

      mockAdapter1.fetchTours.mockResolvedValue(tours);

      const query: UnifiedQuery = { ...createSampleQuery(), page: 1, limit: 10 };
      const result = await aggregator.aggregateSearch(query, ['provider1']);

      expect(result.tours).toHaveLength(10);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.totalPages).toBe(3);
    });

    it('should return correct page 2', async () => {
      const tours = Array.from({ length: 25 }, (_, i) =>
        createSampleTour({ id: `tour-${i}`, title: `Tour ${i}` })
      );

      mockAdapter1.fetchTours.mockResolvedValue(tours);

      const query: UnifiedQuery = { ...createSampleQuery(), page: 2, limit: 10 };
      const result = await aggregator.aggregateSearch(query, ['provider1']);

      expect(result.tours).toHaveLength(10);
      expect(result.pagination.page).toBe(2);
      // Verify we got different tours (page 2)
      expect(result.tours[0].id).not.toBe('tour-0');
    });

    it('should handle last page with fewer items', async () => {
      const tours = Array.from({ length: 25 }, (_, i) =>
        createSampleTour({ id: `tour-${i}` })
      );

      mockAdapter1.fetchTours.mockResolvedValue(tours);

      const query: UnifiedQuery = { ...createSampleQuery(), page: 3, limit: 10 };
      const result = await aggregator.aggregateSearch(query, ['provider1']);

      expect(result.tours).toHaveLength(5); // Only 5 tours on last page
      expect(result.pagination.page).toBe(3);
      expect(result.pagination.totalPages).toBe(3);
    });
  });
});

