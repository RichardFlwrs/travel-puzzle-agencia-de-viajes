import { Navbar, Footer } from "@/components/layout";
import {
  SearchBooking,
  WhyChooseTravelPuzzle,
  RecentReviews,
  TopDestinations,
  RewardsBanner
} from "@/components/home";
import { QuickSignUp } from "@/components/auth";
import { fetchCountries } from '@/actions/tours';
import { getPreferredLanguage } from '@/lib/utils/cookies';
import type { Metadata } from "next";
import type { CountryWithTranslations } from '@/types';

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "https://www.travelpuzzle.com.mx",
  },
};

export default async function Home() {
  // Get language from cookies, default to 'en'
  const language = await getPreferredLanguage();
  
  // Fetch countries on the server
  const countriesData = await fetchCountries(language);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar Component */}
      <Navbar />

      {/* Quick Sign-Up Component */}
      <QuickSignUp />

      {/* Home Page Sections */}
      <SearchBooking initialCountriesData={countriesData} initialLanguage={language} />
      <WhyChooseTravelPuzzle />
      <RewardsBanner />
      <TopDestinations />
      {/* Footer */}
      <Footer />
    </div>
  );
}
