# Geotraizer (PGENRO-ISF)

A GIS-enabled web application for tracking Integrated Social Forestry (ISF) projects, stewards, and land use across municipalities and barangays.

## Prerequisites

- **Node.js** 18+ 
- **Yarn** (package manager)
- **PostgreSQL** database
- **Supabase** account (for authentication)
- **OpenAI API key** (for AI-powered data import, reports, and chatbot)

## Setup

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd geotraizer
yarn install
```

This runs `prisma generate` automatically via the `postinstall` script.

### 2. Configure environment variables

Copy `.env` and fill in your values:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (get from Supabase: Settings > Database > Connection string) |
| `SUPABASE_URL` | Supabase project URL (e.g. `https://kyzrgghgrjdsyozbimmt.supabase.co`) |
| `SUPABASE_ROLE_KEY` | Supabase **service_role** key (server-side only, never exposed to client) |
| `NEXT_PUBLIC_SUPABASE_URL` | Same as `SUPABASE_URL` (client-safe, prefixed with `NEXT_PUBLIC_`) |
| `NEXT_PUBLIC_ROLE_KEY` | Supabase **anon** key (client-safe) |
| `OPENAI_API_KEY` | OpenAI API key (from https://platform.openai.com/api-keys) |

### 3. Set up Supabase Auth

1. Create a project at [supabase.com](https://supabase.com)
2. Enable Email/Password auth in Authentication > Providers
3. Copy the project URL, anon key, and service_role key to your `.env`

### 4. Set up the database

```bash
# Apply Prisma migrations to create all tables
yarn prisma migrate dev

# Seed municipalities and barangays (Iloilo province)
yarn prisma db seed

# [Optional] Seed demo user, projects, stewards, and evaluations
yarn db:seed-demo
```

This creates a verified demo account (`admin@geotraizer.com` / `Asdf1234!`) with 8 sample projects across 8 municipalities, 5 stewards, and 5 evaluation records.

### 5. Start the development server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind CSS 4, shadcn/ui, Radix Primitives |
| Database | PostgreSQL via Prisma ORM |
| Auth | Supabase Auth (email/password, SSR sessions) |
| Maps | Leaflet + react-leaflet + leaflet-draw |
| Charts | Recharts |
| AI | OpenAI (GPT-4 / GPT-4o-mini) |
| Validation | Zod + react-hook-form |
| Data Fetching | SWR |

## Data Model

The app tracks projects and stewards at the barangay (village) level:

- **Municipality** — Philippine municipality with PSGC code
- **Barangay** — Village with PSGC code, linked to a municipality
- **Project** — ISF project with status, cost, area, date range, components, attachments
- **Steward** — Community steward with CSC certification, land area (GeoJSON polygon), evaluations

Barangay boundaries are displayed as GeoJSON polygons on the map, matched via PSGC official codes.

## Geospatial Data

The barangay boundary data comes from [altcoder/philippines-psgc-shapefiles](https://github.com/altcoder/philippines-psgc-shapefiles):

- `public/province_sub.zip` — Panay Island barangay shapefile source
- `public/data/province_barangays.json` — Pre-converted GeoJSON (Iloilo province, 1,721 barangays, 43 municipalities)

### Regenerating seed data for other provinces

To seed a different province:

1. Export the desired province from the full PH shapefile to GeoJSON using QGIS or `ogr2ogr`
2. Replace `public/data/province_barangays.json` with the new GeoJSON
3. Download the PSGC municipality reference:
   ```bash
   curl -L https://raw.githubusercontent.com/altcoder/philippines-psgc-shapefiles/main/dist/PH_Adm3_MuniCities.csv -o /tmp/PH_Adm3_MuniCities.csv
   ```
4. Run the generator:
   ```bash
   python3 src/seed/generate-filtered-municipalities.py \
     --geojson public/data/your_province_barangays.json \
     --csv /tmp/PH_Adm3_MuniCities.csv
   ```
5. Re-seed: `yarn prisma db seed`

## AI Features

The app uses OpenAI for:
- **Import from Excel** — Upload `.xlsx`/`.csv` files of project or steward data; AI extracts structured records
- **Chatbot** — Ask questions about projects and data
- **Report generation** — AI-powered narrative analysis
- **Chart insights** — AI-generated explanations of chart trends

These features require `OPENAI_API_KEY` to be set.

## Build

```bash
yarn build
yarn start
```

## Project Structure

```
src/
  app/             # Next.js App Router pages & API routes
  components/      # React components (auth, chatbot, charts, forms, map, projects, reports, stewards, ui)
  hooks/           # Custom hooks (useAuth, useProjects, useStewards, useHeatmap, etc.)
  lib/             # Utility libraries
  schemas/         # Zod validation schemas
  seed/            # Database seed scripts & generators
  utils/           # Prisma client, Supabase clients, shapefile loader, AI prompts
  middleware.ts    # Supabase auth session middleware
prisma/
  schema.prisma    # Database schema (9 models)
  migrations/      # Migration history
public/
  data/            # Barangay GeoJSON data
```
