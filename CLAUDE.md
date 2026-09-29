# Magazine Prototype — Project Context

## Tech Stack
- Next.js (App Router), Supabase, CSS Grid
- Hosted on Vercel (likely)

## App Structure
- `app/admin/page.js` — Admin dashboard (1143 lines): artworks manager, collections, orders, profile, exhibitions, events tabs
- `app/globals.css` — Global styles with CSS Grid admin table layout
- `app/checkout/page.js` — Checkout with shipping calculator
- `lib/shipping.js` — FedEx domestic shipping for Egypt
- `lib/supabase.js` — Supabase client (browser + service)
- `lib/admin-client.js` — Admin auth client
- `lib/db.js` — DB constants (ON_SALE_COLLECTION_ID, etc.)

## Key Features Built
1. **Admin Artworks Panel** — CRUD with Supabase, drag-and-drop sorting, toggle featured/on-sale checkboxes, mobile-responsive CSS Grid layout, edit/delete
2. **Shipping Calculator** — FedEx retail cash-customer rates with volumetric weight (/3000), 4 governorate zones (Egypt), 18% fuel surcharge, 14% VAT, rounding to nearest 5 EGP. Wrapping: 3cm pad added to height & width only (not depth)
3. **On Sale Collection** — Cherry red background on homepage
4. **Orders Management** — Order tracking tab in admin
5. **Collections Manager** — Admin tab for collections CRUD

## Shipping Details (shipping.js)
- 3cm padding added to max length and max width of combined items
- Total thickness = sum of all item depths
- Volumetric weight = (L * W * H) / 3000
- Billable = ceil(max(actualWeight, volumetricWeight))
- Zone 1 (Cairo/Giza/Qalyubia): 110 base + 20/kg
- Zone 2 (10 governorates): 140 base + 25/kg
- Zone 3 (8 governorates): 170 base + 35/kg
- Zone 4 (5 governorates): 210 base + 45/kg

## Windows Memory Recovery
- Sessions transferred from Windows desktop app (Tauri)
- Logs recovered from soopencode/logs/
- No opencode.db found — full conversation text not available
- Session IDs: ses_17543ec90ffeqqJviJrK323fZw (main), ses_2355c05e6ffeqbILdH7HTT0aI1, ses_12925c513ffefAFBU5il9HXq2r
