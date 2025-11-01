'use client';

import { useLanguage } from "@/lib/language-context";

export function SearchBooking() {
  const { t } = useLanguage();

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold mb-6 text-center">
          {t('home.searchBooking.title') || 'Search & Book Your Adventure'}
        </h2>
        {/* SearchBooking content will go here */}
      </div>
    </section>
  );
}

