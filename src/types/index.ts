// User Types
export type UserRole = 'CLIENT' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: Date;
}

// Multi-language support
export type SupportedLanguage = 'en' | 'es' | 'pt' | 'de' | 'fr' | 'it';

export interface MultiLangText {
  en: string;
  es: string;
  pt: string;
  de: string;
  fr: string;
  it: string;
}

export interface MultiLangURL {
  en: string;
  es: string;
  pt: string;
  de: string;
  fr: string;
  it: string;
}

// Tour Types (matching API structure)
export interface TourPrice {
  value: number;
  currency: string;
}

export interface MeetingPoint {
  title: string;
  coordinates: string;
  googlePlaceId: string;
}

export interface TourImage {
  id: number;
  URL: string;
}

export interface POI {
  id: number;
  title: string;
  googlePlaceId: string;
}

// Main Tour Interface (from API)
export interface TourAPI {
  id: number;
  updatedAt: string;
  title: MultiLangText;
  brief: MultiLangText;
  description: MultiLangText;
  providerTitle: string;
  providerPhone: string;
  URL: string;
  URLs: MultiLangURL;
  price: TourPrice;
  length: string; // Duration like "4:00" or "2:45"
  meetingPoint: MeetingPoint;
  cityId: number;
  countryId: number;
  includes: string[];
  POIs: POI[] | null;
  titleImageURL: string;
  categoryId: number;
  images: TourImage[] | null;
  videoURL: string | null;
  rating: number | null;
  reviewsNumber: number;
}

// Simplified Tour for UI (our internal format after parsing API)
export interface Tour {
  id: string;
  externalId: number; // API id
  title: string; // Current language
  brief: string; // Current language
  description: string; // Current language
  destination: string;
  provider: string;
  price: number;
  currency: string;
  images: string[];
  duration: string;
  meetingPoint: MeetingPoint;
  includes: string[];
  rating: number | null;
  reviewsNumber: number;
  bookingURL: string; // Language-specific URL
  isActive: boolean;
  createdAt?: Date;
  
  // Keep full multilang data for language switching
  _multilang?: {
    title: MultiLangText;
    brief: MultiLangText;
    description: MultiLangText;
    URLs: MultiLangURL;
  };
}

// Booking Types
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED';

export interface Booking {
  id: string;
  userId: string;
  tourId: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  externalUrl?: string | null;
  totalAmount: number;
  createdAt: Date;
}

// API Provider Types
export interface ApiProvider {
  id: string;
  name: string;
  endpoint: string;
  isActive: boolean;
  createdAt: Date;
}

// Session Types (for NextAuth)
export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
}

