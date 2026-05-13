# myreal

Full-stack product catalog demo: a **React + Vite** front end talks to an **Express** API backed by a JSON data file. The UI lists items with search, pagination, summary stats, and a virtualized list for performance.

## Requirements

- [Node.js](https://nodejs.org/) 18+ (recommended; the server uses `node --watch`)

## Setup

From the repository root:

```bash
npm install
npm run install:all
```

`install:all` installs dependencies for `server/` and `client/`.

## Development

Start the API and the dev UI together:

```bash
npm run dev
```

- **Web app:** [http://localhost:3000](http://localhost:3000) (Vite dev server)
- **API:** [http://localhost:4001](http://localhost:4001) (Express)

Vite proxies `/api` to the server, so the browser uses relative URLs like `/api/items`.

### Run packages separately

```bash
npm run dev --prefix server   # API only
npm run dev --prefix client   # front end only (expects API on port 4001)
```

## Production build (client)

```bash
npm run build --prefix client
npm run preview --prefix client
```

Serve the built `client/dist` with any static host. Configure that host to forward `/api` to your API process, or set the client’s API base URL to match your deployment.

## API

Base path: `/api` (CORS allows `http://localhost:3000` in development).

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/items` | Paginated, filterable item list |
| `GET` | `/api/stats` | Aggregate stats over all items |

### `GET /api/items`

Query parameters:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `q` | (empty) | Case-insensitive filter on **name** and **category** |
| `page` | `1` | Page number (1-based) |
| `pageSize` | `20` | Items per page (clamped between 1 and 50) |

Response shape: `{ items, page, pageSize, total, pages }`.

### `GET /api/stats`

Response: `{ total, avgPrice, byCategory, inStock }` (counts and averages derived from `server/data/items.json`).

## Data

Catalog data lives in **`server/data/items.json`**: a JSON array of objects with at least `id`, `name`, `category`, and `price`. Optional `inStock` (default treated as in stock when omitted).

The server watches this file and refreshes its in-memory cache shortly after changes on disk.

## Configuration

| Variable | Where | Default | Purpose |
|----------|-------|---------|---------|
| `PORT` | server | `4001` | API listen port |

## Project layout

```
myreal/
├── client/          # React + Vite app
├── server/          # Express API + JSON data
│   └── data/
│       └── items.json
└── package.json     # root scripts (concurrently dev, install:all)
```
