# OSCAR web UI

A Svelte + SvelteKit SPA for the OSCAR assistant. Client-side only with static deployment via `adapter-static`. The API base URL is compiled in at build time.

## Requirements

- **Node.js** 18+ 
- **npm** 9+
- **API server** running at the configured `VITE_API_BASE_URL` (default: `http://localhost:3000`)

## Setup

### 1. Install dependencies

From the workspace root:
```bash
npm install
```

Or from this directory:
```bash
npm install
```

### 2. Configure API endpoint

Copy `.env.example` to `.env` and set the API base URL:

```bash
cp .env.example .env
# Edit .env if needed (or leave as-is for http://localhost:3000)
```

**Note:** Vite automatically loads `.env` files. The `VITE_` prefix is required for variables to be accessible in client code.

## Running

### Development server

```bash
npm run dev
```

Starts a dev server at `http://localhost:5173`. Hot module reloading enabled.

### Production build

```bash
npm run build
```

Outputs static files to `build/` directory. Ready for deployment to any static host.

To preview the production build locally:
```bash
npm run preview
```

## Architecture

- **Pages**
  - `/` — Home: List items with filters (type, label, search, orderBy, count); soft-delete checkbox
  - `/choose` — Choose: GET form to fetch next recommended items by type
  - `/add` — Add Item: Form to create a new item

- **Components**
  - `ItemRow.svelte` — Shared item display + inline edit + soft-delete
  - `api.ts` — Typed API client (getItems, getNextItems, getTypes, getLabels, createItem, updateItem)

- **Key features**
  - Soft-delete: checkbox toggles `deletedAt` (item stays visible as crossed-out)
  - Inline edit: "Edit" button switches to form; Save/Cancel
  - Static deployment: no server-side logic

## API Integration

The app calls the OSCAR API (packages/api). Endpoints used:

- `GET /items` — list items with filters
- `GET /items/next` — get next recommended item(s)
- `GET /types` — fetch item types for choosers
- `GET /labels` — fetch labels for choosers
- `POST /items` — create new item
- `PATCH /items/:id` — update/soft-delete item
