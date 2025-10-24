<!-- d773e1c1-467d-4ab3-b5d5-479036cbbfa9 49e941b7-a883-48f0-9b9e-4b3b6854d8af -->
# Travel Booking Platform - Next.js Architecture

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: MySQL with Prisma ORM (cPanel/Namecheap hosting compatible)
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Styling**: Tailwind CSS
- **State Management**: React Context + Zustand (for complex state)
- **API Integration**: Server Actions + API Routes
- **Payment**: Stripe (future integration ready)

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── (auth)/          # Auth-related pages (login, signup)
│   │   ├── (client)/         # Client-facing pages
│   │   │   ├── page.tsx      # Home/landing
│   │   │   ├── tours/        # Browse tours
│   │   │   ├── bookings/     # User booking history
│   │   │   └── profile/      # User profile
│   │   ├── (admin)/          # Admin dashboard
│   │   │   ├── dashboard/
│   │   │   ├── tours/        # Tour management
│   │   │   ├── bookings/     # All bookings
│   │   │   ├── users/        # User management
│   │   │   └── api-config/   # Third-party API management
│   │   ├── api/              # API routes
│   │   │   ├── auth/
│   │   │   ├── tours/
│   │   │   ├── bookings/
│   │   │   └── external/     # Third-party API proxy
│   │   └── layout.tsx
│   ├── components/
│   │   ├── client/           # Client UI components
│   │   ├── admin/            # Admin UI components
│   │   └── shared/           # Shared components
│   ├── lib/
│   │   ├── prisma.ts         # Prisma client
│   │   ├── auth.ts           # Auth config
│   │   └── api-integrations/ # Third-party API clients
│   └── types/
├── prisma/
│   └── schema.prisma
└── package.json
```

## Database Schema (Key Models)

**Note**: Using MySQL with Prisma. The schema below uses MySQL-compatible syntax.

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   @db.VarChar(255)
  name      String?  @db.VarChar(255)
  role      Role     @default(CLIENT)
  bookings  Booking[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Tour {
  id          String   @id @default(cuid())
  title       String   @db.VarChar(255)
  description String   @db.Text
  destination String   @db.VarChar(255)
  provider    String   @db.VarChar(100)
  externalId  String   @db.VarChar(255)
  price       Decimal  @db.Decimal(10, 2)
  images      String   @db.Text  // JSON array stored as text
  bookings    Booking[]
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Booking {
  id            String        @id @default(cuid())
  userId        String
  user          User          @relation(fields: [userId], references: [id])
  tourId        String
  tour          Tour          @relation(fields: [tourId], references: [id])
  status        BookingStatus @default(PENDING)
  paymentStatus PaymentStatus @default(PENDING)
  totalAmount   Decimal       @db.Decimal(10, 2)
  externalUrl   String?       @db.VarChar(500)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([userId])
  @@index([tourId])
}

model ApiProvider {
  id          String   @id @default(cuid())
  name        String   @unique @db.VarChar(100)
  apiKey      String   @db.Text
  apiSecret   String?  @db.Text
  endpoint    String   @db.VarChar(500)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum Role {
  CLIENT
  ADMIN
}

enum BookingStatus {
  PENDING
  CONFIRMED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  PAID
  REFUNDED
}
```

## Core Features Implementation

### 1. Authentication System

- NextAuth.js with credentials provider + JWT
- Role-based access control (CLIENT vs ADMIN)
- Protected routes with middleware
- Session management

### 2. Client-Side Features

- **Landing Page**: Hero section, featured destinations, search
- **Tour Listing**: Filter by destination, price, dates, provider
- **Tour Details**: Full description, itinerary, booking button
- **Booking Flow**: 
  - Select tour → Confirm details → Create booking record → Redirect to provider
  - Save booking in DB with "PENDING" status
- **User Dashboard**: View booking history, profile management

### 3. Admin Panel

- **Dashboard**: Analytics (total bookings, revenue, active tours)
- **API Provider Management**: 
  - Add/edit/delete third-party API credentials
  - Test API connections
  - View API usage stats
- **Tour Management**:
  - Fetch tours from third-party APIs
  - Add/edit/delete tours manually
  - Bulk import tours
  - Enable/disable tours
- **Booking Management**: View all bookings, update statuses
- **User Management**: View users, manage roles

### 4. Third-Party API Integration

