import { Tour, MeetingPoint, CountryWithTranslations, CityWithTranslations, TourAPI, SupportedLanguage } from '@/types';
import type { TourWithRelations } from './repositories/tour-repository';

/**
 * Transform a database tour with relations to the UI Tour format
 * Note: Translations should already be filtered by language in the query
 */
export function transformDBTourToUITour(dbTour: TourWithRelations): Tour {
  // Get the first translation (should only be one for the requested language)
  const translation = dbTour.translations[0];
  const cityTranslation = dbTour.city.translations[0];

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
  const translation = country.translations[0];
  return {
    id: country.id,
    name: translation?.name || `Country ${country.id}`,
    count: country._count?.tours || 0,
  };
}

/**
 * Transform city from DB to UI format for filters
 */
export function transformCityForFilter(city: CityWithTranslations) {
  const translation = city.translations[0];
  return {
    id: city.id,
    name: translation?.name || `City ${city.id}`,
    count: city._count?.tours || 0,
  };
}

export function transformFTTourToUITour(ftTour: TourAPI, language: string): Tour {
  return {
    id: `ft-${ftTour.id}`,
    externalId: ftTour.id,
    title: ftTour.title[language as SupportedLanguage] || '',
    brief: ftTour.brief[language as SupportedLanguage] || '',
    description: ftTour.description[language as SupportedLanguage] || '',
    destination: ftTour.meetingPoint.title,
    provider: ftTour.providerTitle,
    providerPhone: ftTour.providerPhone,
    price: ftTour.price.value,
    currency: ftTour.price.currency,
    images: ftTour.images?.map(img => img.URL) || [],
    titleImageURL: ftTour.titleImageURL,
    duration: ftTour.length,
    meetingPoint: ftTour.meetingPoint,
    includes: ftTour.includes,
    rating: ftTour.rating,
    reviewsNumber: ftTour.reviewsNumber,
    videoURL: ftTour.videoURL,
    POIs: ftTour.POIs || [],
    bookingURL: ftTour.URLs[language as SupportedLanguage] || '',
    isActive: true,
    createdAt: new Date(),
  };
}