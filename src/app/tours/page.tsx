'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { Navbar } from '@/components/layout/Navbar';
import { TourCard } from '@/components/tours/TourCard';
import { TourFiltersPanel } from '@/components/tours/TourFiltersPanel';
import { Loading } from '@/components/ui/Loading';
import { useTours, useCountries, useCitiesFromAPI, useToursMetadata } from '@/lib/queries/tours';
import { transformDBToursToUITours, transformCountryForFilter } from '@/lib/db/tour-transformer';
import type { TourFilters } from '@/lib/db/repositories/tour-repository';
import type { PaginationParams } from '@/lib/db/pagination';

export default function ToursPage() {
  const { t, language } = useLanguage();
  const [filters, setFilters] = useState<TourFilters>({});
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 20,
  });

  // Fetch tours with filters and pagination
  const { data: toursData, isLoading: isLoadingTours } = useTours(
    { ...filters, language },
    pagination
  );

  // Fetch countries and cities for filters
  const { data: countriesData, isLoading: isLoadingCountries } = useCountries(language);
  const { data: citiesData, isLoading: isLoadingCities } = useCitiesFromAPI(filters.countryId, language);

  // Fetch metadata
  const { data: metadata } = useToursMetadata();

  // Transform data for UI
  const tours = toursData?.data ? transformDBToursToUITours(toursData.data, language) : [];
  const countries = countriesData ? countriesData.map(country => transformCountryForFilter(country, language)) : [];
  const cities = citiesData || []; // API already returns in correct format

  const handleFilterChange = (newFilters: Partial<TourFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const isLoading = isLoadingTours || isLoadingCountries || isLoadingCities;

  if (isLoading && !toursData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <Loading size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{t('tours.title')}</h1>
          <p className="text-muted-foreground">
            {toursData?.pagination.total || 0} {t('tours.subtitle')}
          </p>
          {metadata?.lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              {t('tours.lastUpdated')}: {new Date(metadata.lastUpdated).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <TourFiltersPanel
              filters={filters}
              onFilterChange={handleFilterChange}
              countries={countries}
              cities={cities}
              isLoadingCities={isLoadingCities}
            />
          </div>

          {/* Tours Grid */}
          <div className="lg:col-span-3">
            {isLoadingTours ? (
              <div className="flex justify-center py-12">
                <Loading size="md" />
              </div>
            ) : tours.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t('tours.noResults')}</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {tours.map(tour => (
                    <TourCard key={tour.id} tour={tour} />
                  ))}
                </div>

                {/* Pagination */}
                {toursData && toursData.pagination.totalPages > 1 && (
                  <div className="mt-8 flex justify-center items-center gap-4">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
                      disabled={pagination.page === 1}
                      className="px-4 py-2 border border-border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                    >
                      {t('pagination.previous')}
                    </button>

                    <span className="text-sm text-muted-foreground">
                      Page {toursData.pagination.currentPage} of {toursData.pagination.totalPages}
                    </span>

                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                      disabled={pagination.page === toursData.pagination.totalPages}
                      className="px-4 py-2 border border-border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                    >
                      {t('pagination.next')}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

