import { ToursPageClient } from '@/components/tours/ToursPageClient';
import { fetchTours, fetchCountries, fetchToursMetadata, fetchCitiesFromAPI } from '@/actions/tours';
import { getPreferredLanguage } from '@/lib/utils/cookies';
import type { TourFilters } from '@/lib/db/repositories/tour-repository';
import type { PaginationParams } from '@/lib/db/pagination';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Tours",
  description: "Discover amazing tours from trusted providers worldwide. Browse our collection of tours and book your next adventure.",
  alternates: {
    canonical: "/tours",
  },
  openGraph: {
    title: "Tours | Travel Puzzle",
    description: "Discover amazing tours from trusted providers worldwide. Browse our collection of tours and book your next adventure.",
    url: "https://www.travelpuzzle.com.mx/tours",
  },
};

interface ToursPageProps {
  searchParams: Promise<{
    countryId?: string;
    cityId?: string;
    minPrice?: string;
    maxPrice?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function ToursPage({ searchParams }: ToursPageProps) {
  // Get language from cookies, default to 'en'
  const language = await getPreferredLanguage();
  
  // Parse URL search params
  const params = await searchParams;
  
  // Build filters from URL params
  // Default to Mexico (countryId=99) if no countryId is provided
  const filters: TourFilters = {
    language,
    countryId: params.countryId ? parseInt(params.countryId, 10) : 99,
    cityId: params.cityId ? parseInt(params.cityId, 10) : undefined,
    minPrice: params.minPrice ? parseFloat(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? parseFloat(params.maxPrice) : undefined,
  };
  
  // Build pagination from URL params
  const pagination: PaginationParams = {
    page: params.page ? parseInt(params.page, 10) : 1,
    limit: 20,
    ...(params.search && {
      searchValue: params.search,
      searchBy: ['title', 'brief', 'description'],
    }),
  };

  // Fetch initial data in parallel
  // Preload cities for Mexico (countryId=99) since it's the default country
  const [toursData, countriesData, metadata, citiesData] = await Promise.all([
    // Fetch tours with filters from URL params (or defaults)
    fetchTours(filters, pagination),
    // Fetch countries for filters
    fetchCountries(language),
    // Fetch metadata
    fetchToursMetadata(),
    // Preload cities for Mexico (countryId=99) to improve UX
    fetchCitiesFromAPI(99, language).catch(error => {
      // If cities fetch fails, return empty array (non-blocking)
      console.error('Failed to preload cities for Mexico:', error);
      return [];
    }),
  ]);

  // Format lastUpdated date on server to avoid hydration mismatch
  const localeMap: Record<string, string> = {
    en: 'en-US',
    es: 'es-ES',
    pt: 'pt-PT',
    de: 'de-DE',
    fr: 'fr-FR',
    it: 'it-IT',
  };
  const formattedLastUpdated = metadata.lastUpdated
    ? new Date(metadata.lastUpdated).toLocaleDateString(localeMap[language] || 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    : null;

  return (
    <ToursPageClient
      initialToursData={toursData}
      initialCountriesData={countriesData}
      initialMetadata={{
        ...metadata,
        lastUpdatedFormatted: formattedLastUpdated,
      }}
      initialLanguage={language}
      initialCitiesData={citiesData}
    />
  );
}
