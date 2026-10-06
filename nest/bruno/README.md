# Bruno collection

API requests for the Susi Air backend, saved as a [Bruno](https://www.usebruno.com/) collection so they live in git next to the code.

## Getting started

1. Start the API from `nest/`:

   ```bash
   npm run start:dev
   ```

   It listens on `http://localhost:3001` by default (`PORT` in `.env`, see `.env.example`).

2. In Bruno, choose **Open Collection** and select the `nest/bruno/susi-air` folder.

3. Check the **Local** environment is selected (top right; it's the collection default), then open a request and send it.

## Environments

Requests build their URL from the `baseUrl` variable, e.g. `{{baseUrl}}/auth/login`.

| Environment | File | `baseUrl` |
| --- | --- | --- |
| Local (default) | `susi-air/environments/local.yml` | `http://localhost:3001/api/v1` |

- If you run the API on another port, change `baseUrl` in the Local environment.
- For another server (staging, production), add an environment in Bruno with its own `baseUrl`. Bruno saves it as a new file in `susi-air/environments/`.
- Mark tokens, passwords and keys as **secret** in Bruno, and check what a new environment file contains before you commit it.

## Requests

| Request | Method and URL | Auth |
| --- | --- | --- |
| Auth Login | `POST {{baseUrl}}/auth/login` | Public |
| Auth Refresh | `POST {{baseUrl}}/auth/refresh` | Refresh token cookie |
| Auth Logout | `POST {{baseUrl}}/auth/logout` | Refresh token cookie |
| Pilot Me | `GET {{baseUrl}}/pilot/me` | `Bearer {{accessToken}}` |
| Flight Hours Limits | `GET {{baseUrl}}/flight-hours/limits?date=2026-05-15` | `Bearer {{accessToken}}` |
| Documents | `GET {{baseUrl}}/documents` | `Bearer {{accessToken}}` |
| Flight Hours Summary | `GET {{baseUrl}}/flight-hours/summary?range=1w&date=2026-05-15` | `Bearer {{accessToken}}` |
| Schedules | `GET {{baseUrl}}/schedules?year=2026&month=5` | `Bearer {{accessToken}}` |
| Flight Hours | `GET {{baseUrl}}/flight-hours?from=2026-05-01&to=2026-05-07` | `Bearer {{accessToken}}` |

### Auth Login

Signs in with a username and password. A successful response returns the access token and the user, and sets the refresh token as an `httpOnly` cookie (`susi_refresh_token`, sent only to `/api/v1/auth`). Bruno keeps that cookie for you:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs…",
  "expiresIn": 900,
  "user": {
    "id": "c9542e84-fe0d-4d20-9552-638b7771f8b8",
    "name": "Udin Sedunia",
    "username": "udin",
    "imageUrl": "https://i.pravatar.cc/120?u=udin"
  }
}
```

| Status | When |
| --- | --- |
| `200` | Valid credentials |
| `400` | `username` or `password` missing or blank; the body lists the field errors |
| `401` | Wrong password or unknown user (the same message for both) |

### Flight Hours Limits

The signed-in pilot's hours in each rolling window ending on `date`, against its limit: daily (that day), weekly (7 days), monthly (30) and annual (365). `status` is `within`, `approaching` (80% of the limit or more), `at_limit` or `over`; `remaining` goes negative when over.

`date` is set to `2026-05-15`, the same simulated today the frontend reads from `TODAY` in `nuxt/.env`, because the mock log ends on 2026-05-31. Disable the parameter to use the server's today (UTC). A malformed date returns `400`.

### Documents

The signed-in pilot's documents, soonest expiry first, each with `daysRemaining` and a `status`: `expired` from the expiry date on, `expiring` within 30 days of it (`thresholds.warningDays` in the mock data), `valid` before that. There's no `date` parameter: they're measured from the mock data's own today (2026-05-31), returned as `date`.

### Flight Hours Summary

Data for the home page's trend chart. For `range` (`1w`, `1m`, `3m`, `6m`, `1y`; default `1w`) it returns the window, limit and suggested axis `max`, the rolling total on `date` (`today`, with `remaining` and `status`), and 15 `points`: the rolling total on each day from 7 days before `date` to 7 after, each with a `status` and `projected: true` for days after `date`. `date` works as in Flight Hours Limits.

### Schedules

The signed-in pilot's duty days in one month: each with its `dutyType`, `baseName` (the base airport on duty days, else the duty code) and `baseColor`, `status` (`upcoming` or `completed`), and how many of the day's `countSchedules` are logged (`countLogbooks`). Also returns the duty `legend` and `available`, the first and last month that have duties (the mock data covers April to June 2026). Without `year` and `month` it loads the month of the API's `TODAY`; an invalid one returns `400`.

### Flight Hours

The signed-in pilot's logged hours for each day from `from` to `to`, both inclusive, oldest first, as `[{ "date": "2026-05-01", "hours": 3.8 }, …]`. Leave out `from` or `to` to leave that side open; leave out both for the whole log (2024-12-27 to 2026-05-31). A malformed date, or a `to` before `from`, returns `400`.

## Test accounts

The API runs on mock data from `src/db/mock/data/mock-users.json`:

| Username | Password |
| --- | --- |
| `johndoe` | `susiairtest` |
| `udin` | `susiairtest` |

## Calling protected endpoints

Every route except login needs the access token from Auth Login. Copy it into the environment's secret `accessToken` variable; protected requests send it as:

```
Authorization: Bearer <accessToken>
```

Access tokens expire after `expiresIn` seconds (15 minutes by default, `JWT_ACCESS_TTL` in `.env`). Get a new one with `POST /auth/refresh`, which uses the refresh token cookie and rotates it: each refresh token works once, and sending a used one again signs that session out everywhere. `POST /auth/logout` revokes it.

Refresh tokens are kept in memory, so restarting the API (including `start:dev` reloading after a code change) signs everyone out.

## Adding requests

- Create requests from Bruno so the files stay in its format, one `.yml` file per request in `susi-air/`.
- Number them with `seq` in the order they should appear.
- Start every URL with `{{baseUrl}}` rather than a hardcoded host, so requests work in every environment.
