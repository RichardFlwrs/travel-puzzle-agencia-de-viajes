'use client';

import { useMemo, useState } from 'react';
import { useLanguage } from "@/lib/language-context";
import { transformCountryForFilter } from '@/lib/db/tour-transformer';
import { SearchDropdown } from '@/components/forms/SearchDropdown';
import { DateRangePicker } from '@/components/forms';
import type { CountryWithTranslations } from '@/types';
import type { SupportedLanguage } from '@/types';

type CountryFilter = {
    id: number;
    name: string;
    count: number;
};

interface SearchFormPillProps {
    initialCountriesData: CountryWithTranslations[];
    initialLanguage: SupportedLanguage;
}

export function SearchFormPill({ initialCountriesData, initialLanguage }: SearchFormPillProps) {
    const { t, language } = useLanguage();

    // Transform countries data using the same logic as ToursPageClient
    // Use the language from context (which may have changed) for transformation
    const transformedCountries = useMemo(() => {
        if (!initialCountriesData) return [];
        return initialCountriesData.map(country =>
            transformCountryForFilter(country, language)
        );
    }, [initialCountriesData, language]);

    // Create a promise function that returns the transformed countries
    // This matches the pattern used in TourFiltersPanel: async () => countries
    // The promise will be called by SearchDropdown when it opens
    const getCountriesPromise = useMemo(() => {
        return async (): Promise<CountryFilter[]> => {
            // Return the transformed countries (always available from server props)
            return transformedCountries;
        };
    }, [transformedCountries]);

    const handleCountrySelect = (country: CountryFilter) => {
        console.log('Selected country:', country);
        // Handle country selection here
    };

    const [startDate, setStartDate] = useState<string | undefined>(undefined);
    const [endDate, setEndDate] = useState<string | undefined>(undefined);

    const handleDateRangeChange = (startDate: string | undefined, endDate: string | undefined) => {
        setStartDate(startDate);
        setEndDate(endDate);
    };

    return (
        <div className="v-center gap-3 bg-white/95 backdrop-blur-sm rounded-lg p-6 shadow-2xl">
            <SearchDropdown<CountryFilter>
                placeholder={t('home.searchBooking.searchPlaceholder', 'Search for a country...')}
                dataPromise={getCountriesPromise}
                renderItem={(country) => (
                    <div className="v-center-normal gap-1">
                        <span className="text-sm font-medium">{country.name}</span>
                        {country.count > 0 && (
                            <span className="text-xs text-muted-foreground">
                                {country.count} {country.count === 1 ? 'tour' : 'tours'}
                            </span>
                        )}
                    </div>
                )}
                getItemLabel={(country) => country.name}
                onSelect={handleCountrySelect}
                className="w-full"
            />

            <DateRangePicker
                placeholder={t('home.searchBooking.dateRangePlaceholder', 'Select date range')}
                startDate={startDate}
                endDate={endDate}
                onDateRangeChange={handleDateRangeChange}
            />
        </div>
    );
}