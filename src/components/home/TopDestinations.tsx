'use client';

import { useLanguage } from "@/lib/language-context";

export function TopDestinations() {
  const { t } = useLanguage();

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold mb-6 text-center">
          {t('home.topDestinations.title') || 'Top Destinations'}
        </h2>
        {/* TopDestinations content will go here */}
      </div>
    </section>
  );
}

