// User Types
export type UserRole = 'CLIENT' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: Date;
}

// Tour Types
export type TourStatus = 'active' | 'inactive';

export interface Tour {
  id: string;
  title: string;
  description: string;
  destination: string;
  price: number;
  images: string[];
  provider: string;
  externalId: string;
  isActive: boolean;
  createdAt: Date;
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

