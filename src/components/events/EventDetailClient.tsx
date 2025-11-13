'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/language-context';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { ChevronLeftIcon } from '@/assets/svg';
import { SupportedLanguage } from '@/types';
import { useEventDetailFTData } from '@/lib/api/hooks';
import { EventBookingForm } from './EventBookingForm';

interface EventDetailClientProps {
    eventId: string;
    initialLanguage: SupportedLanguage;
}

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

export function EventDetailClient({
    eventId,
    initialLanguage,
}: EventDetailClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t, language } = useLanguage();

    const { data: eventDetailFTData, isLoading: isLoadingEventDetailFTData } = useEventDetailFTData(eventId);

    // Get query params
    const eventLanguage = searchParams.get('language') || 'English';
    const eventDate = searchParams.get('date') || '';
    const eventTime = searchParams.get('time') || '';

    // Get language display name and flag
    const languageDisplayName = LANGUAGE_NAMES[eventLanguage] || eventLanguage;
    const languageFlag = LANGUAGE_FLAGS[eventLanguage] || '🌐';

    useEffect(() => {
        console.log('Event ID:', eventId);
        console.log('Event Detail Data:', eventDetailFTData);
    }, [eventId, eventDetailFTData]);

    if (isLoadingEventDetailFTData) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                    <div>Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <div className="container mx-auto px-4 py-8">
                {/* Back Button */}
                <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                    <ChevronLeftIcon className="w-4 h-4" />
                    {t('common.back')}
                </Button>

                {/* Booking Form */}
                {eventDate && eventTime && (
                    <EventBookingForm
                        language={eventLanguage}
                        languageDisplayName={languageDisplayName}
                        languageFlag={languageFlag}
                        date={eventDate}
                        time={eventTime}
                        eventDetailData={eventDetailFTData?.data}
                    />
                )}
            </div>
        </div>
    );
}

