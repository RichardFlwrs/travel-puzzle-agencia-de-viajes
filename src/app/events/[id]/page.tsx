import { notFound } from 'next/navigation';
import { EventDetailClient } from '@/components/events/EventDetailClient';
import { getPreferredLanguage } from '@/lib/utils/cookies';

interface EventDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
    // Get language from cookies, default to 'en'
    const language = await getPreferredLanguage();

    // Get event ID from params
    const { id } = await params;
    const eventId = id;

    if (!eventId) {
        notFound();
    }

    return (
        <EventDetailClient
            eventId={eventId}
            initialLanguage={language}
        />
    );
}

