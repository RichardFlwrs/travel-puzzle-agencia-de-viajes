'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/language-context';
import { Navbar } from '@/components/layout/Navbar';
import { TourCard } from '@/components/tours/TourCard';
import { TourFiltersPanel } from '@/components/tours/TourFiltersPanel';
import { TourGridSkeleton } from '@/components/tours/TourGridSkeleton';
import { useTours, useCitiesFromAPI } from '@/lib/queries/tours';
import { transformDBToursToUITours, transformCountryForFilter } from '@/lib/db/tour-transformer';
import type { TourFilters as RepositoryTourFilters } from '@/lib/db/repositories/tour-repository';
import type { TourFilters as UITourFilters } from '@/lib/utils/tour-search';
import type { PaginationParams, PaginatedResponse } from '@/lib/db/pagination';
import type { TourWithRelations } from '@/lib/db/repositories/tour-repository';
import type { CountryWithTranslations } from '@/types';
import { SupportedLanguage } from '@/types';

interface ToursPageClientProps {
    initialToursData: PaginatedResponse<TourWithRelations>;
    initialCountriesData: CountryWithTranslations[];
    initialMetadata: {
        lastUpdated: string | null;
        lastUpdatedFormatted: string | null;
        totalTours: number;
        syncStatus: string;
    };
    initialLanguage: SupportedLanguage;
}

