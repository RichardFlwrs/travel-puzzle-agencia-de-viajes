# Phase 1: Foundation Setup - Detailed Implementation Guide

## Overview
This phase establishes the complete foundation for the Travel Puzzle booking platform, including Next.js setup, MySQL database configuration with Prisma, authentication, and basic project structure.

**Database**: Using MySQL (cPanel/Namecheap compatible) with Prisma ORM.

---

## Step 1.1: Initialize Next.js Project

```bash
npx create-next-app@latest travel-puzzle --typescript --tailwind --app --src-dir --import-alias "@/*"
```

**Configuration choices:**
- ✅ TypeScript
- ✅ ESLint
- ✅ Tailwind CSS
- ✅ `src/` directory
- ✅ App Router
- ✅ Import alias (@/*)
- ❌ Turbopack (not stable yet)

---

## Step 1.2: Install Core Dependencies

```bash
npm install @prisma/client next-auth@beta zod zustand bcryptjs
npm install -D prisma @types/bcryptjs
```

**Package purposes:**
- `@prisma/client`: Database ORM client
- `next-auth@beta`: Authentication (v5)
- `zod`: Schema validation
- `zustand`: State management
- `bcryptjs`: Password hashing
- `prisma`: Database toolkit (dev)
- `@types/bcryptjs`: TypeScript types (dev)

---

## Step 1.3: Set Up Prisma with MySQL

### 1. Initialize Prisma
```bash
npx prisma init
```

This creates:
- `prisma/schema.prisma` file
- `.env` file with DATABASE_URL placeholder

### 2. Create complete MySQL schema in `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique @db.VarChar(255)
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
  images      String   @db.Text  // JSON array as text
  bookings    Booking[]
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Booking {
  id            String        @id @default(cuid())
  userId        String
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  tourId        String
  tour          Tour          @relation(fields: [tourId], references: [id], onDelete: Cascade)
  status        BookingStatus @default(PENDING)
  paymentStatus PaymentStatus @default(PENDING)
  totalAmount   Decimal       @db.Decimal(10, 2)
  externalUrl   String?       @db.VarChar(500)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([userId])
  @@index([tourId])
  @@index([status])
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

**Key MySQL-specific considerations**:
- Using `@db.VarChar()` for string length constraints
- Using `@db.Text` for long content (descriptions, API keys)
- Using `@db.Decimal(10, 2)` for currency values
- Added `@@index` for frequently queried fields
- Relations with `onDelete: Cascade` for data integrity

### 3. Create Prisma client singleton
File: `src/lib/prisma.ts`

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 4. Configure database
Set `DATABASE_URL` in `.env` file (see Step 1.4)

### 5. Generate Prisma client
```bash
npx prisma generate
```

### 6. Create and run migrations (after MySQL is set up)
```bash
npx prisma migrate dev --name init
```

---

## Step 1.4: Configure Environment Variables

### Create `.env` file:

**For Local Development (MAMP/XAMPP/MySQL):**
```
DATABASE_URL="mysql://root:password@localhost:3306/travelpuzzle"
NEXTAUTH_SECRET="generate-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

**For cPanel Remote Database (Namecheap):**
```
DATABASE_URL="mysql://cpanel_user:password@hostname:3306/cpanel_dbname"
NEXTAUTH_SECRET="generate-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

**MySQL Connection String Format**:
```
mysql://USER:PASSWORD@HOST:PORT/DATABASE
```

Where:
- `USER`: MySQL username (e.g., `root` locally, or cPanel username like `cpanel_user`)
- `PASSWORD`: Your MySQL password
- `HOST`: `localhost` for local, or cPanel hostname (e.g., `server123.yourdomain.com`)
- `PORT`: `3306` (default MySQL port)
- `DATABASE`: Database name (e.g., `travelpuzzle` or `cpanel_dbname`)

### Create `.env.example` (without sensitive values):
```
DATABASE_URL="mysql://user:password@localhost:3306/travelpuzzle"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
```

### Setting up Local MySQL Database

**Option 1: Using MAMP (macOS/Windows)**
1. Install MAMP from https://www.mamp.info/
2. Start MAMP servers
3. Access phpMyAdmin at http://localhost:8888/phpMyAdmin
4. Create database: `travelpuzzle`
5. Use credentials: `root` / `root`

**Option 2: Using XAMPP (Windows/macOS/Linux)**
1. Install XAMPP from https://www.apachefriends.org/
2. Start MySQL service
3. Access phpMyAdmin at http://localhost/phpmyadmin
4. Create database: `travelpuzzle`
5. Use credentials: `root` / (empty password)

**Option 3: Using Homebrew MySQL (macOS)**
```bash
brew install mysql
brew services start mysql
mysql -u root
CREATE DATABASE travelpuzzle;
```

### Setting up cPanel Remote Database

1. Log into your Namecheap cPanel
2. Navigate to **MySQL® Databases**
3. Create a new database (e.g., `youruser_travelpuzzle`)
4. Create a new MySQL user with password
5. Add user to database with ALL PRIVILEGES
6. Note the hostname (usually `localhost` or `server123.yourdomain.com`)
7. Enable **Remote MySQL** if connecting from local dev
8. Update DATABASE_URL in `.env` with credentials

---

## Step 1.5: Create Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (client)/
│   │   ├── layout.tsx
│   │   ├── page.tsx          # Landing/home page
│   │   ├── tours/
│   │   │   ├── page.tsx      # Tour listing
│   │   │   └── [id]/
│   │   │       └── page.tsx  # Tour details
│   │   ├── bookings/
│   │   │   └── page.tsx      # User bookings
│   │   └── profile/
│   │       └── page.tsx
│   ├── (admin)/
│   │   ├── layout.tsx
│   │   └── dashboard/
│   │       └── page.tsx
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts
│   ├── layout.tsx            # Root layout
│   └── globals.css
├── components/
│   ├── ui/                   # Shadcn-style base components
│   ├── client/               # Client-specific components
│   ├── admin/                # Admin-specific components
│   └── shared/               # Shared components (Navbar, Footer, etc.)
├── lib/
│   ├── prisma.ts
│   ├── auth.ts               # NextAuth config
│   ├── utils.ts              # Helper functions
│   └── validations/          # Zod schemas
└── types/
    └── index.ts              # TypeScript types
```

---

## Step 1.6: Configure NextAuth.js v5

### 1. Create `src/lib/auth.ts`
- Configure credentials provider
- Add JWT callbacks
- Add session callbacks with role
- Password verification with bcrypt

### 2. Create API route
File: `src/app/api/auth/[...nextauth]/route.ts`

### 3. Create middleware
File: `src/middleware.ts`
- Protect `/dashboard/*` (admin only)
- Protect `/bookings` and `/profile` (authenticated users)
- Redirect logic based on role

---

## Step 1.7: Create Type Definitions

Create `src/types/index.ts`:

```typescript
export type UserRole = 'CLIENT' | 'ADMIN';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

export interface Tour {
  id: string;
  title: string;
  description: string;
  destination: string;
  price: number;
  images: string[];
  provider: string;
}

export interface Booking {
  id: string;
  userId: string;
  tourId: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  externalUrl?: string;
  totalAmount: number;
  createdAt: Date;
}

export interface ApiProvider {
  id: string;
  name: string;
  endpoint: string;
  isActive: boolean;
}
```

---

## Step 1.8: Configure Tailwind

Update `tailwind.config.ts`:
- Add custom colors (primary, secondary, accent)
- Add custom fonts
- Configure dark mode (class strategy)
- Add animation utilities

---

## Step 1.9: Create Base UI Components

Create reusable components in `src/components/ui/`:
- **Button**: variants (primary, secondary, outline, ghost)
- **Input**: text input with label
- **Card**: container with header, body, footer
- **Badge**: status indicators
- **Alert**: notifications and messages
- **Loading spinner**: loading states

---

## Step 1.10: Create Root Layout

File: `src/app/layout.tsx`

Requirements:
- HTML structure with proper metadata
- Font configuration (Inter or similar)
- Session provider wrapper
- Global styles import

---

## Step 1.11: Create Shared Components

### Navbar (`src/components/shared/Navbar.tsx`)
- Logo
- Navigation links (conditional based on auth/role)
- User menu dropdown
- Mobile menu toggle

### Footer (`src/components/shared/Footer.tsx`)
- Company links
- Social media icons
- Copyright notice

---

## Step 1.12: Implement Authentication Pages

### 1. Login Page
File: `src/app/(auth)/login/page.tsx`
- Email/password form
- Client-side validation with Zod
- Server action for authentication
- Error handling and display
- Link to signup page

### 2. Signup Page
File: `src/app/(auth)/signup/page.tsx`
- Registration form (name, email, password, confirm password)
- Client-side validation with Zod
- Server action to create user
- Password hashing with bcrypt
- Auto-login after successful signup
- Link to login page

---

## Step 1.13: Create Initial Landing Page

File: `src/app/(client)/page.tsx`

Components:
- Hero section with search CTA
- Featured destinations (static content for now)
- How it works section (3-step process)
- Call-to-action section
- Modern, responsive design with Tailwind

---

## Step 1.14: Set Up Git and Documentation

### 1. Create/verify `.gitignore`
Ensure these are ignored:
- `.env`
- `node_modules/`
- `.next/`
- `dist/`
- `.DS_Store`

### 2. Create `README.md`
Include:
- Project overview and description
- Tech stack list
- Setup instructions (clone, install, env setup)
- Required environment variables
- Database setup commands
- Development server command
- Project structure overview

### 3. Initialize Git
```bash
git init
git add .
git commit -m "Initial project setup with Next.js, Prisma, and NextAuth"
```

---

## Phase 1 Deliverables Checklist

- [ ] Next.js 14+ project initialized with TypeScript and Tailwind
- [ ] All project folders and structure created
- [ ] Prisma configured with complete schema
- [ ] Database connection established and tested
- [ ] NextAuth.js configured with credentials provider
- [ ] Protected route middleware working correctly
- [ ] Login page functional with validation
- [ ] Signup page functional with validation
- [ ] Root layout with Navbar and Footer components
- [ ] Basic UI components library created
- [ ] Landing page with hero section completed
- [ ] Environment variables properly configured
- [ ] Git repository initialized with proper .gitignore
- [ ] README with comprehensive setup instructions

---

## Testing Phase 1 Completion

Before moving to Phase 2, verify:
1. ✅ Dev server runs without errors: `npm run dev`
2. ✅ Can sign up a new user successfully
3. ✅ Can log in with created credentials
4. ✅ Protected routes redirect unauthenticated users
5. ✅ Navbar shows different options for logged-in users
6. ✅ Database connection works (check Prisma Studio: `npx prisma studio`)
7. ✅ TypeScript compiles without errors: `npm run build`

---

## Common Issues and Solutions

**Issue**: Prisma client not generated
- **Solution**: Run `npx prisma generate`

**Issue**: Database connection fails
- **Solution**: 
  - Verify DATABASE_URL in .env uses correct MySQL format
  - Ensure MySQL server is running (MAMP/XAMPP/Homebrew)
  - Check MySQL port (default 3306)
  - Verify database exists: `CREATE DATABASE travelpuzzle;`
  - Test connection: `mysql -u root -p`

**Issue**: Migration fails with "Unknown database"
- **Solution**: Create database manually first: `CREATE DATABASE travelpuzzle;`

**Issue**: "Access denied for user" error
- **Solution**: 
  - Verify MySQL username and password in DATABASE_URL
  - Grant privileges: `GRANT ALL PRIVILEGES ON travelpuzzle.* TO 'user'@'localhost';`
  - Flush privileges: `FLUSH PRIVILEGES;`

**Issue**: "Too many connections" error (cPanel)
- **Solution**: 
  - Use connection pooling in `src/lib/prisma.ts`
  - Limit concurrent connections in Prisma schema
  - Contact hosting provider to increase connection limit

**Issue**: NextAuth session not persisting
- **Solution**: Check NEXTAUTH_SECRET is set, verify cookie settings

**Issue**: Build fails with TypeScript errors
- **Solution**: Ensure all type definitions are created, check imports

**Issue**: Prisma Studio not opening
- **Solution**: Run `npx prisma studio` - it opens at http://localhost:5555

---

## Next Steps

Once Phase 1 is complete:
1. ✅ Mark Phase 1 as complete in main plan
2. 🚀 Move to Phase 2: Client-Side Core features
3. 📋 Create detailed Phase 2 plan if needed