- **API Abstraction Layer**: Create unified interface for different providers
- **API Proxy Routes**: Hide API keys, handle rate limiting
- **Caching Strategy**: Cache tour data (Redis optional)
- **Error Handling**: Graceful fallbacks when APIs fail
- **Webhook Support**: Receive booking confirmations from providers

### 5. Security Measures

- Encrypted API keys in database
- Server-side API calls only (no exposed keys)
- CSRF protection
- Input validation (Zod schemas)
- Rate limiting on API routes

## Development Phases

### Phase 1: Foundation Setup
**Status**: [⏳] In Progress (70% Complete)

**Detailed Plan**: See `plans/phase-1-foundation-setup.plan.md` for step-by-step implementation guide

**High-Level Objectives**:
- Initialize Next.js 14+ project with TypeScript and Tailwind CSS
- Set up Prisma ORM with MySQL database (cPanel/Namecheap compatible)
- Configure NextAuth.js v5 with role-based authentication (CLIENT/ADMIN)
- Create project structure (routes, components, lib folders)
- Implement authentication pages (login/signup)
- Create base UI components and layouts (Navbar, Footer)
- Build initial landing page with hero section
- Set up environment variables and Git repository

### Phase 2: Initial Layout & Navigation
**Status**: [ ] Not Started

**Detailed Plan**: See `plans/phase-2-initial-layout.plan.md` for complete implementation guide

**High-Level Objectives**:
- Create navigation structure based on user journey (happy path)
- Build Navbar component with auth-aware navigation
- Build Footer component with all links
- Create landing page with hero, featured tours, and how it works sections
- Implement tour listing and detail pages
- Create login and signup pages
- Build user dashboard (My Bookings, Profile)
- Set up route protection middleware

### Phase 3: Admin Panel

- Admin dashboard layout
- API provider CRUD operations
- Tour management interface
- Manual tour creation/editing

### Phase 4: API Integration

- Create API abstraction layer
- Implement provider-specific clients (start with 1-2 providers)
- Build tour sync functionality
- Add webhook handlers

### Phase 5: Advanced Features

- Search and advanced filtering
- Booking status tracking
- Email notifications
- Analytics and reporting

### Phase 6: Payment Integration (Future)

- Stripe integration
- Payment processing flow
- Refund handling
- Invoice generation

## Key Third-Party Services to Consider

- **Tour Providers**: Viator, GetYourGuide, TourRadar APIs
- **Database**: MySQL via cPanel (Namecheap hosting) - Local dev: MySQL or use PlanetScale (MySQL compatible)
- **Email**: Resend or SendGrid
- **File Storage**: Vercel Blob, Cloudflare R2, or cPanel file storage (for tour images)
- **Deployment**: Namecheap cPanel (production) - Vercel (optional for staging)

## Environment Variables Needed

```
DATABASE_URL
NEXTAUTH_SECRET
NEXTAUTH_URL
# Third-party API keys (stored in DB, not env)
```

## Initial Dependencies

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@prisma/client": "^5.0.0",
    "next-auth": "^5.0.0-beta",
    "zod": "^3.22.0",
    "tailwindcss": "^3.4.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "typescript": "^5.4.0",
    "prisma": "^5.0.0"
  }
}
```

## Next Steps After Setup

1. Identify 2-3 specific tour provider APIs to integrate
2. Design UI/UX mockups for key pages
3. Set up MySQL database (local: MAMP/XAMPP, or cPanel remote database)
4. Configure DATABASE_URL for MySQL connection
5. Begin Phase 1 implementation

### To-dos

- [✅] Initialize Next.js 14+ project with TypeScript, Tailwind, and project structure
- [✅] Set up Prisma with MySQL and create initial schema (User, Tour, Booking, ApiProvider models)
- [ ] Configure NextAuth.js v5 with role-based authentication (CLIENT/ADMIN)
- [ ] Create login, signup, and protected route middleware
- [ ] Create root layout, client layout, and admin layout with navigation
- [ ] Build client-side tour listing and detail pages with filtering
- [ ] Implement booking flow (create record, redirect to provider)
- [ ] Create user dashboard with booking history and profile management
- [ ] Build admin dashboard with analytics overview
- [ ] Implement API provider management (CRUD for third-party credentials)
- [ ] Create tour management interface for admins (CRUD operations)
- [ ] Build API abstraction layer and integrate first third-party tour provider