'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/language-context';
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon } from '@/assets/svg';
import { TourEvent } from '@/lib/api/freetour-client';
import { EventsService } from '@/lib/services/events-service';
import { useStoreSelectedDatesLS } from './hooks/useStoreSelectedDatesLS';
import { LS_KEYS } from '@/globals';
import { ILSSelectedDate } from '@/types/ILocalStorageTypes';

interface TourAvailabilityCalendarProps {
    events: TourEvent[];
    tourId: string;
}

const DAYS_OF_WEEK = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const LANGUAGE_FLAGS: Record<string, string> = {
    'English': '🇬🇧',
    'Spanish': '🇪🇸',
    'Portuguese': '🇵🇹',
    'German': '🇩🇪',
    'French': '🇫🇷',
    'Italian': '🇮🇹',
};

const LANGUAGE_NAMES: Record<string, string> = {
    'English': 'Inglés',
    'Spanish': 'Español',
    'Portuguese': 'Portugués',
    'German': 'Alemán',
    'French': 'Francés',
    'Italian': 'Italiano',
};

export function TourAvailabilityCalendar({ events, tourId }: TourAvailabilityCalendarProps) {
    const router = useRouter();
    const { t, language } = useLanguage();
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const hasLoadedFromLS = useRef(false);
    const loadedDateFromLS = useRef(false);
    const isUserInteraction = useRef(false);
    const isInitialized = useRef(false);

    // Group events by date
    const eventsByDate = useMemo(() => {
        return EventsService.groupEventsByDate(events);
    }, [events]);

    // Get available dates (dates that have events)
    const availableDates = useMemo(() => {
        return Object.keys(eventsByDate).sort();
    }, [eventsByDate]);

    // Reset flags when tourId changes
    useEffect(() => {
        hasLoadedFromLS.current = false;
        loadedDateFromLS.current = false;
        isUserInteraction.current = false;
        isInitialized.current = false;
    }, [tourId]);

    // Load selected date from localStorage on mount (after availableDates is ready)
    useEffect(() => {
        // Only load once when availableDates is ready and we haven't loaded yet
        if (availableDates.length > 0 && !hasLoadedFromLS.current) {
            try {
                const stored = localStorage.getItem(LS_KEYS.selectedDates);
                if (stored) {
                    const parsed: ILSSelectedDate | null = JSON.parse(stored);
                    // Only use stored date if it matches the current tourId, is not null, and exists in available dates
                    if (parsed && parsed.tourId === tourId && parsed.date && availableDates.includes(parsed.date)) {
                        // Set both state updates together to ensure they're in sync
                        const dateObj = new Date(parsed.date + 'T00:00:00');
                        setCurrentMonth(dateObj);
                        setSelectedDate(parsed.date);
                        loadedDateFromLS.current = true;
                        // Mark as initialized since we loaded a date
                        isInitialized.current = true;
                    }
                }
            } catch (error) {
                console.error('Error loading selected date from localStorage:', error);
            }
            // Mark as attempted even if no valid date was found
            hasLoadedFromLS.current = true;
        }
    }, [tourId, availableDates]);

    // Get dates for current month view (full calendar grid)
    const monthDates = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        // Adjust start day (Monday = 0, Sunday = 6)
        const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

        const dates: Array<{ date: number; fullDate: string; hasEvents: boolean }> = [];

        // Add empty cells for days before month starts
        for (let i = 0; i < adjustedStartDay; i++) {
            dates.push({ date: 0, fullDate: '', hasEvents: false });
        }

        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dates.push({
                date: day,
                fullDate: dateStr,
                hasEvents: availableDates.includes(dateStr),
            });
        }

        return dates;
    }, [currentMonth, availableDates]);

    // Get events for selected date
    const selectedDateEvents = useMemo(() => {
        if (!selectedDate) return [];
        return eventsByDate[selectedDate] || [];
    }, [selectedDate, eventsByDate]);

    // Group events by language for selected date
    const eventsByLanguage = useMemo(() => {
        const grouped: Record<string, TourEvent[]> = {};
        selectedDateEvents.forEach(event => {
            if (!grouped[event.language]) {
                grouped[event.language] = [];
            }
            grouped[event.language].push(event);
        });
        return grouped;
    }, [selectedDateEvents]);

    // Format time from date string
    const formatTime = (dateStr: string): string => {
        const timePart = dateStr.split(' ')[1];
        if (!timePart) return '';
        const [hours, minutes] = timePart.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    // Format date for display
    const formatDateDisplay = (dateStr: string): string => {
        const date = new Date(dateStr + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dateOnly = new Date(date);
        dateOnly.setHours(0, 0, 0, 0);

        if (dateOnly.getTime() === today.getTime()) {
            return `Hoy, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
        }
        return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
    };

    // Navigate months
    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentMonth(prev => {
            const newDate = new Date(prev);
            if (direction === 'prev') {
                newDate.setMonth(prev.getMonth() - 1);
            } else {
                newDate.setMonth(prev.getMonth() + 1);
            }
            return newDate;
        });
    };

    // Auto-select first available date if none selected (only after localStorage load attempt)
    // Only run if we didn't load a date from localStorage
    useEffect(() => {
        // Only auto-select if we've attempted to load from LS, no date is selected, we didn't load from LS, and dates are available
        if (hasLoadedFromLS.current && !selectedDate && !loadedDateFromLS.current && availableDates.length > 0) {
            setSelectedDate(availableDates[0]);
            // Mark as initialized after auto-select
            isInitialized.current = true;
        } else if (hasLoadedFromLS.current && selectedDate && !isInitialized.current) {
            // Mark as initialized if we have a date but haven't initialized yet (shouldn't happen, but safety check)
            isInitialized.current = true;
        }
    }, [availableDates, selectedDate]);

    // Store selected date in localStorage when it changes (only after initialization and user interaction)
    // Don't save auto-selected dates on initial mount
    const selectedDateForLS: ILSSelectedDate | null = selectedDate && isInitialized.current && isUserInteraction.current
        ? { date: selectedDate, tourId }
        : null;
    useStoreSelectedDatesLS(selectedDateForLS);

    const currentMonthName = MONTHS[currentMonth.getMonth()];
    const currentYear = currentMonth.getFullYear();

    return (
        <div className="space-y-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigateMonth('prev')}
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                    aria-label="Previous month"
                >
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-full">
                    <span className="font-medium text-sm">
                        {currentMonthName} {currentYear}
                    </span>
                </div>

                <button
                    onClick={() => navigateMonth('next')}
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                    aria-label="Next month"
                >
                    <ChevronRightIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS_OF_WEEK.map((day, index) => (
                    <div
                        key={index}
                        className="text-center text-xs font-medium text-muted-foreground py-2"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
                {monthDates.map((dateInfo, index) => {
                    if (dateInfo.date === 0) {
                        return <div key={index} className="aspect-square" />;
                    }

                    const isSelected = selectedDate === dateInfo.fullDate;
                    const hasEvents = dateInfo.hasEvents;

                    const handleDateClick = () => {
                        if (hasEvents) {
                            isUserInteraction.current = true;
                            setSelectedDate(dateInfo.fullDate);
                        }
                    };

                    return (
                        <button
                            key={index}
                            onClick={handleDateClick}
                            disabled={!hasEvents}
                            className={`
                                aspect-square rounded-full text-sm font-medium transition-all
                                ${isSelected
                                    ? 'bg-tp-blue-primary text-white'
                                    : hasEvents
                                        ? 'bg-muted text-foreground hover:bg-tp-blue-primary/10 border-b-2 border-tp-blue-primary cursor-pointer'
                                        : 'text-muted-foreground/30 cursor-not-allowed'
                                }
                            `}
                        >
                            {dateInfo.date}
                        </button>
                    );
                })}
            </div>

            {/* Divider */}
            <div className="border-t my-4" />

            {/* Selected Date Display */}
            {selectedDate && (
                <>
                    <div className="text-sm font-medium mb-4">
                        {formatDateDisplay(selectedDate)}
                    </div>

                    {/* Languages and Times */}
                    <div className="space-y-4">
                        {Object.entries(eventsByLanguage).map(([lang, langEvents]) => (
                            <div key={lang} className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{LANGUAGE_FLAGS[lang] || '🌐'}</span>
                                    <span className="text-sm font-medium">
                                        {LANGUAGE_NAMES[lang] || lang}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <ClockIcon className="w-4 h-4 text-muted-foreground" />
                                    {langEvents.map((event, idx) => (
                                        <button
                                            key={event.id}
                                            onClick={() => router.push(`/events/${event.id}?language=${encodeURIComponent(lang)}&date=${encodeURIComponent(selectedDate)}&time=${encodeURIComponent(formatTime(event.date))}`)}
                                            className="px-3 py-1.5 bg-muted rounded-full text-sm font-medium hover:bg-tp-blue-primary/10 transition-colors cursor-pointer"
                                        >
                                            {formatTime(event.date)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Divider */}
            <div className="border-t my-4" />
        </div>
    );
}

