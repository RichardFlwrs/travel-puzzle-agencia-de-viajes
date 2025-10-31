# TravelPuzzle - Tour Aggregation Platform

A modern tour discovery and booking platform built with Next.js, featuring a hybrid architecture that combines database reliability with Redis caching performance and multi-provider tour aggregation.

## Features

- 🌍 **Multi-language Support**: English, Spanish, Portuguese, German, French, Italian
- 🔍 **Smart Search & Filters**: Country, city, price range, category filtering
- ⚡ **High Performance**: Redis caching with 50-70% faster response times
- 🔌 **Multi-Provider Support**: Aggregates tours from multiple APIs (FreeTour, Viator, more coming)
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- 🔐 **Authentication**: Secure user authentication with NextAuth
- 💾 **Robust Database**: MySQL with Prisma ORM for reliable data storage

## Architecture

### Hybrid Architecture: Database + Redis + Adapter Pattern

The platform uses a sophisticated hybrid architecture:

1. **Database Layer (MySQL)**: Primary data storage with full tour information
2. **Caching Layer (Redis/Upstash)**: Performance optimization with configurable TTL
3. **Adapter Pattern**: Modular multi-provider integration for tour aggregation

**Read more**: See [HYBRID-ARCHITECTURE-SETUP.md](./HYBRID-ARCHITECTURE-SETUP.md) for detailed documentation.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: MySQL with Prisma ORM
- **Caching**: Redis (Upstash)
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **APIs**: FreeTour API, Viator API (more coming)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MySQL database
- Upstash Redis account (free tier available)
- FreeTour API credentials

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd TravelPuzzle-agencia-de-viajes
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

Required environment variables:
```env
DATABASE_URL="mysql://user:password@localhost:3306/travelpuzzle"
NEXTAUTH_SECRET="your-secret"
FREETOUR_EMAIL="your-email"
FREETOUR_PASSWORD="your-password"
UPSTASH_REDIS_REST_URL="your-upstash-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
```

4. Run database migrations:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Sync tour data:
```bash
npm run sync:tours
```

6. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run sync:tours` - Sync tours from FreeTour API
- `npm run fix:country-names` - Fix country name mappings

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── (client)/          # Client-facing pages
│   ├── (admin)/           # Admin dashboard
│   └── api/               # API routes
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── tours/            # Tour listing components
│   ├── layout/           # Layout components
│   └── ui/               # Reusable UI components
├── lib/
│   ├── adapters/         # Tour provider adapters
│   ├── cache/            # Redis caching utilities
│   ├── services/         # Business logic services
│   ├── db/               # Database repositories
│   └── translations/     # i18n translations
├── actions/              # Server actions
└── types/                # TypeScript type definitions
```

## Documentation

- [Hybrid Architecture Setup](./HYBRID-ARCHITECTURE-SETUP.md) - Complete setup and usage guide
- [Implementation Summary](./IMPLEMENTATION-SUMMARY.md) - What was built and how it works
- [Initial Plan](./plans/initial_plan.md) - Project planning documents
- [Navigation Structure](./plans/NAVIGATION-STRUCTURE.md) - App navigation design

## Features in Detail

### Tour Search & Discovery
- Advanced filtering by location, price, category
- Real-time search with debouncing
- Pagination with smooth navigation
- Multi-language content support

### Caching Strategy
- **Client-Side**: React Query with 5-minute stale time
- **Server-Side**: Redis with configurable TTL (5-30 minutes)
- **Performance**: Sub-100ms response times for cached queries

### Multi-Provider Aggregation
- Parallel fetching from multiple tour APIs
- Unified tour format across providers
- Graceful error handling (continues with available providers)
- Easy to add new providers via adapter pattern

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.

## License

[Your License Here]

## Support

For issues or questions:
1. Check the [documentation](./HYBRID-ARCHITECTURE-SETUP.md)
2. Review existing GitHub issues
3. Create a new issue with details

---

Built with ❤️ using Next.js


["en","es","pt","de","fr","it"]

https://images.pexels.com/photos/2373201/pexels-photo-2373201.jpeg?auto=compress&cs=tinysrgb&w=1920

https://images.pexels.com/photos/1388030/pexels-photo-1388030.jpeg?auto=compress&cs=tinysrgb&w=1920

https://images.pexels.com/photos/2613260/pexels-photo-2613260.jpeg?auto=compress&cs=tinysrgb&w=1920

https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg?auto=compress&cs=tinysrgb&w=1920

https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1920

https://images.pexels.com/photos/1591373/pexels-photo-1591373.jpeg?auto=compress&cs=tinysrgb&w=1920

https://images.pexels.com/photos/1320684/pexels-photo-1320684.jpeg?auto=compress&cs=tinysrgb&w=1920