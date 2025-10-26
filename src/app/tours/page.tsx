'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/lib/language-context';
import { TourAPI } from '@/types';
import { filterTours, TourFilters, getUniqueCountries, getUniqueCities } from '@/lib/utils/tour-search';
import { convertAPITourToTour } from '@/lib/mock-data';
import { Navbar } from '@/components/layout/Navbar';
import { TourCard } from '@/components/tours/TourCard';
import { TourFiltersPanel } from '@/components/tours/TourFiltersPanel';
import { Loading } from '@/components/ui/Loading';

export default function ToursPage() {
  const { t, language } = useLanguage();
  const [allTours, setAllTours] = useState<TourAPI[]>([]);
  const [filteredTours, setFilteredTours] = useState<TourAPI[]>([]);
  const [filters, setFilters] = useState<TourFilters>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Fetch tours on mount
  useEffect(() => {
    async function fetchTours() {
      try {
        const response = await fetch('/api/tours');
        const data = await response.json();
        setAllTours(data.tours);
        setFilteredTours(data.tours);
        setLastUpdated(data.metadata.lastUpdated);
      } catch (error) {
        console.error('Failed to fetch tours:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTours();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    const filtered = filterTours(allTours, filters, language);
    setFilteredTours(filtered);
  }, [filters, allTours, language]);

  const handleFilterChange = (newFilters: TourFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Memoize countries and cities to avoid recalculation on every render
  const countries = useMemo(() => getUniqueCountries(allTours, language), [allTours, language]);
  const cities = useMemo(() => getUniqueCities(allTours, filters.countryId), [allTours, filters.countryId]);

  if (isLoading) {
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
            {filteredTours.length} {t('tours.subtitle')}
          </p>
          {lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              {t('tours.lastUpdated')}: {new Date(lastUpdated).toLocaleDateString()}
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
            />
          </div>

          {/* Tours Grid */}
          <div className="lg:col-span-3">
            {filteredTours.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t('tours.noResults')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredTours.map(apiTour => {
                  const tour = convertAPITourToTour(apiTour, language);
                  return <TourCard key={tour.id} tour={tour} />;
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

