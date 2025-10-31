import { getAdapter } from '@/lib/adapters/registry';
import type { UnifiedQuery, NormalizedTour, AggregatedResult } from '@/lib/adapters/types';

/**
 * Tour Aggregator Service
 * Orchestrates multiple tour provider adapters and combines their results
 */
export class TourAggregator {
  /**
   * Aggregate search across multiple providers
   */
  async aggregateSearch(
    query: UnifiedQuery,
    providers: string[] = ['freetour']
  ): Promise<AggregatedResult> {
    console.log(`[Aggregator] Searching across providers: ${providers.join(', ')}`);

    // Step 1: Get requested adapters
    const adapters = providers.map(name => {
      try {
        return getAdapter(name);
      } catch (err) {
        console.warn(`[Aggregator] Adapter '${name}' not found`, err);
        return null;
      }
    }).filter((adapter): adapter is NonNullable<typeof adapter> => adapter !== null);

    if (adapters.length === 0) {
      throw new Error('No valid adapters found');
    }

    // Step 2: Call all adapters in parallel
    const startTime = Date.now();
    const results = await Promise.allSettled(
      adapters.map(adapter => adapter.fetchTours(query))
    );
    const fetchDuration = Date.now() - startTime;

    console.log(`[Aggregator] Fetched from ${adapters.length} providers in ${fetchDuration}ms`);

    // Step 3: Collect successful results and errors
    const allTours: NormalizedTour[] = [];
    const errors: Array<{ provider: string; error: string }> = [];

    results.forEach((result, index) => {
      const providerName = adapters[index].name;
      
      if (result.status === 'fulfilled') {
        allTours.push(...result.value);
        console.log(`[Aggregator] ${providerName}: ${result.value.length} tours`);
      } else {
        const errorMessage = result.reason?.message || String(result.reason) || 'Unknown error';
        errors.push({
          provider: providerName,
          error: errorMessage,
        });
        console.error(`[Aggregator] ${providerName} failed:`, errorMessage);
      }
    });

    // Step 4: Deduplicate tours
    const uniqueTours = this.deduplicateTours(allTours);
    console.log(`[Aggregator] Deduplicated: ${allTours.length} → ${uniqueTours.length} tours`);

    // Step 5: Apply post-aggregation filters
    const filtered = this.applyPostFilters(uniqueTours, query);

    // Step 6: Sort tours
    const sorted = this.sortTours(filtered, query.sortBy);

    // Step 7: Paginate
    const paginated = this.paginate(sorted, query.page || 1, query.limit || 20);

    // Step 8: Return aggregated result
    return {
      tours: paginated.items,
      pagination: {
        total: sorted.length,
        page: paginated.currentPage,
        totalPages: paginated.totalPages,
        limit: paginated.limit,
      },
      errors,
    };
  }

  /**
   * Deduplicate tours from multiple sources
   * Strategy: Keep tour from first source (priority-based)
   */
  private deduplicateTours(tours: NormalizedTour[]): NormalizedTour[] {
    const tourMap = new Map<string, NormalizedTour>();

    tours.forEach(tour => {
      // Create unique key: source + external ID
      const key = `${tour.source}-${tour.externalId}`;
      
      if (!tourMap.has(key)) {
        tourMap.set(key, tour);
      }
    });

    return Array.from(tourMap.values());
  }

  /**
   * Apply additional filters after aggregation
   */
  private applyPostFilters(tours: NormalizedTour[], query: UnifiedQuery): NormalizedTour[] {
    let filtered = tours;

    // Filter by search query (if not already filtered by adapter)
    if (query.searchQuery) {
      const searchLower = query.searchQuery.toLowerCase();
      filtered = filtered.filter(tour => {
        return (
          tour.title.toLowerCase().includes(searchLower) ||
          tour.description.toLowerCase().includes(searchLower) ||
          tour.location.cityName.toLowerCase().includes(searchLower) ||
          tour.location.countryName.toLowerCase().includes(searchLower)
        );
      });
    }

    // Additional filters can be added here

    return filtered;
  }

  /**
   * Sort tours by specified criteria
   */
  private sortTours(tours: NormalizedTour[], sortBy?: string): NormalizedTour[] {
    const sorted = [...tours];

    switch (sortBy) {
      case 'price_asc':
        return sorted.sort((a, b) => a.price.amount - b.price.amount);
      
      case 'price_desc':
        return sorted.sort((a, b) => b.price.amount - a.price.amount);
      
      case 'rating':
        return sorted.sort((a, b) => b.reviews.rating - a.reviews.rating);
      
      case 'popularity':
        return sorted.sort((a, b) => b.reviews.count - a.reviews.count);
      
      case 'duration':
        return sorted.sort((a, b) => {
          const durationA = this.parseDurationMinutes(a.duration);
          const durationB = this.parseDurationMinutes(b.duration);
          return durationA - durationB;
        });
      
      default:
        // Default: mixed sources (as-is) or by rating
        return sorted.sort((a, b) => b.reviews.rating - a.reviews.rating);
    }
  }

  /**
   * Parse duration string to minutes for comparison
   */
  private parseDurationMinutes(duration: string): number {
    const hourMatch = duration.match(/(\d+\.?\d*)\s*hours?/i);
    const minuteMatch = duration.match(/(\d+)\s*minutes?/i);

    let totalMinutes = 0;
    
    if (hourMatch) {
      totalMinutes += parseFloat(hourMatch[1]) * 60;
    }
    
    if (minuteMatch) {
      totalMinutes += parseInt(minuteMatch[1], 10);
    }

    return totalMinutes || 0;
  }

  /**
   * Paginate results
   */
  private paginate(
    items: NormalizedTour[],
    page: number,
    limit: number
  ): {
    items: NormalizedTour[];
    currentPage: number;
    totalPages: number;
    limit: number;
  } {
    const totalPages = Math.ceil(items.length / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages || 1));
    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      items: items.slice(startIndex, endIndex),
      currentPage,
      totalPages,
      limit,
    };
  }
}

// Export singleton instance
export const tourAggregator = new TourAggregator();

