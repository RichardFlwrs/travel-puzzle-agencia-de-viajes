import { freeTourClient, FreeTourCountry } from '@/lib/api/freetour-client';
import { TourAPI } from '@/types';
import fs from 'fs/promises';
import path from 'path';

interface SyncResult {
  success: boolean;
  toursCount: number;
  countriesCount: number;
  citiesCount: number;
  duration: number;
  error?: string;
}

// Cache countries to avoid refetching
let countriesCache: Map<number, FreeTourCountry> | null = null;

async function loadCountriesData(): Promise<Map<number, FreeTourCountry>> {
  if (countriesCache) return countriesCache;
  
  console.log('📥 Fetching countries data from API...');
  const response = await freeTourClient.fetchCountries();
  
  countriesCache = new Map(
    response.data.map((country: FreeTourCountry) => [country.id, country])
  );
  
  console.log(`✅ Loaded ${countriesCache.size} countries`);
  return countriesCache;
}

/**
 * Get country code from countryId
 */
function getCountryCode(countryId: number, countriesData: Map<number, FreeTourCountry>): string {
  const country = countriesData.get(countryId);
  return country?.shortTitle?.toLowerCase() || `c${countryId}`;
}

/**
 * Ensure tours directory exists
 */
async function ensureToursDirectory(): Promise<void> {
  const toursDir = path.join(process.cwd(), 'data', 'tours');
  try {
    await fs.access(toursDir);
  } catch {
    await fs.mkdir(toursDir, { recursive: true });
    console.log(`📁 Created tours directory: ${toursDir}`);
  }
}

/**
 * Load existing tours for a country from JSON file
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
 * Save tours for a country to JSON file
 */
async function saveCountryTours(countryCode: string, tours: TourAPI[]): Promise<void> {
  const filePath = path.join(process.cwd(), 'data', 'tours', `${countryCode}.json`);
  await fs.writeFile(filePath, JSON.stringify(tours, null, 2), 'utf-8');
}

/**
 * Load countries.json
 */
async function loadCountriesJson(): Promise<any[]> {
  const filePath = path.join(process.cwd(), 'data', 'countires.json');
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error loading countries.json:', error);
    return [];
  }
}

/**
 * Save countries.json with tour counts
 */
async function saveCountriesJson(countries: any[]): Promise<void> {
  const filePath = path.join(process.cwd(), 'data', 'countires.json');
  await fs.writeFile(filePath, JSON.stringify(countries, null, 2), 'utf-8');
}

/**
 * Update countries.json with tour counts
 */
async function updateCountriesWithTourCounts(
  countryTourCounts: Map<string, number>,
  countriesData: Map<number, FreeTourCountry>
): Promise<void> {
  const countries = await loadCountriesJson();
  
  // Create a map of countryId -> tourCount
  const countryIdToCount = new Map<number, number>();
  for (const [countryCode, count] of countryTourCounts.entries()) {
    // Find country by shortTitle
    for (const [countryId, country] of countriesData.entries()) {
      if (country.shortTitle?.toLowerCase() === countryCode.toLowerCase()) {
        countryIdToCount.set(countryId, count);
        break;
      }
    }
  }
  
  // Update countries array with tour counts
  const updatedCountries = countries.map((country: any) => {
    const tourCount = countryIdToCount.get(country.id) || 0;
    return {
      ...country,
      tourCount,
    };
  });
  
  await saveCountriesJson(updatedCountries);
  console.log(`✅ Updated countries.json with tour counts`);
}

/**
 * Sync tours from FreeTour API to JSON files
 * @param maxPages - Optional limit on pages to sync
 * @param startPage - Page to resume from (for retries)
 */
