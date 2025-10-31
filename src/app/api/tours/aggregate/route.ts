import { NextRequest, NextResponse } from 'next/server';
import { tourAggregator } from '@/lib/services/tour-aggregator';
import type { UnifiedQuery } from '@/lib/adapters/types';

/**
 * POST /api/tours/aggregate
 * Aggregate tours from multiple providers
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract query and providers from request
    const { query, providers = ['freetour'] } = body as {
      query: UnifiedQuery;
      providers?: string[];
    };

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Validate providers array
    if (!Array.isArray(providers) || providers.length === 0) {
      return NextResponse.json(
        { error: 'Providers must be a non-empty array' },
        { status: 400 }
      );
    }

    // Aggregate search across providers
    const result = await tourAggregator.aggregateSearch(query, providers);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Aggregation error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to aggregate tours',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tours/aggregate
 * Aggregate tours from multiple providers (query params)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Parse providers from query string
    const providersParam = searchParams.get('providers');
    const providers = providersParam
      ? providersParam.split(',').map(p => p.trim())
      : ['freetour'];

    // Build unified query from URL params
    const query: UnifiedQuery = {
      countryCode: searchParams.get('countryCode') || undefined,
      cityName: searchParams.get('cityName') || undefined,
      searchQuery: searchParams.get('search') || undefined,
      categoryId: searchParams.get('categoryId')
        ? parseInt(searchParams.get('categoryId')!, 10)
        : undefined,
      page: searchParams.get('page')
        ? parseInt(searchParams.get('page')!, 10)
        : 1,
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!, 10)
        : 20,
      sortBy: (searchParams.get('sortBy') as 'price_asc' | 'price_desc' | 'rating' | 'popularity' | 'duration' | undefined) || undefined,
      language: searchParams.get('language') || 'en',
    };

    // Parse price range if provided
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    if (minPrice !== null || maxPrice !== null) {
      query.priceRange = {
        min: minPrice !== null ? parseFloat(minPrice) : 0,
        max: maxPrice !== null ? parseFloat(maxPrice) : 999999,
      };
    }

    // Aggregate search
    const result = await tourAggregator.aggregateSearch(query, providers);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Aggregation error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to aggregate tours',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

