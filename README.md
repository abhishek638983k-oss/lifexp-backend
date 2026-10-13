# LifeXP Backend

LifeXP Backend is a Node.js/Express API for user accounts, gamified challenges, proof review, friends, leaderboards, and administration. It stores data in MongoDB using Mongoose.

## Contents

- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Run the server](#run-the-server)
- [API conventions](#api-conventions)
- [Authentication](#authentication)
- [API reference](#api-reference)
- [Data models](#data-models)
- [Challenge and XP workflow](#challenge-and-xp-workflow)
- [Project structure](#project-structure)
- [Operational and security notes](#operational-and-security-notes)

## Requirements

- Node.js 18 or newer (the API uses the built-in `fetch` API)
- npm
- A MongoDB database that the server can reach

## Getting started

```bash
git clone <repository-url>
cd lifexp-backend
npm install
```

Create a `.env` file in the project root (see [Configuration](#configuration)), then start the API:

```bash
npm start
```

The server listens on port `5000` by default. Set `PORT` to use a different port.

## Configuration

The server loads `.env` with `dotenv`. Configure the variables needed by the features you use:

| Variable | Required | Description |
| --- | --- | --- |
| `MONGO_URI` | Yes | MongoDB connection string. |
| `JWT_SECRET` | Yes | Secret used to sign and verify authentication tokens. Use a long, random value and keep it private. The server will not start if this is missing. |
| `PORT` | No | HTTP port; defaults to `5000`. |
| `ADMIN_SECRET` | For admin routes | Shared secret accepted in the `X-Admin-Secret` header. Alternatively, use a signed-in user whose database `role` is `admin`. |
| `GOOGLE_CLIENT_ID` | For Google sign-in | OAuth client ID checked against the Google ID token audience. |
| `GEMINI_API_KEY` | No | Enables Gemini challenge generation and AI proof assessment. Without an AI verifier, valid proof images are sent for manual admin review. |
| `GEMINI_MODEL` | No | Gemini model override. Defaults to `gemini-2.5-flash-lite`, with `gemini-2.5-flash` as a fallback. |
| `HUGGINGFACE_API_TOKEN` | No | Enables the Hugging Face CLIP verifier when Gemini is unavailable or not configured. |

Example (replace values locally; do not commit credentials):

```dotenv
MONGO_URI=mongodb://127.0.0.1:27017/lifexp
JWT_SECRET=replace-with-a-long-random-value
PORT=5000
ADMIN_SECRET=replace-with-a-long-random-value
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash-lite
HUGGINGFACE_API_TOKEN=your-huggingface-token
```

## Run the server

```bash
npm start
```

Useful endpoints after startup:

```text
GET /
GET /api/health
```

`GET /` returns `{"status":"ok","message":"LifeXP Backend Running"}` and `GET /api/health` returns `{"status":"ok"}`. The health endpoint currently reports API process health only; it does not check the MongoDB connection.

## API conventions

- Base URL for local development: `http://localhost:5000`
- API routes return JSON unless specified otherwise.
- Send JSON request bodies with `Content-Type: application/json`.
- The server accepts JSON bodies up to 6 MB.
- Routes marked **Bearer token** require `Authorization: Bearer <token>`. The middleware also accepts the token without the `Bearer ` prefix.
- A missing or invalid bearer token normally returns `401`.
- Common error shapes are `{"message":"..."}` and `{"error":"..."}`. Not-found or invalid inputs may return `400` or `404`; unexpected server errors generally return `500`.
- Unless stated otherwise, successful handlers return HTTP `200`.

## Authentication

### Sign up

`POST /api/auth/signup`

```json
{
  "username": "alex",
  "password": "choose-a-password"
}
```

Success:

```json
{ "message": "Signup success" }
```

Duplicate username returns `400` with `{"message":"User exists"}`. Passwords are stored as bcrypt hashes.

### Log in

`POST /api/auth/login`

```json
{
  "username": "alex",
  "password": "choose-a-password"
}
```

Success returns a token and user object (the password and Mongoose `__v` field are omitted):

```json
{
  "token": "<jwt>",
  "user": {
    "_id": "<user-id>",
    "username": "alex",
    "role": "user",
    "xp": 0,
    "level": 1,
    "streak": 0
  }
}
```

Use the returned token on protected routes:

```http
Authorization: Bearer <jwt>
```

### Google sign-in

`POST /api/auth/google`

```json
{ "credential": "<google-id-token>" }
```

The API validates the token with Google's token-info endpoint, checks `GOOGLE_CLIENT_ID` and the verified email, then creates or finds a user. Returns the same `{ "token", "user" }` structure as login. Missing configuration returns `500`; missing or invalid credentials return `400` or `401`.

### Change password

`POST /api/auth/change-password` — **Bearer token**

```json
{
  "currentPassword": "old-password",
  "newPassword": "new-password"
}
```

`newPassword` must have at least six characters. For accounts without a local password (for example, a Google account), `currentPassword` is not needed to set one. Success returns a message and the public user object.

## API reference

### Challenges

All `/api/challenge` routes require a bearer token.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/challenge/categories` | List challenge categories as `{ key, label }` objects. |
| `GET` | `/api/challenge/list` | List up to 200 challenges. Optional query parameters: `category`, repeated `categories`, and `difficulty`. Static challenges are seeded on first list request when no static challenges exist. |
| `POST` | `/api/challenge/get` | Select a random static or custom challenge and create an attempt for the signed-in user. |
| `POST` | `/api/challenge/rapid` | Generate and save a rapid challenge and create an attempt. |
| `POST` | `/api/challenge/seed` | Ensure static challenges exist. |
| `POST` | `/api/challenge/complete` | Submit proof for an active attempt. |
| `POST` | `/api/challenge/add` | Create a custom challenge. |

Available categories: `coding`, `fitness`, `study`, `health`, `career`, `creativity`, `mindfulness`, `finance`, `communication`, and `household`. Difficulties are `easy`, `medium`, and `hard`.

#### List challenges

Example: `GET /api/challenge/list?category=coding&difficulty=easy`

Category and difficulty values that are not recognized are ignored. The response is an array of challenge documents, with fields such as `_id`, `title`, `description`, `category`, `difficulty`, `xp`, `estimatedMinutes`, `source`, and `tags`.

#### Get a random challenge

`POST /api/challenge/get`

```json
{
  "categories": ["coding", "study"],
  "difficulty": "easy"
}
```

You can also pass one `category` instead of a `categories` array. All filters are optional. Success returns the chosen challenge and the new attempt:

```json
{
  "challenge": {
    "_id": "<challenge-id>",
    "title": "Solve one array problem",
    "category": "coding",
    "difficulty": "easy",
    "xp": 25,
    "source": "static"
  },
  "attempt": {
    "_id": "<attempt-id>",
    "status": "active",
    "startedAt": "<date>",
    "earliestCompleteAt": "<date>"
  }
}
```

No matching challenge returns `404`.

#### Get a rapid challenge

`POST /api/challenge/rapid`

```json
{
  "categories": ["fitness", "health"],
  "difficulty": "medium"
}
```

`categories` may contain multiple category keys, or pass a single `category`. Invalid or omitted categories fall back to `coding`; invalid or omitted difficulty falls back to `easy`. The response has the same `{ challenge, attempt }` shape as `/get`.

#### Seed static challenges

`POST /api/challenge/seed`

Success returns a message and counts:

```json
{
  "message": "Static challenges ready",
  "inserted": 0,
  "total": 150
}
```

The `inserted` value is the size of the seed bank when insertion runs; when static challenges already exist it is `0`.

#### Add a challenge

`POST /api/challenge/add`

```json
{
  "title": "Read a chapter",
  "description": "Read and summarize one chapter.",
  "category": "study",
  "difficulty": "easy",
  "xp": 25,
  "estimatedMinutes": 20,
  "source": "custom",
  "tags": ["reading"]
}
```

The `source` field is limited by the model to `static`, `rapid`, or `custom`. The route saves and returns `{ "message": "Challenge added", "challenge": ... }`.

#### Complete an attempt

`POST /api/challenge/complete`

```json
{
  "attemptId": "<attempt-id>",
  "proofNote": "Finished the task and attached a photo.",
  "proofImageDataUrl": "data:image/jpeg;base64,<base64-image-data>"
}
```

The attempt must belong to the signed-in user and be active. The endpoint enforces `earliestCompleteAt` returned when the attempt was created. Proof must be a PNG, JPG/JPEG, or WEBP data URL, between 1,500 bytes and 800 KB. The server JSON parser permits bodies up to 6 MB.

- Accepted by an AI verifier: response message `Completed`; user XP and attempt are updated.
- Uncertain or unavailable AI verification: proof is saved with `pending_review` status and awaits an admin decision.
- Missing, invalid, or undersized/oversized image: returns `400` with a message and attempt details where available.
- Too-early submission: returns `400` with `waitSeconds`.

### Leaderboard

Each entry contains only the public fields `_id`, `username`, `xp`, and `level`.

| Method | Path | Authorization | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/leaderboard` | Bearer token | Return the ten users with the highest XP, sorted descending. |

### Friends

All `/api/friend` routes require a bearer token. The supplied `userId` (or `:userId` path parameter) must match the ID in the token; otherwise the API returns `403`.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/friend/:userId` | Get a user's friends and incoming friend requests. |
| `POST` | `/api/friend/send` | Send a friend request by `friendId` or `username`. |
| `POST` | `/api/friend/accept` | Accept a request from another user. |

Send request:

```json
{
  "userId": "<your-user-id>",
  "friendId": "<target-user-id>"
}
```

Alternatively, supply `username` instead of `friendId`. The response contains a message and a compact friend object (`_id`, `username`, `xp`, `level`).

Accept request:

```json
{
  "userId": "<your-user-id>",
  "friendId": "<requester-user-id>"
}
```

`requestId` can be used instead of `friendId`. Getting friends returns:

```json
{
  "friends": [{ "_id": "<user-id>", "username": "sam", "xp": 50, "level": 2 }],
  "friendRequests": []
}
```

### Admin

All `/api/admin` routes accept either:

- `X-Admin-Secret: <ADMIN_SECRET>`, or
- A bearer token for a user whose database `role` is `admin`.

`ADMIN_SECRET` must be configured even when using an admin-role user. Admin list endpoints are capped (200 users/challenges and 100 attempts).

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/stats` | Counts of users, challenges, active/completed attempts, and total XP. |
| `GET` | `/api/admin/users` | List users; optional `search` matches username, email, or role. |
| `PATCH` | `/api/admin/users/:id` | Update `username`, `xp`, `level`, `streak`, and/or `role`. |
| `DELETE` | `/api/admin/users/:id` | Delete a user, their attempts, and friend references. |
| `GET` | `/api/admin/challenges` | List challenges; optional `search` matches title, category, difficulty, or source. |
| `POST` | `/api/admin/challenges` | Create a challenge (defaults `source` to `custom`). |
| `POST` | `/api/admin/challenges/generate` | Generate challenge ideas using Gemini. |
| `PATCH` | `/api/admin/challenges/:id` | Update challenge fields. |
| `DELETE` | `/api/admin/challenges/:id` | Delete a challenge. |
| `GET` | `/api/admin/attempts` | List attempts; optional `status` and `search` filters. |
| `POST` | `/api/admin/attempts/:id/approve` | Approve an attempt and award XP. |
| `POST` | `/api/admin/attempts/:id/reject` | Reject an attempt. |

User update example:

```json
{
  "xp": 250,
  "role": "admin"
}
```

When `xp` changes without an explicit `level`, the API recalculates level. Challenge create/update bodies use the challenge fields described above.

Generate challenge ideas:

```json
{
  "category": "coding",
  "difficulty": "easy",
  "count": 5
}
```

Returns `{ "ideas": [...] }`. `GEMINI_API_KEY` is required for this endpoint. Attempt approval/rejection optionally accepts `{"feedback":"Review note"}`.

### Utility endpoints

| Method | Path | Authorization | Response |
| --- | --- | --- | --- |
| `GET` | `/` | None | `{"status":"ok","message":"LifeXP Backend Running"}` |
| `GET` | `/api/health` | None | `{"status":"ok"}` |
| `GET` | `/test` | None | Plain text `Test route working`. |

## Data models

The following are the main persisted fields; MongoDB documents also include `_id`, and timestamped models include `createdAt` and `updatedAt`.

### User

- Identity: `username`, optional `email`, optional `googleId`, `authProvider` (`local` or `google`), and `role` (`user` or `admin`)
- Progress: `xp`, `level`, `streak`, `lastCompleted`, and category-wise `categoryXP`
- Social: `friends` and `friendRequests` (User references)
- Password: bcrypt hash for local-password accounts

### Challenge

- `title`, `description`, `category`, `difficulty`, `xp`, `estimatedMinutes`
- `source`: `static`, `rapid`, or `custom`
- `tags` and optional unique `seedKey`

### ChallengeAttempt

- References: `user`, `challenge`
- `status`: `active`, `pending_review`, `completed`, `rejected`, or `expired`
- Challenge snapshot fields: `category`, `difficulty`, `source`, `xp`
- Timing: `startedAt`, `earliestCompleteAt`, `completedAt`, `reviewedAt`
- Proof: `proofNote`, `proofImageDataUrl`, `proofImageMime`, `proofImageSize`
- Review: `proofStatus` (`not_submitted`, `manual_review`, `approved`, or `rejected`), `proofScore`, `proofFeedback`

## Challenge and XP workflow

1. A user asks for a challenge with `/api/challenge/get` or `/api/challenge/rapid`. A new `active` attempt is created and the response includes when it can first be completed.
2. The user submits an image and optional note to `/api/challenge/complete`.
3. Gemini is used for image assessment when configured. If that cannot produce a result, Hugging Face CLIP is used when configured; otherwise proof waits for manual review.
4. AI-approved proof or admin approval marks the attempt completed and awards the challenge XP to the user and the matching `categoryXP`. Level is recalculated from XP, and the completion streak is updated.
5. Uncertain proof is saved as `pending_review`; admins can approve or reject it through the attempt endpoints.

## Project structure

```text
config/       MongoDB connection
controllers/  Request handlers and application logic
data/         Static challenge catalog and rapid challenge builder
middleware/   Authentication and admin authorization
models/       Mongoose schemas
routes/       Express route definitions
services/     Gemini integration and proof verification
server.js     Express app setup and HTTP server
```

## Operational and security notes

- `JWT_SECRET` must be configured as a long, random environment variable; the server refuses to start without it.
- The leaderboard exposes only `_id`, `username`, `xp`, and `level`. Friend routes enforce that the requested user ID matches the authenticated user.
- `ADMIN_SECRET` is a bearer-style shared credential; keep it private and use HTTPS in deployed environments.
- AI proof evaluation is an automated aid, not a guarantee. Uncertain results are routed to manual review.
- The database connection is started when `server.js` loads. The HTTP listener is started independently; `/api/health` does not verify database readiness.
