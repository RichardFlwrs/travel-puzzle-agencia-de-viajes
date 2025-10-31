import { Tour, MeetingPoint, CountryWithTranslations, CityWithTranslations } from '@/types';
import type { TourWithRelations } from './repositories/tour-repository';

/**
 * Transform a database tour with relations to the UI Tour format
 * Note: Translations should already be filtered by language in the query
 */
export function transformDBTourToUITour(dbTour: TourWithRelations): Tour {
  // Get the first translation (should only be one for the requested language)
  const translation = dbTour.TourTranslation?.[0];
  const cityTranslation = dbTour.City?.CityTranslation?.[0];

  // Parse images from JSON
  const images = Array.isArray(dbTour.images) 
    ? (dbTour.images as Array<string | { URL: string }>).map(img => typeof img === 'string' ? img : img.URL)
    : [];

  // Ensure titleImageURL is first (if it exists)
  const allImages = dbTour.titleImageURL 
    ? [dbTour.titleImageURL, ...images.filter(img => img !== dbTour.titleImageURL)]
    : images;

  // Parse meeting point
  const meetingPoint = dbTour.meetingPoint as unknown as MeetingPoint;

  // Parse includes
  const includes = Array.isArray(dbTour.includes) 
    ? (dbTour.includes as string[])
    : [];

  return {
    id: dbTour.id,
    externalId: dbTour.externalId,
    title: translation?.title || '',
    brief: translation?.brief || null,
    description: translation?.description || null,
    destination: cityTranslation?.name || `City ${dbTour.cityId}`,
    provider: dbTour.providerTitle,
    providerPhone: dbTour.providerPhone,
    price: Number(dbTour.priceValue),
    currency: dbTour.priceCurrency,
    images: allImages,
    titleImageURL: dbTour.titleImageURL,
    duration: dbTour.duration,
    meetingPoint,
    includes,
    rating: dbTour.rating ? Number(dbTour.rating) : null,
    reviewsNumber: dbTour.reviewsNumber,
    bookingURL: translation?.url || '',
    isActive: dbTour.isActive,
    createdAt: dbTour.createdAt,
  };
}

/**
 * Transform multiple DB tours to UI tours
 * Note: Translations should already be filtered by language in the query
 */
export function transformDBToursToUITours(dbTours: TourWithRelations[]): Tour[] {
  return dbTours.map(tour => transformDBTourToUITour(tour));
}

/**
 * Transform country from DB to UI format for filters
 */
export function transformCountryForFilter(country: CountryWithTranslations) {
  // Handle both old format (translations array) and new format (CountryTranslation array)
  const translations = (country as any).CountryTranslation || country.translations;
  const translation = translations?.[0];
  return {
    id: country.id,
    name: translation?.name || `Country ${country.id}`,
    // Handle both old format (_count.tours) and new format (_count.Tour)
    count: (country._count as any)?.Tour || country._count?.tours || 0,
  };
}

/**
 * Transform city from DB to UI format for filters
 */
export function transformCityForFilter(city: CityWithTranslations) {
  // Handle both old format (translations array) and new format (CityTranslation array)
  const translations = (city as any).CityTranslation || city.translations;
  const translation = translations?.[0];
  return {
    id: city.id,
    name: translation?.name || `City ${city.id}`,
    // Handle both old format (_count.tours) and new format (_count.Tour)
    count: (city._count as any)?.Tour || city._count?.tours || 0,
  };
}

