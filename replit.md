# Pollyana Basic Chic - E-commerce Landing Page

## Overview

This is a React-based e-commerce landing page for "Pollyana Basic Chic", a women's fashion boutique. The application features a product catalog with WhatsApp integration for purchases, an admin panel for managing products, categories, banners, and inventory, and a shopping cart system. The platform is designed as a catalog-style store where customers browse products and complete purchases via WhatsApp rather than traditional checkout.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type-safe component development
- **Routing**: React Router v7 for client-side navigation with protected admin routes
- **Styling**: Tailwind CSS for utility-first responsive design with custom font configurations (Playfair Display, Cormorant Garamond)
- **UI Components**: Radix UI primitives (Select component) for accessible, unstyled components
- **Icons**: Lucide React for consistent iconography throughout the application

### State Management
- React built-in hooks (useState, useEffect, useCallback) for local component state
- No external state management library - state flows through props and services
- Custom hooks (useCep) for reusable stateful logic

### Data Persistence
- **localStorage** serves as the primary data store for all application data
- Centralized storage service (`src/services/storage.service.ts`) abstracts localStorage operations
- Data is organized by domain: products, categories, clicks, cart, banners, shipping config, stock history
- Storage keys are defined as constants for consistency

### Service Layer Pattern
All business logic is encapsulated in service classes located in `src/services/`:
- `products.service.ts` - Product CRUD, visibility, launches
- `categories.service.ts` - Category hierarchy management with parent-child relationships
- `cart.service.ts` - Shopping cart operations with variant support
- `banners.service.ts` - Banner management for homepage carousel
- `clicks.service.ts` - Product click tracking for analytics
- `stock.service.ts` - Inventory management with movement history
- `shipping.service.ts` - Shipping cost calculations
- `auth.service.ts` - Admin authentication (localStorage-based)

### Product System
- Products support multiple color variants with optional per-color images
- Size types: standard (P/M/G/GG) or numeric sizing
- Variants track individual stock per color-size combination
- Discount system supports percentage or fixed amount with expiration dates
- Launch product feature for highlighting new arrivals with expiration

### Category Hierarchy
- Categories support parent-child relationships for nested navigation
- Default "Todos" (All) category always present
- Categories have visibility toggle and ordering
- Products inherit category visibility in catalog display

### Admin Panel
- Protected routes using `ProtectedRoute` component
- Dashboard with statistics overview
- CRUD interfaces for products, categories, banners
- Stock control with variant-level management
- Reports showing product click analytics
- Settings for admin credentials and shipping configuration

### Component Organization
```
src/
├── components/      # Reusable UI components
├── pages/           # Full page components (CartPage)
├── admin/           # Admin panel components and pages
├── services/        # Business logic and data access
├── hooks/           # Custom React hooks
├── utils/           # Utility functions (image, color, product calculations)
├── types/           # TypeScript type definitions
└── lib/             # External library configurations
```

## External Dependencies

### Third-Party Services
- **ViaCEP API** (`viacep.com.br`) - Brazilian postal code lookup for shipping address
- **IBGE API** (`servicodados.ibge.gov.br`) - Brazilian cities data for shipping configuration
- **WhatsApp Web** - Purchase flow via WhatsApp links with pre-filled messages

### Supabase (Optional)
- Supabase client is configured but not actively used
- Environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` can enable database integration
- Current implementation falls back to localStorage when Supabase is not configured

### Build Tools
- **Vite** - Development server and production build
- **PostCSS/Autoprefixer** - CSS processing for Tailwind

### UI Dependencies
- `@radix-ui/react-select` - Accessible select component primitives
- `lucide-react` - Icon library
- `clsx` and `tailwind-merge` - Utility for conditional class names