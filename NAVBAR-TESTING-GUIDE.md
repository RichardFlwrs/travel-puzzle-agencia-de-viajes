# 🧭 Navbar Component - Testing Guide

## Overview

The Navbar component is fully implemented with **i18n support** and **3 different states** based on user authentication and role.

## 📐 Navbar Grid Structure

### Layout Breakdown:
```
┌──────────────────────────────────────────────────────────────┐
│  [Logo + Brand]     [Nav Links]          [Auth/User Menu]    │
└──────────────────────────────────────────────────────────────┘
```

- **Left**: Logo + "Travel Puzzle" brand
- **Center**: Context-aware navigation links
- **Right**: Auth buttons OR User dropdown + Language Switcher

---

## 🎭 Three Navigation States

### 1️⃣ Public (Not Logged In)
```javascript
const mockUser = null;
```

**Displays:**
- **Left**: Travel Puzzle logo
- **Center**: Home | Tours | How It Works
- **Right**: Login button + Sign Up button + Language Switcher

**Mobile**: Hamburger menu with all options collapsed

---

### 2️⃣ Client (Logged In - CLIENT role)
```javascript
const mockUser = { 
  name: 'John Doe', 
  email: 'john@example.com', 
  role: 'CLIENT' 
};
```

**Displays:**
- **Left**: Travel Puzzle logo
- **Center**: Home | Tours | My Bookings
- **Right**: User dropdown (Profile Settings, Logout) + Language Switcher

**User Dropdown Options:**
- ⚙️ Profile Settings
- 🚪 Logout

---

### 3️⃣ Admin (Logged In - ADMIN role)
```javascript
const mockUser = { 
  name: 'Admin User', 
  email: 'admin@example.com', 
  role: 'ADMIN' 
};
```

**Displays:**
- **Left**: Travel Puzzle logo
- **Center**: Home | Tours | My Bookings
- **Right**: Dashboard dropdown + User dropdown + Language Switcher

**Dashboard Dropdown Options:**
- 📊 Analytics Overview
- 🏷️ Manage Tours
- 📋 Manage Bookings
- 👥 Manage Users
- ⚙️ API Configuration

**User Dropdown Options:**
- ⚙️ Profile Settings
- 🚪 Logout

---

## 🧪 How to Test

### Step 1: Open `src/app/page.tsx`

Find these lines (around line 15-18):

```typescript
// Mock user for testing - change to test different states
// const mockUser = null; // Public (not logged in)
// const mockUser = { name: 'John Doe', email: 'john@example.com', role: 'CLIENT' as const }; // Client
const mockUser = { name: 'Admin User', email: 'admin@example.com', role: 'ADMIN' as const }; // Admin
```

### Step 2: Uncomment Different States

**Test Public State:**
```typescript
const mockUser = null; // Public (not logged in)
// const mockUser = { name: 'John Doe', email: 'john@example.com', role: 'CLIENT' as const };
// const mockUser = { name: 'Admin User', email: 'admin@example.com', role: 'ADMIN' as const };
```

**Test Client State:**
```typescript
// const mockUser = null;
const mockUser = { name: 'John Doe', email: 'john@example.com', role: 'CLIENT' as const };
// const mockUser = { name: 'Admin User', email: 'admin@example.com', role: 'ADMIN' as const };
```

**Test Admin State:**
```typescript
// const mockUser = null;
// const mockUser = { name: 'John Doe', email: 'john@example.com', role: 'CLIENT' as const };
const mockUser = { name: 'Admin User', email: 'admin@example.com', role: 'ADMIN' as const };
```

### Step 3: Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` and test each state.

---

## 🌍 Language Switching

The navbar includes a **Language Switcher** component that supports:

- 🇬🇧 English (en)
- 🇪🇸 Español (es)
- 🇵🇹 Português (pt)
- 🇩🇪 Deutsch (de)
- 🇫🇷 Français (fr)
- 🇮🇹 Italiano (it)

**How it works:**
- Select a language from the dropdown
- All navbar labels instantly update
- Language preference is saved to `localStorage`
- On refresh, your selected language persists

---

## 📱 Responsive Design

### Desktop (≥ 768px):
- Full horizontal navbar
- Dropdowns for Dashboard and User menus
- All links visible

### Mobile (< 768px):
- Hamburger menu icon
- Collapsible side menu
- Language switcher moved to mobile menu
- All options stacked vertically

---

## 🔗 Navigation Links

### Public Links:
- **Home** → `/`
- **Tours** → `/tours`
- **How It Works** → `/how-it-works`

### Client Links:
- **Home** → `/`
- **Tours** → `/tours`
- **My Bookings** → `/bookings` (protected)

### Admin Dashboard Links:
- **Analytics Overview** → `/dashboard`
- **Manage Tours** → `/dashboard/tours`
- **Manage Bookings** → `/dashboard/bookings`
- **Manage Users** → `/dashboard/users`
- **API Configuration** → `/dashboard/api-config`

---

## 🎨 Styling Features

- ✅ Sticky navbar (stays at top on scroll)
- ✅ Backdrop blur effect
- ✅ Active link highlighting
- ✅ Smooth dropdown animations
- ✅ Hover states on all interactive elements
- ✅ Dark mode support (via CSS variables)
- ✅ Fully accessible (keyboard navigation)

---

## 🔮 Next Steps (After NextAuth Integration)

Currently, the navbar uses a **mock user prop**. Once NextAuth is integrated:

1. Replace mock user with `useSession()` hook:
```typescript
import { useSession } from 'next-auth/react';

export const Navbar = () => {
  const { data: session } = useSession();
  const user = session?.user;
  
  // Rest of component logic...
}
```

2. The logout button will call `signOut()`:
```typescript
import { signOut } from 'next-auth/react';

<button onClick={() => signOut()}>
  Logout
</button>
```

3. Remove the `user` prop from `<Navbar />` calls.

---

## ✅ Checklist

- [x] Navbar component created
- [x] Three states implemented (Public, Client, Admin)
- [x] i18n translations for all 6 languages
- [x] Responsive mobile menu
- [x] Language switcher integrated
- [x] Active link highlighting
- [x] Dropdown menus for Dashboard and User
- [x] Sticky positioning with backdrop blur
- [x] Ready for NextAuth integration

---

**Status:** ✅ **Navbar Component Complete and Fully Functional**

Test it now by changing the `mockUser` variable in `src/app/page.tsx`! 🚀

