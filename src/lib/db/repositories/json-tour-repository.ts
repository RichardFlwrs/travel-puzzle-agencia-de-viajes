import fs from 'fs/promises';
import path from 'path';
import { paginateJsonTours, TourFilters } from '../json-pagination';
import { PaginationParams, PaginatedResponse } from '../pagination';
import { TourAPI } from '@/types';

// Type matching the expected return format (simplified from Prisma TourWithRelations)
export interface TourWithRelations {
  id: string;
  externalId: number;
  title: string;
  brief: string | null;
  description: string | null;
  providerTitle: string;
  providerPhone: string | null;
  priceValue: number;
  priceCurrency: string;
  duration: string;
  titleImageURL: string | null;
  categoryId: number;
  rating: number | null;
  reviewsNumber: number;
  cityId: number;
  countryId: number;
  meetingPoint: any;
  includes: any;
  POIs: any;
  images: any;
  videoURL: string | null;
  isActive: boolean;
  updatedAt: Date;
  createdAt?: Date;
  // Relations
  translations?: Array<{
    language: string;
    title: string;
    brief: string | null;
    description: string | null;
    url: string;
  }>;
  city?: {
    id: number;
    countryId: number;
    translations: Record<string, string> | null;
  };
  country?: {
    id: number;
    code: string;
    translations: Record<string, string> | null;
  };
}

// Cache for countries data
let countriesCache: any[] | null = null;
let countryIdToCodeMap: Map<number, string> | null = null;

/**
 * Load countries.json and create countryId -> countryCode mapping
 */
async function loadCountriesData(): Promise<{ countries: any[]; idToCodeMap: Map<number, string> }> {
  if (countriesCache && countryIdToCodeMap) {
    return { countries: countriesCache, idToCodeMap: countryIdToCodeMap };
  }

  const filePath = path.join(process.cwd(), 'data', 'countires.json');
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    countriesCache = Array.isArray(parsed) ? parsed : [];
    
    countryIdToCodeMap = new Map();
    for (const country of countriesCache) {
      if (country.id && country.shortTitle) {
        countryIdToCodeMap.set(country.id, country.shortTitle.toLowerCase());
      }
    }
    
    return { countries: countriesCache, idToCodeMap: countryIdToCodeMap };
  } catch (error) {
    console.error('Error loading countries.json:', error);
    countriesCache = [];
    countryIdToCodeMap = new Map();
    return { countries: [], idToCodeMap: new Map() };
  }
}

/**
 * Get country code from countryId
 */
async function getCountryCode(countryId: number): Promise<string | null> {
  const { idToCodeMap } = await loadCountriesData();
  return idToCodeMap.get(countryId) || null;
}

/**
 * Load tours from a country JSON file
 */
