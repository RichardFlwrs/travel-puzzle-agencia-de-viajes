'use client';

import { useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface BookingsProps {
  bookingsCount: number;
}

type BookingTab = 'upcoming' | 'past-canceled';

export function Bookings({ bookingsCount }: BookingsProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<BookingTab>('upcoming');

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t('profile.bookings_title', 'Reservaciones')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Tabs */}
        <div className="flex gap-6 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`
              pb-3 px-1 text-base font-medium transition-colors
              ${
                activeTab === 'upcoming'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            {t('profile.bookings.upcoming_tab', 'Próximas')} ({bookingsCount})
          </button>
          <button
            onClick={() => setActiveTab('past-canceled')}
            className={`
              pb-3 px-1 text-base font-medium transition-colors
              ${
                activeTab === 'past-canceled'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            {t('profile.bookings.past_canceled_tab', 'Pasadas y canceladas')} (0)
          </button>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-24 h-24 rounded-full border-2 border-gray-300 flex items-center justify-center mb-6">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {t('profile.bookings.empty_state.title', 'No hay viajes reservados... ¡aún!')}
          </h3>
          <p className="text-base text-gray-600 mb-8">
            {t('profile.bookings.empty_state.subtitle', 'No hay viajes reservados... ¡aún!')}
          </p>
          <Link href="/tours">
            <Button
              variant="success"
              size="md"
              className="bg-tp-green hover:bg-[var(--tp-green-hover)]"
            >
              {t('profile.bookings.empty_state.button', 'Encontrar cosas que hacer')}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
