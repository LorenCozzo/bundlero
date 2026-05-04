# bundlero Quantity Breaks — Shopify App

Shopify app built with **Next.js** that adds a quantity breaks widget to your storefront, letting customers choose between tiered offers (1x / 2x / 3x) with custom labels, badges, and discounts.

---

## Architecture

```
bundlero-app/
├── app/
│   ├── api/
│   │   ├── auth/              # Shopify OAuth flow
│   │   │   └── callback/
│   │   ├── bundles/           # CRUD for bundles
│   │   │   └── [id]/
│   │   ├── widget/            # Public API for storefront widget
│   │   └── install-script/    # Registers ScriptTag in Shopify
│   ├── dashboard/             # Admin UI
│   └── page.tsx               # Entry point / redirect
├── components/
│   ├── BundleList.tsx         # List all bundles
│   └── BundleEditor.tsx       # Create/edit bundle with live preview
├── lib/
│   ├── shopify.ts             # Shopify API client
│   └── db.ts                  # Prisma singleton
├── public/
│   └── widget.js              # Storefront widget (embedded via ScriptTag)
├── prisma/
│   └── schema.prisma          # SQLite schema (Session, QuantityBundle, Tier)
└── types/
    └── index.ts               # Shared TypeScript types
```

---

## Setup

### 1. Create a Shopify Partner account & app

1. Go to [partners.shopify.com](https://partners.shopify.com)
2. Create a new app → choose **Custom app** or **Public app**
3. Set the App URL to your deployment URL
4. Set the Redirect URL to `https://YOUR_APP_URL/api/auth/callback`
5. Copy the **API Key** and **API Secret**

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in:
```env
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SHOPIFY_SCOPES=read_products,write_products,read_script_tags,write_script_tags,read_discounts,write_discounts
APP_URL=https://your-ngrok-or-deployment-url.com
DATABASE_URL="file:./dev.db"
SESSION_SECRET=some_random_secret_32_chars_min
```

### 3. Initialize database

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Run locally with ngrok

```bash
# Terminal 1
npm run dev

# Terminal 2
ngrok http 3000
```

Update `APP_URL` in `.env.local` with the ngrok HTTPS URL.

### 5. Install on a development store

Visit: `https://YOUR_NGROK_URL/api/auth?shop=YOUR_STORE.myshopify.com`

After OAuth, go to the dashboard and:
1. Create your first bundle
2. Click **Install Widget** to register the ScriptTag on your store

---

## Deployment

### Vercel (recommended)

```bash
npm i -g vercel
vercel
```

Set all env vars in the Vercel dashboard. For production, switch `DATABASE_URL` to a hosted database (PlanetScale, Supabase, Neon, etc.) and update the Prisma provider accordingly.

### Production database migration

```bash
# Switch to PostgreSQL in prisma/schema.prisma
# datasource db { provider = "postgresql" ... }

npx prisma migrate deploy
```

---

## How the widget works

1. App registers a `ScriptTag` via Shopify Admin API → the script loads on every storefront page
2. `public/widget.js` auto-initializes when the page loads
3. It calls `GET /api/widget?shop=xxx&productId=yyy` to fetch the bundle config
4. Renders a tier selector above the **Add to Cart** button
5. On tier selection, updates the native Shopify `input[name="quantity"]` field
6. No cart modifications needed — Shopify handles the rest!

---

## Extending the app

| Feature | Where to add |
|---|---|
| Shopify Functions discounts | `app/api/discounts/` + deploy extension with `shopify app deploy` |
| Analytics / revenue tracking | Add `BundleEvent` model to Prisma, log from widget |
| A/B testing | Add `variant` field to `QuantityBundle`, serve randomly from widget API |
| Upsell post-purchase | New `PostPurchaseOffer` model + Shopify checkout extension |
| Subscription integration | Connect to Loop/Recharge via their APIs |

---

## Tech Stack

- **Next.js 14** (App Router)
- **Shopify API** (`@shopify/shopify-api`)
- **Prisma** + SQLite (dev) / PostgreSQL (prod)
- **TypeScript**
- Vanilla JS storefront widget (no framework dependency)
