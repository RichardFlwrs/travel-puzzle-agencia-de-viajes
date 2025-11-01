import { Navbar, Footer } from "@/components/layout";
import {
  SearchBooking,
  WhyChooseTravelPuzzle,
  RecentReviews,
  TopDestinations
} from "@/components/home";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar Component */}
      <Navbar />

      {/* Home Page Sections */}
      <SearchBooking />
      <WhyChooseTravelPuzzle />
      <RecentReviews />
      <TopDestinations />

      {/* Footer */}
      <Footer />
    </div>
  );
}
