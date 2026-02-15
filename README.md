
# Cupify Landing Page (COD Focus)

High-conversion single-page app for selling cup sets with real-time stock and Cash on Delivery logic.

## Features
- **Mobile First**: Optimized for iPhone screens.
- **Multilingual**: Arabic (RTL) & English (LTR).
- **Live Stock**: Frontend polls for real-time availability.
- **Transaction Safe**: Backend uses `SELECT ... FOR UPDATE` to prevent overselling.
- **WhatsApp Integration**: Deep link generation for final step.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Docker (for PostgreSQL)

### Step 1: Database
Run PostgreSQL locally using Docker:
```bash
docker run --name cupify-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
```
Apply the schema in `db/schema.sql` using your favorite SQL client.

### Step 2: Backend
1. Navigate to the backend logic (or setup an Express project).
2. `npm install express pg helmet cors dotenv`
3. Run with `npm run dev`.

### Step 3: Frontend (React)
1. Install dependencies: `npm install`
2. Run development server: `npm run dev`

## API Endpoints (Quick Reference)

### Get Inventory
`GET /api/inventory`
- Returns array of `{ colorCode, stock, updatedAt }`

### Create Order
`POST /api/orders`
```json
{
  "language": "ar",
  "packSize": 3,
  "items": [{"colorCode": "BLUE", "qty": 1}],
  "customer": {
    "name": "Ahmed",
    "mobile": "0501234567",
    "city": "Dubai",
    "address": "Street 10",
    "preferredTime": "Morning"
  }
}
```

## Future Recommendations
- **Dashboard**: Add an `/admin` route to manage inventory and view orders.
- **SMS Notifications**: Integrate Twilio for order confirmation.
- **Image Uploads**: Allow customers to upload photos of their delivery for social proof.