export function ToursPageClient({
    initialToursData,
    initialCountriesData,
    initialMetadata,
    initialLanguage,
}: ToursPageClientProps) {
    const { t, language } = useLanguage();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Parse filters and pagination from URL params
    const parseUrlParams = useCallback(() => {
        const filters: UITourFilters = {};
        const pagination: PaginationParams = {
            page: 1,
            limit: 20,
        };

        // Parse filters from URL
        const countryId = searchParams.get('countryId');
        const cityId = searchParams.get('cityId');
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const search = searchParams.get('search');
        const page = searchParams.get('page');

        // Default to Mexico (countryId=99) if no countryId is provided
        filters.countryId = countryId ? parseInt(countryId, 10) : 99;
        if (cityId) filters.cityId = parseInt(cityId, 10);
        if (minPrice) filters.minPrice = parseFloat(minPrice);
        if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
        if (search) filters.search = search;
        if (page) pagination.page = parseInt(page, 10);

        return { filters, pagination };
    }, [searchParams]);

    // Initialize state from URL params (only on mount)
    const [uiFilters, setUiFilters] = useState<UITourFilters>(() => {
        const { filters } = parseUrlParams();
        return filters;
    });
    const [pagination, setPagination] = useState<PaginationParams>(() => {
        const { pagination: pag } = parseUrlParams();
        return pag;
    });

    // Sync UI filters and pagination from URL when language changes (to keep UI state in sync)
    // This ensures the filter panel and pagination show correct values even after language change
    useEffect(() => {
        // Skip on initial mount (handled by useState initializer)
        if (isInitialMount.current) {
            return;
        }
        
        const { filters: urlFilters, pagination: urlPagination } = parseUrlParams();
        
        // Always sync from URL when language changes to ensure filters and pagination are preserved
        // The URL is the source of truth
        setUiFilters(prev => {
            // Only update if values actually differ to avoid unnecessary re-renders
            if (
                urlFilters.countryId !== prev.countryId ||
                urlFilters.cityId !== prev.cityId ||
                urlFilters.minPrice !== prev.minPrice ||
                urlFilters.maxPrice !== prev.maxPrice ||
                urlFilters.search !== prev.search
            ) {
                previousFiltersRef.current = urlFilters;
                return urlFilters;
            }
            return prev;
        });
        
        setPagination(prev => {
            // Only update if page actually differs to avoid unnecessary re-renders
            if (urlPagination.page !== prev.page) {
                previousPaginationRef.current = urlPagination;
                return urlPagination;
            }
            return prev;
        });
    }, [language, parseUrlParams]); // Re-sync when language changes to preserve filters and pagination

    // Convert UI filters to repository filters
    // Always read critical filters from URL as source of truth to prevent losing them on language change
    // This ensures filters are preserved even when language changes and component re-renders
    const urlCityId = searchParams.get('cityId') ? parseInt(searchParams.get('cityId')!, 10) : undefined;
    const urlCountryId = searchParams.get('countryId') ? parseInt(searchParams.get('countryId')!, 10) : 99;
    const urlMinPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const urlMaxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    
    const repositoryFilters: RepositoryTourFilters = {
        language,
        // Use URL values as source of truth, fallback to uiFilters for state consistency
        countryId: urlCountryId ?? uiFilters.countryId,
        cityId: urlCityId ?? uiFilters.cityId,
        minPrice: urlMinPrice ?? uiFilters.minPrice,
        maxPrice: urlMaxPrice ?? uiFilters.maxPrice,
    };

    // Read page from URL as source of truth (same approach as filters)
    const urlPage = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;
    const urlSearch = searchParams.get('search') || undefined;
    
    // Build pagination with search if provided
    // Use URL values as source of truth, fallback to state for consistency
    const paginationWithSearch: PaginationParams = {
        page: urlPage ?? pagination.page ?? 1,
        limit: pagination.limit ?? 20,
        ...(urlSearch ?? uiFilters.search ? {
            searchValue: urlSearch ?? uiFilters.search,
            searchBy: ['title', 'brief', 'description'],
        } : {}),
    };

    // Check if we should use initial data
    // The server component fetches data based on URL params, so initialData should match
    // React Query will use initialData if the query key matches (filters + pagination)
    const hasFilters =
        Object.keys(uiFilters).length > 0 || pagination.page !== 1 || !!uiFilters.search;

    // Check if current filters/pagination match what was fetched on server
    // The server component reads URL params, so if URL has params, initialData matches those params
    // We need to check if current state matches the initial server-fetched data
    const serverFilters = {
        countryId: searchParams.get('countryId') ? parseInt(searchParams.get('countryId')!, 10) : 99, // Default to 99 (Mexico)
        cityId: searchParams.get('cityId') ? parseInt(searchParams.get('cityId')!, 10) : undefined,
        minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
        maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
    };
    const serverPage = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;
    const serverSearch = searchParams.get('search') || undefined;
    
    const matchesInitialData = 
        repositoryFilters.countryId === serverFilters.countryId &&
        repositoryFilters.cityId === serverFilters.cityId &&
        repositoryFilters.minPrice === serverFilters.minPrice &&
        repositoryFilters.maxPrice === serverFilters.maxPrice &&
        paginationWithSearch.searchValue === serverSearch &&
        paginationWithSearch.page === serverPage &&
        language === initialLanguage;

    // Fetch tours with filters and pagination
    // Only pass initialData if query key matches (no filters, page 1, same language)
    // This prevents React Query from using stale initialData when filters change
    const { data: toursData, isLoading: isLoadingTours } = useTours(
        repositoryFilters,
        paginationWithSearch,
        {
            initialData: matchesInitialData ? initialToursData : undefined,
        }
    );

    // Use fetched data (React Query will use initialData if available)
    const currentToursData = toursData;

    // Fetch cities for filters (only when country is selected)
    const { data: citiesData, isLoading: isLoadingCities } = useCitiesFromAPI(uiFilters.countryId, language);

    // Transform data for UI
    const tours = currentToursData?.data
        ? transformDBToursToUITours(currentToursData.data, language)
        : [];
    const countries = initialCountriesData.map(country =>
        transformCountryForFilter(country, language)
    );
    const cities = citiesData || []; // API already returns in correct format

    // Update URL params when filters or pagination change
    const updateUrlParams = useCallback(
        (filters: UITourFilters, pagination: PaginationParams) => {
            const params = new URLSearchParams();

            // Add filter params
            // countryId is now always required (defaults to 99 for Mexico)
            if (filters.countryId !== undefined) {
                params.set('countryId', filters.countryId.toString());
            }
            if (filters.cityId) params.set('cityId', filters.cityId.toString());
            if (filters.minPrice !== undefined) params.set('minPrice', filters.minPrice.toString());
            if (filters.maxPrice !== undefined) params.set('maxPrice', filters.maxPrice.toString());
            if (filters.search) params.set('search', filters.search);

            // Add pagination params (only if not page 1)
            if (pagination.page && pagination.page > 1) {
                params.set('page', pagination.page.toString());
            }

            // Update URL without causing a page reload
            const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
            router.replace(newUrl, { scroll: false });
        },
        [pathname, router]
    );

    // Track if we're updating from URL (to prevent loops)
    const isUpdatingFromUrl = useRef(false);
    const isInitialMount = useRef(true);
    const previousUrlParams = useRef<string>('');
    const previousFiltersRef = useRef<UITourFilters>(uiFilters);
    const previousPaginationRef = useRef<PaginationParams>(pagination);

    // Sync URL when filters or pagination change (but not on initial mount or when updating from URL)
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            // On initial mount, ensure URL has countryId=99 if it's missing
            if (!searchParams.get('countryId')) {
                updateUrlParams(uiFilters, pagination);
            }
            // Store initial URL params and state
            previousUrlParams.current = searchParams.toString();
            previousFiltersRef.current = uiFilters;
            previousPaginationRef.current = pagination;
            return;
        }
        
        // Don't update URL if we're currently syncing from URL changes
        if (isUpdatingFromUrl.current) {
            return;
        }
        
        // Only update URL if filters or pagination actually changed
        const filtersChanged = 
            previousFiltersRef.current.countryId !== uiFilters.countryId ||
            previousFiltersRef.current.cityId !== uiFilters.cityId ||
            previousFiltersRef.current.minPrice !== uiFilters.minPrice ||
            previousFiltersRef.current.maxPrice !== uiFilters.maxPrice ||
            previousFiltersRef.current.search !== uiFilters.search;
        
        const paginationChanged = previousPaginationRef.current.page !== pagination.page;

        if (filtersChanged || paginationChanged) {
            previousFiltersRef.current = uiFilters;
            previousPaginationRef.current = pagination;
            
            // Build the expected URL params string to track what we're setting
            const params = new URLSearchParams();
            if (uiFilters.countryId !== undefined) {
                params.set('countryId', uiFilters.countryId.toString());
            }
            if (uiFilters.cityId) params.set('cityId', uiFilters.cityId.toString());
            if (uiFilters.minPrice !== undefined) params.set('minPrice', uiFilters.minPrice.toString());
            if (uiFilters.maxPrice !== undefined) params.set('maxPrice', uiFilters.maxPrice.toString());
            if (uiFilters.search) params.set('search', uiFilters.search);
            if (pagination.page && pagination.page > 1) {
                params.set('page', pagination.page.toString());
            }
            const expectedUrlParams = params.toString();
            
            // Update the URL ref to track what we expect the URL to be
            previousUrlParams.current = expectedUrlParams;
            
            updateUrlParams(uiFilters, pagination);
        }
    }, [uiFilters, pagination, updateUrlParams]);

    // Update state when URL params change (e.g., browser back/forward)
    useEffect(() => {
        const currentUrlParams = searchParams.toString();
        
        // Skip if URL hasn't actually changed (prevents unnecessary re-runs)
        if (currentUrlParams === previousUrlParams.current) {
            return;
        }
        
        // Don't process if we're currently updating from state (to prevent loops)
        if (isUpdatingFromUrl.current) {
            // We're in the middle of a state update, skip this URL change
            return;
        }
        
        const { filters: urlFilters, pagination: urlPagination } = parseUrlParams();
        
        // Helper function to compare values (handles undefined/null)
        const valuesEqual = (a: any, b: any): boolean => {
            if (a === undefined && b === undefined) return true;
            if (a === undefined || b === undefined) return false;
            return a === b;
        };
        
        // Check if URL params match current state (meaning state caused the URL change)
        const urlMatchesState = 
            valuesEqual(urlFilters.countryId, previousFiltersRef.current.countryId) &&
            valuesEqual(urlFilters.cityId, previousFiltersRef.current.cityId) &&
            valuesEqual(urlFilters.minPrice, previousFiltersRef.current.minPrice) &&
            valuesEqual(urlFilters.maxPrice, previousFiltersRef.current.maxPrice) &&
            valuesEqual(urlFilters.search, previousFiltersRef.current.search) &&
            urlPagination.page === previousPaginationRef.current.page;
        
        // If URL matches current state, this was our update, so just update the ref and skip
        if (urlMatchesState) {
            previousUrlParams.current = currentUrlParams;
            return;
        }
        
        // URL doesn't match state, so this is a user action (browser navigation)
        // Update the ref to track current URL
        previousUrlParams.current = currentUrlParams;
        
        // Compare with current state using refs to avoid stale closures
        const filtersChanged = 
            !valuesEqual(urlFilters.countryId, previousFiltersRef.current.countryId) ||
            !valuesEqual(urlFilters.cityId, previousFiltersRef.current.cityId) ||
            !valuesEqual(urlFilters.minPrice, previousFiltersRef.current.minPrice) ||
            !valuesEqual(urlFilters.maxPrice, previousFiltersRef.current.maxPrice) ||
            !valuesEqual(urlFilters.search, previousFiltersRef.current.search);
        
        const paginationChanged = urlPagination.page !== previousPaginationRef.current.page;

        if (filtersChanged || paginationChanged) {
            isUpdatingFromUrl.current = true;
            setUiFilters(urlFilters);
            setPagination(urlPagination);
            // Update refs immediately
            previousFiltersRef.current = urlFilters;
            previousPaginationRef.current = urlPagination;
            // Reset flag after state update completes
            requestAnimationFrame(() => {
                isUpdatingFromUrl.current = false;
            });
        }
    }, [searchParams, parseUrlParams]);

    const handleFilterChange = (newFilters: Partial<UITourFilters>) => {
        setUiFilters(prev => ({ ...prev, ...newFilters }));
        // Reset to page 1 when filters change
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handlePaginationChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">{t('tours.title')}</h1>
                    <p className="text-muted-foreground">
                        {currentToursData?.pagination.total || 0} {t('tours.subtitle')}
                    </p>
                    {initialMetadata?.lastUpdatedFormatted && (
                        <p className="text-xs text-muted-foreground mt-1">
                            {t('tours.lastUpdated')}: {initialMetadata.lastUpdatedFormatted}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Filters Sidebar */}
                    <div className="lg:col-span-1">
                        <TourFiltersPanel
                            filters={uiFilters}
                            onFilterChange={handleFilterChange}
                            countries={countries}
                            cities={cities}
                            isLoadingCities={isLoadingCities}
                        />
                    </div>

                    {/* Tours Grid */}
                    <div className="lg:col-span-3">
                        {isLoadingTours ? (
                            <TourGridSkeleton count={6} />
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
                                {currentToursData && currentToursData.pagination.totalPages > 1 && (
                                    <div className="mt-8 flex justify-center items-center gap-4">
                                        <button
                                            onClick={() =>
                                                handlePaginationChange(Math.max(1, (pagination.page || 1) - 1))
                                            }
                                            disabled={pagination.page === 1}
                                            className="px-4 py-2 border border-border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                                        >
                                            {t('pagination.previous')}
                                        </button>

                                        <span className="text-sm text-muted-foreground">
                                            Page {currentToursData.pagination.currentPage} of{' '}
                                            {currentToursData.pagination.totalPages}
                                        </span>

                                        <button
                                            onClick={() =>
                                                handlePaginationChange((pagination.page || 1) + 1)
                                            }
                                            disabled={pagination.page === currentToursData.pagination.totalPages}
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