async function loadCountryTours(countryCode: string): Promise<TourAPI[]> {
  const filePath = path.join(process.cwd(), 'data', 'tours', `${countryCode}.json`);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

/**
 * Load all tours from all country files (for searching by ID)
 */
async function loadAllTours(): Promise<TourAPI[]> {
  const toursDir = path.join(process.cwd(), 'data', 'tours');
  try {
    const files = await fs.readdir(toursDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    const allTours: TourAPI[] = [];
    for (const file of jsonFiles) {
      const filePath = path.join(toursDir, file);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const tours = JSON.parse(content);
        if (Array.isArray(tours)) {
          allTours.push(...tours);
        }
      } catch (error) {
        console.warn(`Error loading tours from ${file}:`, error);
      }
    }
    
    return allTours;
  } catch {
    return [];
  }
}

/**
 * Transform TourAPI to TourWithRelations format
 */
async function transformTourToWithRelations(tour: TourAPI, language: string = 'en'): Promise<TourWithRelations> {
  const { countries, idToCodeMap } = await loadCountriesData();
  const countryCode = idToCodeMap.get(tour.countryId) || '';
  
  // Build translations array
  const translations = ['en', 'es', 'pt', 'de', 'fr', 'it'].map(lang => ({
    language: lang,
    title: tour.title[lang as keyof typeof tour.title] || '',
    brief: tour.brief[lang as keyof typeof tour.brief] || null,
    description: tour.description[lang as keyof typeof tour.description] || null,
    url: tour.URLs[lang as keyof typeof tour.URLs] || '',
  }));

  // Get country and city info
  const country = countries.find((c: any) => c.id === tour.countryId);
  const city = {
    id: tour.cityId,
    countryId: tour.countryId,
    translations: null as Record<string, string> | null, // Would need to load from cities data
  };

  return {
    id: `tour-${tour.id}`, // Generate ID from externalId
    externalId: tour.id,
    title: tour.title[language as keyof typeof tour.title] || tour.title.en || '',
    brief: tour.brief[language as keyof typeof tour.brief] || null,
    description: tour.description[language as keyof typeof tour.description] || null,
    providerTitle: tour.providerTitle,
    providerPhone: tour.providerPhone,
    priceValue: tour.price.value,
    priceCurrency: tour.price.currency,
    duration: tour.length,
    titleImageURL: tour.titleImageURL,
    categoryId: tour.categoryId,
    rating: tour.rating,
    reviewsNumber: tour.reviewsNumber,
    cityId: tour.cityId,
    countryId: tour.countryId,
    meetingPoint: tour.meetingPoint,
    includes: tour.includes,
    POIs: tour.POIs,
    images: tour.images,
    videoURL: tour.videoURL,
    isActive: true,
    updatedAt: new Date(tour.updatedAt),
    translations,
    city,
    country: country ? {
      id: country.id,
      code: country.shortTitle || '',
      translations: country.title || null,
    } : undefined,
  };
}

/**
 * Get tours with filters and pagination
 * Currently only supports countryId filtering (via file selection)
 */
export async function getToursWithFilters(
  filters: TourFilters,
  pagination: PaginationParams,
  baseUrl: string = '/api/tours'
): Promise<PaginatedResponse<TourWithRelations>> {
  // Load countries data first
  await loadCountriesData();

  // Get country code from countryId filter
  let countryCode: string | null = null;
  if (filters.countryId) {
    countryCode = await getCountryCode(filters.countryId);
    if (!countryCode) {
      // Country not found, return empty result
      return {
        data: [],
        pagination: {
          total: 0,
          count: 0,
          currentPage: pagination.page || 1,
          perPage: pagination.limit || 20,
          totalPages: 0,
          links: {
            self: baseUrl,
            first: baseUrl,
            last: baseUrl,
            next: null,
            prev: null,
          },
        },
      };
    }
  } else {
    // No countryId filter - this is an error case, but return empty for now
    // In a real scenario, we might want to return tours from all countries
    console.warn('getToursWithFilters called without countryId filter');
    return {
      data: [],
      pagination: {
        total: 0,
        count: 0,
        currentPage: pagination.page || 1,
        perPage: pagination.limit || 20,
        totalPages: 0,
        links: {
          self: baseUrl,
          first: baseUrl,
          last: baseUrl,
          next: null,
          prev: null,
        },
      },
    };
  }

  // Load tours for the country
  const tours = await loadCountryTours(countryCode);
  
  // Paginate and filter
  const paginatedResult = paginateJsonTours(tours, filters, pagination, baseUrl);
  
  // Transform to TourWithRelations format
  const language = filters.language || 'en';
  const transformedData = await Promise.all(
    paginatedResult.data.map(tour => transformTourToWithRelations(tour, language))
  );

  return {
    ...paginatedResult,
    data: transformedData,
  };
}

/**
 * Get a single tour by ID (searches across all country files)
 */
export async function getTourById(tourId: string, language: string = 'en'): Promise<TourWithRelations | null> {
  await loadCountriesData();
  
  // Extract externalId from tourId (format: "tour-{externalId}")
  const externalIdMatch = tourId.match(/^tour-(\d+)$/);
  if (!externalIdMatch) {
    return null;
  }
  const externalId = parseInt(externalIdMatch[1], 10);
  
  return getTourByExternalId(externalId, language);
}

/**
 * Get a single tour by external ID (searches across all country files)
 */
export async function getTourByExternalId(externalId: number, language: string = 'en'): Promise<TourWithRelations | null> {
  await loadCountriesData();
  
  // Load all tours to find the one with matching externalId
  const allTours = await loadAllTours();
  const tour = allTours.find(t => t.id === externalId);
  
  if (!tour) {
    return null;
  }
  
  return await transformTourToWithRelations(tour, language);
}

/**
 * Get countries with tour count from countries.json
 */
export async function getCountriesWithTourCount(language: string = 'en') {
  const { countries } = await loadCountriesData();
  
  // Filter countries that have tours (tourCount > 0)
  const countriesWithTours = countries.filter((country: any) => {
    const tourCount = country.tourCount || 0;
    return tourCount > 0;
  });
  
  // Transform to expected format
  return countriesWithTours.map((country: any) => ({
    id: country.id,
    code: country.shortTitle || '',
    translations: country.title || null,
    _count: {
      tours: country.tourCount || 0,
    },
  }));
}

/**
 * Get cities with tour count (extracted from tours data)
 */
export async function getCitiesWithTourCount(countryId?: number, language: string = 'en') {
  await loadCountriesData();
  
  let allTours: TourAPI[] = [];
  
  if (countryId) {
    // Load tours for specific country
    const countryCode = await getCountryCode(countryId);
    if (countryCode) {
      allTours = await loadCountryTours(countryCode);
    }
  } else {
    // Load all tours
    allTours = await loadAllTours();
  }
  
  // Extract unique cities with tour counts
  const cityMap = new Map<number, { cityId: number; countryId: number; count: number }>();
  
  for (const tour of allTours) {
    const cityId = tour.cityId;
    if (!cityMap.has(cityId)) {
      cityMap.set(cityId, {
        cityId,
        countryId: tour.countryId,
        count: 0,
      });
    }
    const cityData = cityMap.get(cityId)!;
    cityData.count++;
  }
  
  // Transform to expected format
  return Array.from(cityMap.values()).map(city => ({
    id: city.cityId,
    countryId: city.countryId,
    translations: null as Record<string, string> | null, // Would need city data for translations
    _count: {
      tours: city.count,
    },
  }));
}

/**
 * Get tours metadata (calculate from JSON files)
 */
export async function getToursMetadata() {
  const allTours = await loadAllTours();
  
  // Get the most recent updatedAt from all tours
  let lastUpdated: Date | null = null;
  for (const tour of allTours) {
    const updatedAt = new Date(tour.updatedAt);
    if (!lastUpdated || updatedAt > lastUpdated) {
      lastUpdated = updatedAt;
    }
  }
  
  return {
    lastUpdated: lastUpdated?.toISOString() || null,
    totalTours: allTours.length,
    syncStatus: 'completed' as const,
  };
}
