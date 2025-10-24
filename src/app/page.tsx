'use client';

import Image from "next/image";
import { useLanguage } from "@/lib/language-context";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { getMockTours } from "@/lib/mock-data";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function Home() {
  const { t, language } = useLanguage();
  const tours = getMockTours(language);

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header */}
      <header className="border-b border-border bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">🧩 Travel Puzzle</h1>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 text-center bg-linear-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-5xl font-bold mb-6">{t('hero.title')}</h2>
          <p className="text-xl text-muted-foreground mb-8">{t('hero.subtitle')}</p>
          <div className="flex gap-4 justify-center">
            <Button size="lg">{t('hero.cta.browse')}</Button>
            <Button variant="outline" size="lg">{t('hero.cta.howItWorks')}</Button>
          </div>
        </div>
      </section>

      {/* i18n Test Section */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h3 className="text-2xl font-bold mb-6 text-center">
            ✅ i18n System Working!
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Language</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">{language.toUpperCase()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Tours</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-success">{tours.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Languages Available</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-accent">6</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Tours */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-3xl font-bold">{t('tours.featuredTitle')}</h3>
            <Button variant="outline">{t('tours.viewAll')}</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tours.map((tour) => (
              <Card key={tour.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-muted relative">
                  <Image 
                    src={tour.images[0]} 
                    alt={tour.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute top-4 right-4">
                    {tour.price === 0 ? (
                      <Badge variant="success">{t('tours.free')}</Badge>
                    ) : (
                      <Badge>{tour.currency} {tour.price}</Badge>
                    )}
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-2">{tour.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {tour.brief}
                  </p>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-muted-foreground">
                      {t('tours.duration')}: {tour.duration}
                    </span>
                    <span className="text-muted-foreground">
                      {tour.provider}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1">{t('tours.bookNow')}</Button>
                    <Button variant="outline">{t('tours.viewDetails')}</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl text-center text-sm text-muted-foreground">
          <p>{t('footer.copyright')}</p>
          <div className="flex gap-4 justify-center mt-4">
            <a href="#" className="hover:text-primary">{t('footer.about')}</a>
            <a href="#" className="hover:text-primary">{t('footer.contact')}</a>
            <a href="#" className="hover:text-primary">{t('footer.terms')}</a>
            <a href="#" className="hover:text-primary">{t('footer.privacy')}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
