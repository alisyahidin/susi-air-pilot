# Susi Air Pilot App: API

The NestJS REST API for the Susi Air Pilot App. It runs on Fastify, serves everything under `/api/v1`, and loads its data from JSON files into memory at startup, so there is no database to set up.

For the project overview, the decisions behind it and what comes next, see the [root README](../README.md).

## Requirements

- Node.js 24 (the `Dockerfile` uses 24.21.0)
- npm

## Setup

```bash
cd nest
npm install
cp .env.example .env
npm run start:dev
```

The API is now at `http://localhost:3001/api/v1`. The defaults in `.env.example` work for local development without changes.

Sign in with the test account to get a token:

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"johndoe","password":"susiairtest"}'
```

## Environment variables

Read from `.env.local`, then `.env`. They are validated at startup (`src/config/env.schema.ts`), and the API refuses to start if one is invalid.

| Variable | Default | Required | What it does |
| --- | --- | --- | --- |
| `NODE_ENV` | `development` | No | `development`, `test` or `production`. In production the refresh cookie is `Secure` and `JWT_SECRET` is required. |
| `PORT` | `3001` | No | Port the API listens on. |
| `TODAY` | empty | Recommended | The date the app treats as today, `YYYY-MM-DD`. Set it to `2026-05-15` so the mock data lines up. When empty, the real date (UTC) is used. Keep it the same as `TODAY` in `nuxt/.env`. |
| `CORS_ORIGIN` | `http://localhost:3000` | In production | Browser origins allowed to call the API, comma-separated. It must include the frontend's URL: write requests from any other origin are refused with `403`. |
| `JWT_SECRET` | dev-only fallback | In production | HS256 signing secret, at least 32 characters. Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`. |
| `JWT_ISSUER` | `susi-air` | No | `iss` claim on access tokens. |
| `JWT_ACCESS_TTL` | `15m` | No | Access token lifetime: a number with a unit (`ms`, `s`, `m`, `h`, `d`, `w`). |
| `JWT_REFRESH_TTL` | `30d` | No | Refresh token lifetime, same format. Also the refresh cookie's `Max-Age`. |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run start:dev` | Start with file watching |
| `npm run start` | Start once |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run the compiled build (`node dist/main`) |
| `npm test` | Unit and request-level specs (`src/**/*.spec.ts`) |
| `npm run test:e2e` | Smoke test of the whole app (`test/*.e2e-spec.ts`) |
| `npm run test:cov` | Specs with coverage |
| `npm run typecheck` | Type-check without emitting |
| `npm run lint` | Lint with oxlint |
| `npm run format` | Format with Prettier |

## Endpoints

All paths are under `/api/v1`. Every route except the three under `/auth` needs `Authorization: Bearer <accessToken>`.

| Method | Path | What it returns |
| --- | --- | --- |
| `POST` | `/auth/login` | Body `{ username, password }`. Returns `{ accessToken, expiresIn, user }` and sets the refresh token as an `httpOnly` cookie. |
| `POST` | `/auth/refresh` | Uses the refresh cookie to return a new access token, and rotates the cookie. |
| `POST` | `/auth/logout` | Revokes the refresh token and clears the cookie. |
| `GET` | `/pilot/me` | Pilot profile: `name`, `totalFlightHours`, `imageUrl`. |
| `GET` | `/flight-hours?from=YYYY-MM-DD&to=YYYY-MM-DD` | Daily flight hours in the range. Both dates are optional and inclusive. |
| `GET` | `/flight-hours/limits?date=YYYY-MM-DD` | Hours in the daily, weekly (7 days), monthly (30) and annual (365) rolling windows against their limits. `date` defaults to `TODAY`. |
| `GET` | `/flight-hours/summary?range=1w\|1m\|3m\|6m\|1y&date=YYYY-MM-DD` | The rolling sum series for the trend chart: 7 days before `date`, the day itself and 7 days after. `range` defaults to `1w`. |
| `GET` | `/documents` | The pilot's documents with `daysRemaining` and a `status` of `valid`, `expiring` or `expired`. |
| `GET` | `/schedules?year=YYYY&month=MM` | Duty days for one month, plus the duty type legend. Defaults to the month of `TODAY`. |

Invalid input returns `400` with the messages keyed by field:

```json
{ "message": "Validation failed", "errors": { "month": ["Use a month from 1 to 12."] } }
```

A [Bruno](https://www.usebruno.com/) collection with every request is in [`bruno/`](bruno/README.md).

## Test account

| Username | Password |
| --- | --- |
| `johndoe` | `susiairtest` |

## Project structure

```
src/
├── main.ts              # Fastify adapter, /api prefix, URI versioning, CORS, cookies
├── app.module.ts        # Wires config, auth, the mock database and feature modules
├── config/              # Environment schema (zod) and typed config
├── common/
│   ├── security/        # OriginGuard: CSRF protection for cookie auth
│   ├── validation/      # Global zod validation pipe and response serializer
│   └── today.ts         # The configurable "today"
├── db/mock/             # In-memory database seeded from data/*.json
├── modules/
│   ├── auth/            # Login, refresh, logout, JWT bearer provider
│   ├── users/           # User lookup
│   ├── pilot/           # GET /pilot/me
│   ├── flight-hours/    # Daily hours, limits and the rolling sum summary
│   ├── documents/       # Document expiry status
│   └── schedules/       # Monthly schedule and legend
└── testing/             # Test app factory shared by the specs
```

Each feature module has a controller (routes and schemas), a service (logic), a repository (the only layer that reads the mock database) and DTOs (zod schemas for input and output).

## Data

The JSON files in `src/db/mock/data/` are loaded into memory when the service boots:

| File | Contents |
| --- | --- |
| `mock-flight-hours.json` | Daily flight hours from 27 Dec 2024 to 31 May 2026, limits and chart bounds |
| `mock-documents.json` | Pilot documents with expiry dates and the warning threshold |
| `mock-schedules.json` | Schedule entries for April to June 2026 and the duty type legend |
| `mock-users.json` | Test accounts |

## Deployment

The API is deployed to [Fly.io](https://fly.io) as `susi-air-pilot`, using the `Dockerfile` and `fly.toml` in this folder.

```bash
fly secrets set JWT_SECRET=<secret> CORS_ORIGIN=<frontend URL> TODAY=2026-05-15
fly deploy
```

Refresh tokens are stored in the app's memory, so `fly.toml` keeps exactly one machine always running. A second machine would not know the tokens the first one issued, and a restart signs everyone out.
