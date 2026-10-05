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
    "image_url": "https://i.pravatar.cc/120?u=udin"
  }
}
```

| Status | When |
| --- | --- |
| `200` | Valid credentials |
| `400` | `username` or `password` missing or blank; the body lists the field errors |
| `401` | Wrong password or unknown user (the same message for both) |

## Test accounts

The API runs on mock data from `src/db/mock/data/mock-users.json`:

| Username | Password |
| --- | --- |
| `johndoe` | `susiairtest` |
| `udin` | `susiairtest` |

## Calling protected endpoints

Every route except login needs the access token from Auth Login:

```
Authorization: Bearer <accessToken>
```

Access tokens expire after `expiresIn` seconds (15 minutes by default, `JWT_ACCESS_TTL` in `.env`). Get a new one with `POST /auth/refresh`, which uses the refresh token cookie and rotates it: each refresh token works once, and sending a used one again signs that session out everywhere. `POST /auth/logout` revokes it.

Refresh tokens are kept in memory, so restarting the API (including `start:dev` reloading after a code change) signs everyone out.

## Adding requests

- Create requests from Bruno so the files stay in its format, one `.yml` file per request in `susi-air/`.
- Number them with `seq` in the order they should appear.
- Start every URL with `{{baseUrl}}` rather than a hardcoded host, so requests work in every environment.
