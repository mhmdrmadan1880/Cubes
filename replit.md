# Cupify - Reserve Your Set

## Overview
Cupify is a bilingual (Arabic/English) e-commerce web app for ordering custom cup sets. Users select pack sizes, choose colors, and place orders with delivery details. Built with React frontend and Express backend connected to PostgreSQL. All product configurations (packs and colors) are fully database-driven and editable through the admin panel.

## Architecture
- **Frontend**: React + Vite (port 5000)
- **Backend**: Express API (port 3001, proxied via Vite at `/api` and `/objects`)
- **Database**: PostgreSQL (Replit built-in)
- **Styling**: Tailwind CSS (CDN)
- **Object Storage**: Replit Object Storage for image uploads (presigned URL flow)

## Project Structure
```
├── index.html          # Main HTML entry point
├── index.tsx           # React entry point
├── App.tsx             # Main React component (multi-step order flow + admin dashboard)
├── constants.tsx       # UI translations only (TEXTS)
├── types.ts            # TypeScript types (no enums, all string-based)
├── services/
│   ├── api.ts          # Real API service (connects to backend)
├── backend/
│   ├── server.ts       # Express API server with PostgreSQL
│   └── replit_integrations/
│       └── object_storage/  # Object storage integration (upload, serve)
├── db/
│   └── schema.sql      # Database schema reference
├── vite.config.ts      # Vite config (port 5000, proxy /api and /objects to 3001)
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and scripts
```

## Database Tables
- `pack_configs` - Pack size configurations (size, titles AR/EN, descriptions AR/EN, badge, sort_order)
- `inventory_items` - Cup color stock levels with editable names (AR/EN), hex color codes, sort_order
- `orders` - Customer orders with status tracking
- `order_items` - Individual items in each order
- `admin_settings` - Configurable store settings (prices, delivery, WhatsApp, store active)
- `image_assets` - Uploaded image references (category, ref_key, image_url, sort_order)

## Admin Access
- Admin panel is at `/admin` route (separate from main store)
- Protected by login: username `mhmd`, password `qwe-12345`
- Token-based auth: login returns a token stored in sessionStorage, sent as Bearer header
- All `/api/admin/*` endpoints (except `/login` and `/logout`) require valid auth token
- Auto-logout on 401 responses (e.g., after server restart)

## Admin Panel Features
- **Orders Tab**: View all orders with status filtering, expand for details, update status (Confirmed/Processing/Shipped/Delivered/Canceled), revenue stats
- **Inventory Tab**: Manage stock levels and editable product names (AR/EN) for each cup color
- **Packs Tab**: Edit pack titles (AR/EN), descriptions (AR/EN), and badges for each pack size
- **Images Tab**: Upload/change/delete pack images, cup color thumbnails, and gallery slides (up to 3 per color). Uses Object Storage with presigned URL flow.
- **Settings Tab**: Configure pack prices, delivery fee, WhatsApp number, store active toggle

## Image Management
- Images uploaded via admin go to Replit Object Storage
- Stored paths in `image_assets` table (e.g., `/objects/uploads/uuid`)
- Frontend resolves images from DB only (no hardcoded fallbacks)
- Categories: `pack` (by pack size), `color` (by color code), `gallery` (by color code + sort_order 0-2)

## API Endpoints
- `GET /api/inventory` - Get all inventory items (includes nameAr, nameEn, hex, sortOrder)
- `GET /api/packs` - Get all pack configurations
- `GET /api/activity` - Get live activity feed
- `GET /api/settings/public` - Get public store settings (prices, etc.)
- `GET /api/images` - Get all image assets
- `POST /api/orders` - Create order (uses dynamic prices from settings)
- `POST /api/admin/login` - Admin login (returns token)
- `POST /api/admin/logout` - Admin logout (invalidates token)
- `GET /api/admin/orders` - Get all orders (admin, requires auth)
- `PUT /api/admin/orders/:id/status` - Update order status
- `PUT /api/admin/inventory/:colorCode` - Update stock and names
- `PUT /api/admin/packs/:size` - Update pack configuration
- `GET /api/admin/settings` - Get admin settings
- `PUT /api/admin/settings` - Update admin settings
- `PUT /api/admin/images` - Upsert image asset
- `DELETE /api/admin/images/:id` - Delete image asset
- `POST /api/uploads/request-url` - Get presigned upload URL
- `GET /objects/*` - Serve uploaded objects from storage

## Key Configuration
- Frontend binds to `0.0.0.0:5000` with `allowedHosts: true`
- Backend binds to `0.0.0.0:3001`
- Vite proxies `/api/*` and `/objects/*` requests to the backend
- DATABASE_URL provided by Replit environment
- BACKEND_PORT=3001 set as shared environment variable

## Design Decisions
- All product data (pack configs, color names, hex codes, prices) comes from the database - zero hardcoded product data
- constants.tsx only contains UI text translations (TEXTS object)
- types.ts contains only interfaces and type aliases - no enums, no constants, no fallback values
- Prices come exclusively from admin_settings.pack_prices in the database

## Scripts
- `npm run dev` - Start both backend and frontend for development
- `npm run build` - Build frontend for production
- `npm start` - Start backend server only (for production)
