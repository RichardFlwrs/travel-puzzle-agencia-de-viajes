'use server';

import {
  getToursWithFilters,
  getTourById,
  getTourByExternalId,
  getCountriesWithTourCount,
  getCitiesWithTourCount,
  getToursMetadata,
} from '@/lib/db/repositories/json-tour-repository';
import type { TourFilters } from '@/lib/db/json-pagination';
import { syncToursFromAPI } from '@/lib/db/sync/json-tour-sync';
import { freeTourClient } from '@/lib/api/freetour-client';
import type { PaginationParams } from '@/lib/db/pagination';

/**
 * Fetch tours with filters and pagination
 */
export async function fetchTours(
  filters: TourFilters = {},
  pagination: PaginationParams = {}
) {
  try {
    const result = await getToursWithFilters(filters, pagination);
    // JSON data is already serialized, just ensure it's plain objects
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    console.error('Error fetching tours:', error);
    throw new Error('Failed to fetch tours');
  }
}

/**
 * Fetch a single tour by ID
 */
export async function fetchTourById(tourId: string, language: string = 'en') {
  try {
    const result = await getTourById(tourId, language);
    return result ? JSON.parse(JSON.stringify(result)) : null;
  } catch (error) {
    console.error('Error fetching tour:', error);
    throw new Error('Failed to fetch tour');
  }
}

/**
 * Fetch a single tour by external ID
 */
export async function fetchTourByExternalId(externalId: number, language: string = 'en') {
  try {
    const result = await getTourByExternalId(externalId, language);
    return result ? JSON.parse(JSON.stringify(result)) : null;
  } catch (error) {
    console.error('Error fetching tour by external ID:', error);
    throw new Error('Failed to fetch tour');
  }
}

/**
 * Fetch countries with tour count for filters
 */
export async function fetchCountries(language: string = 'en') {
  try {
    const result = await getCountriesWithTourCount(language);
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    console.error('Error fetching countries:', error);
    throw new Error('Failed to fetch countries');
  }
}

/**
 * Fetch cities with tour count for filters
 */
export async function fetchCities(countryId?: number, language: string = 'en') {
  try {
    const result = await getCitiesWithTourCount(countryId, language);
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    console.error('Error fetching cities:', error);
    throw new Error('Failed to fetch cities');
  }
}

/**
 * Fetch cities directly from FreeTour API
 * Note: Progress tracking is not available in server actions.
 * For progress tracking, use the API route instead.
 */
export async function fetchCitiesFromAPI(countryId: number, language: string = 'en') {
  try {
    // Server actions can't pass callbacks, so we call without progress callback
    const response = await freeTourClient.fetchCities(countryId);
    
    // Transform to simple format with current language
    const cities = response.data.map(city => ({
      id: city.id,
      name: city.title[language as keyof typeof city.title] || city.title.en,
    }));
    
    return cities;
  } catch (error) {
    console.error('Error fetching cities from API:', error);
    throw new Error('Failed to fetch cities');
  }
}

/**
 * Get tours metadata (last sync, total count, etc.)
 */
export async function fetchToursMetadata() {
  try {
    return await getToursMetadata();
  } catch (error) {
    console.error('Error fetching tours metadata:', error);
    return {
      lastUpdated: null,
      totalTours: 0,
      syncStatus: 'error',
    };
  }
}

/**
 * Sync tours from FreeTour API to JSON files
 * This should be called manually or via a cron job
 */
export async function syncTours(maxPages?: number) {
  try {
    return await syncToursFromAPI(maxPages);
  } catch (error) {
    console.error('Error syncing tours:', error);
    throw new Error('Failed to sync tours');
  }
}

