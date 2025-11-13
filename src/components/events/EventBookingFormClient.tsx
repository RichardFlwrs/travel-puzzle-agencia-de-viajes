'use client';

import { useState } from 'react';
import { useEventDetailFTData } from '@/lib/api/hooks';
import { EventBookingForm } from './EventBookingForm';

interface EventDetailData {
    id: number;
    isAvailable: boolean;
    minAdultsPerBooking: number;
    availableAdultPlaces: number;
    fullPricePerGroup: Record<string, number>;
    payableNowPricePerGroup: Record<string, number>;
    isPartiallyPaid: boolean;
}

interface EventBookingFormClientProps {
    eventId: string;
    language: string;
    languageDisplayName: string;
    languageFlag: string;
    date: string;
    time: string;
}

export function EventBookingFormClient({
    eventId,
    language,
    languageDisplayName,
    languageFlag,
    date,
    time,
}: EventBookingFormClientProps) {
    const { data: eventDetailFTData, isLoading, error } = useEventDetailFTData(eventId);
    const [numberOfPeople, setNumberOfPeople] = useState<number>(2);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    const eventDetailData: EventDetailData | undefined = eventDetailFTData?.data;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission here
        console.log('Form submitted:', {
            language,
            date,
            time,
            numberOfPeople,
            name,
            email,
        });
    };

    return (
        <EventBookingForm
            language={language}
            languageDisplayName={languageDisplayName}
            languageFlag={languageFlag}
            date={date}
            time={time}
            numberOfPeople={numberOfPeople}
            onNumberOfPeopleChange={setNumberOfPeople}
            name={name}
            onNameChange={setName}
            email={email}
            onEmailChange={setEmail}
            eventDetailData={eventDetailData}
            isLoading={isLoading}
            error={error}
            onSubmit={handleSubmit}
        />
    );
}