export async function syncToursFromAPI(maxPages?: number, startPage: number = 1): Promise<SyncResult> {
  const startTime = Date.now();
  console.log(`🚀 Starting incremental tour sync from FreeTour API to JSON (from page ${startPage})...`);

  // Track all synced data
  const syncedCountries = new Set<number>();
  const syncedCities = new Set<number>();
  let totalToursSynced = 0;
  let currentPage = startPage;

  // Map to store tours by country code
  const toursByCountry = new Map<string, TourAPI[]>();
  const countryTourCounts = new Map<string, number>();

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 30000; // 30 seconds

  try {
    // Ensure tours directory exists
    await ensureToursDirectory();

    // Load countries data
    const countriesData = await loadCountriesData();

    // Load existing tours from files
    console.log('📥 Loading existing tours from JSON files...');
    for (const [countryId, country] of countriesData.entries()) {
      const countryCode = getCountryCode(countryId, countriesData);
      const existingTours = await loadCountryTours(countryCode);
      if (existingTours.length > 0) {
        toursByCountry.set(countryCode, existingTours);
        countryTourCounts.set(countryCode, existingTours.length);
        syncedCountries.add(countryId);
        totalToursSynced += existingTours.length;
      }
    }
    console.log(`✅ Loaded ${totalToursSynced} existing tours from ${toursByCountry.size} countries`);

    // Fetch first page to get total pages
    console.log('📥 Fetching first page to determine total pages...');
    const firstPage = await fetchWithRetry(() => freeTourClient.fetchTours(1), 1, MAX_RETRIES, RETRY_DELAY);
    const { totalPages } = firstPage.data;
    const pagesToFetch = maxPages ? Math.min(maxPages, totalPages) : totalPages;

    console.log(`📊 Total pages to sync: ${pagesToFetch} (${firstPage.data.totalObjects} tours)`);

    // Process first page if starting from page 1
    if (startPage === 1) {
      await processTourBatch(firstPage.data.tours, toursByCountry, countriesData, syncedCountries, syncedCities);
      totalToursSynced += firstPage.data.tours.length;
      console.log(`  ✅ Page 1/${pagesToFetch} synced (${totalToursSynced} tours)`);
      currentPage = 2;
    }

    // Fetch and sync remaining pages in batches
    const CONCURRENT_PAGES = 3; // Fetch 3 pages concurrently, then sync
    const remainingPages = Array.from({ length: pagesToFetch - currentPage + 1 }, (_, i) => i + currentPage);

    for (let i = 0; i < remainingPages.length; i += CONCURRENT_PAGES) {
      const pageBatch = remainingPages.slice(i, i + CONCURRENT_PAGES);
      
      try {
        // Fetch pages concurrently with retry logic
        const pageResults = await Promise.all(
          pageBatch.map(page => fetchWithRetry(
            () => freeTourClient.fetchTours(page),
            page,
            MAX_RETRIES,
            RETRY_DELAY
          ))
        );

        // Sync each page's tours immediately
        for (let j = 0; j < pageResults.length; j++) {
          const pageData = pageResults[j].data;
          await processTourBatch(pageData.tours, toursByCountry, countriesData, syncedCountries, syncedCities);
          totalToursSynced += pageData.tours.length;
          
          currentPage = pageBatch[j];
          console.log(`  ✅ Page ${currentPage}/${pagesToFetch} synced (${totalToursSynced} tours total)`);

          // Save progress every 10 pages
          if (currentPage % 10 === 0) {
            await saveProgress(toursByCountry);
          }
        }

        // Small delay between batches
        if (i + CONCURRENT_PAGES < remainingPages.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        // Save progress before throwing
        await saveProgress(toursByCountry);
        console.error(`❌ Failed at page ${currentPage}. Progress saved. You can resume from page ${currentPage}.`);
        throw error;
      }
    }

    // Final save of all tours
    console.log('\n💾 Saving all tours to JSON files...');
    await saveProgress(toursByCountry);

    // Update countries.json with tour counts
    for (const [countryCode, tours] of toursByCountry.entries()) {
      countryTourCounts.set(countryCode, tours.length);
    }
    await updateCountriesWithTourCounts(countryTourCounts, countriesData);

    const duration = (Date.now() - startTime) / 1000;

    console.log(`\n✅ Sync completed successfully in ${duration.toFixed(2)}s`);
    console.log(`   Tours: ${totalToursSynced}`);
    console.log(`   Countries: ${syncedCountries.size}`);
    console.log(`   Cities: ${syncedCities.size}`);

    return {
      success: true,
      toursCount: totalToursSynced,
      countriesCount: syncedCountries.size,
      citiesCount: syncedCities.size,
      duration,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error('❌ Sync failed:', errorMessage);
    console.error(`📅 Failed at: ${new Date().toISOString()}`);
    console.error(`📄 Last successful page: ${currentPage - 1}`);
    console.error(`📊 Tours synced before failure: ${totalToursSynced}`);
    console.log(`\n🔄 To resume sync from page ${currentPage}, run:`);
    console.log(`   npm run sync:tours -- --start-page=${currentPage}`);

    // Save final progress
    await saveProgress(toursByCountry).catch(console.error);

    return {
      success: false,
      toursCount: totalToursSynced,
      countriesCount: syncedCountries.size,
      citiesCount: syncedCities.size,
      duration: (Date.now() - startTime) / 1000,
      error: errorMessage,
    };
  }
}

/**
 * Process a batch of tours: group by country and update maps
 */
async function processTourBatch(
  tours: TourAPI[],
  toursByCountry: Map<string, TourAPI[]>,
  countriesData: Map<number, FreeTourCountry>,
  syncedCountries: Set<number>,
  syncedCities: Set<number>
): Promise<void> {
  // Extract unique countries and cities from this batch
  const batchCountries = new Set<number>();
  const batchCities = new Set<number>();

  tours.forEach((tour) => {
    batchCountries.add(tour.countryId);
    batchCities.add(tour.cityId);
  });

  // Track new countries
  const newCountries = Array.from(batchCountries).filter(id => !syncedCountries.has(id));
  newCountries.forEach(id => syncedCountries.add(id));

  // Track new cities
  const newCities = Array.from(batchCities).filter(id => !syncedCities.has(id));
  newCities.forEach(id => syncedCities.add(id));

  // Group tours by country code
  for (const tour of tours) {
    const countryCode = getCountryCode(tour.countryId, countriesData);
    
    if (!toursByCountry.has(countryCode)) {
      toursByCountry.set(countryCode, []);
    }
    
    const countryTours = toursByCountry.get(countryCode)!;
    
    // Check if tour already exists (by externalId)
    const existingIndex = countryTours.findIndex(t => t.id === tour.id);
    if (existingIndex >= 0) {
      // Update existing tour
      countryTours[existingIndex] = tour;
    } else {
      // Add new tour
      countryTours.push(tour);
    }
  }
}

/**
 * Fetch with retry logic and exponential backoff
 */
async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  page: number,
  maxRetries: number,
  baseDelay: number
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchFn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        console.warn(
          `⚠️  Page ${page} failed (attempt ${attempt + 1}/${maxRetries + 1}): ${errorMessage}`
        );
        console.log(`   ⏳ Waiting ${delay / 1000}s before retry...`);
        console.log(`   📅 Failed at: ${new Date().toISOString()}`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `Failed to fetch page ${page} after ${maxRetries + 1} attempts: ${lastError?.message}`
  );
}

/**
 * Save all tours to JSON files
 */
async function saveProgress(toursByCountry: Map<string, TourAPI[]>): Promise<void> {
  try {
    const savePromises = Array.from(toursByCountry.entries()).map(async ([countryCode, tours]) => {
      await saveCountryTours(countryCode, tours);
    });
    
    await Promise.all(savePromises);
    console.log(`   💾 Progress saved: ${toursByCountry.size} countries`);
  } catch (error) {
    console.error('Failed to save progress:', error);
  }
}
