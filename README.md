# Hamro Samadhan — Backend API

REST API for a civic complaint system. Citizens file reports about road, waste,
water and infrastructure problems; municipal staff log in to an admin portal to
route each report to a department and update its status. The reporter is emailed
at every change, and follows progress through a tracking link.

- **Runtime:** Node.js + Express 5 (CommonJS)
- **Database:** MongoDB via Mongoose 9
- **Auth:** opaque server-side session tokens, SHA-256 hashed, stored in Mongo
- **Images:** Cloudinary
- **Email:** Resend
- **Validation:** Joi
- **Security:** helmet, cors, express-rate-limit, bcrypt

---

## Table of contents

- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [npm scripts](#npm-scripts)
- [One-off maintenance scripts](#one-off-maintenance-scripts)
- [Seeding the first admin](#seeding-the-first-admin)
- [Authentication](#authentication)
- [Response conventions](#response-conventions)
- [Error responses](#error-responses)
- [Rate limits](#rate-limits)
- [Endpoints](#endpoints)
  - [Auth](#auth-apiauth)
  - [Categories](#categories-apicategories)
  - [FAQs](#faqs-apifaqs)
  - [Reports](#reports-apireports)
  - [Admin](#admin-apiadmin)
- [Email notifications](#email-notifications)
- [Data reference](#data-reference)
- [Project structure](#project-structure)
- [Middleware order](#middleware-order)
- [Frontend integration notes](#frontend-integration-notes)
- [Known gaps](#known-gaps)

---

## Quick start

Requires Node.js 18+ and a running MongoDB (local `mongod` or Atlas).

```bash
cd Backend
npm install
```

Create `Backend/.env` from the
[table below](#environment-variables). `.env` is gitignored — never commit it.

```bash
npm run seed:admin         # the first admin account
npm run seed:departments   # the 12 starter departments
npm run seed:faq           # the 10 starter FAQ entries
npm run dev                # nodemon, restarts on save
```

The server listens on `PORT`, or `5000` if `PORT` is unset.

Check it is alive:

```bash
curl http://localhost:5000/api/categories
# {"success":true,"count":18,"categories":[...]}
```

A JSON 404 confirms routing is up even on an unknown path:

```bash
curl http://localhost:5000/api/nope
# {"success":false,"message":"Route not found: GET /api/nope"}
```

There is no health endpoint and no request log — `server.js` prints one line on
startup and `db.js` prints one line on connect.

---

## Environment variables

Loaded from `.env` by `dotenv` in `src/app.js`. Never commit this file.

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGOOSE_URL` | **Yes** | MongoDB connection string. The app `process.exit(1)`s without it. |
| `PORT` | No | Port to listen on. Defaults to `5000`. |
| `NODE_ENV` | No | Informational only. The session cookie's `Secure`/`SameSite` follow the protocol the request arrived on, not this value. |
| `CLIENT_URL` | **Yes** in production | Browser origin allowed by CORS. Defaults to `http://localhost:5173`, which blocks a deployed frontend entirely. The server logs a warning on boot in production without it. |
| `CLOUDINARY_CLOUD_NAME` | **Yes** | Cloudinary account name, for report photos. |
| `CLOUDINARY_API_KEY` | **Yes** | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | **Yes** | Cloudinary API secret. |
| `GMAIL_USER` | No | Gmail address used as the SMTP sender. Without it, every send fails and is swallowed. |
| `GMAIL_APP_PASSWORD` | No | 16-character Google app password for `GMAIL_USER`. Use an app password, not the normal Gmail password. |
| `TRUST_PROXY_HOPS` | No | Number of reverse proxies in front of the app. Needed in production so rate limiting sees real client IPs. |
| `CLIENT_URL` (multi) | No | `CLIENT_URL` also accepts a **comma separated** list of origins, for when the frontend is reachable on more than one host (Vercel production + preview). |
| `ADMIN_EMAIL` | No | Only read by `scripts/setStatus.js`. |
| `ADMIN_PASSWORD` | No | Only read by `scripts/setStatus.js`. |

Example `.env`:

```dotenv
PORT=5000
MONGOOSE_URL=mongodb://127.0.0.1:27017/hamro_samadhan
NODE_ENV=development
CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

GMAIL_USER=your-gmail-address@gmail.com
GMAIL_APP_PASSWORD=your-16-character-gmail-app-password

TRUST_PROXY_HOPS=0
```

> There is **no** `JWT_SECRET`. Auth is an opaque random token, not a JWT, so
> nothing is signed. `jsonwebtoken` is still listed in `package.json` but is no
> longer imported anywhere — it is dead weight and can be removed.

---

## npm scripts

| Script | Command | What it does |
| --- | --- | --- |
| `npm run dev` | `nodemon src/server.js` | Development, restarts on save. |
| `npm start` | `node src/server.js` | Production. |
| `npm run seed:admin` | `node scripts/seedAdmin.js` | Creates the first admin if missing. |
| `npm run seed:departments` | `node scripts/seedDepartments.js` | Adds the 12 starter departments. |
| `npm run seed:faq` | `node scripts/seedFaq.js` | Adds the 10 starter FAQ entries. |
| `npm run set:status` | `node scripts/setStatus.js` | Changes a report's status through the API. See below. |

There is no test script and no linter configured. There are no tests in the repo.

---

## One-off maintenance scripts

These are not in `package.json` — run them directly with `node`. Each connects to
Mongo, does its work, and closes the connection.

### `scripts/setAdminPassword.js`

Sets a strong password for an existing admin and prints it. Generate one (the
second argument is optional — a random 12-byte value is used if you omit it):

```bash
node scripts/setAdminPassword.js admin@hamrosamadhan.com
```

It is printed once and never stored in plain text, so copy it immediately.

### `scripts/backfillReportTokens.js`

Reports created before `publicToken` existed have none, which would leave their
tracking links permanently dead. This fills in a token for every report that is
missing one, and prints the full tracking URL for each:

```bash
node scripts/backfillReportTokens.js
```

It only touches documents where the field is absent, so re-running is safe and it
never rotates a token a citizen is already using.

### `scripts/setStatus.js`

Changes a report's status **through the API** rather than in Mongo, so the
reporter still gets emailed. Editing the document directly skips the controller
and sends nothing.

The **server must already be running**, and `ADMIN_EMAIL` / `ADMIN_PASSWORD` must
be set in `.env`:

```bash
node scripts/setStatus.js HS-2026-000017 IN_PROGRESS "Work has started"
npm run set:status -- HS-2026-000017 RESOLVED
```

It resolves the public `reportId` to a Mongo `_id` itself, so you only need the
ID the citizen was given.

---

## Seeding the first admin

There is no public sign-up endpoint. Staff accounts are created by a script:

```bash
npm run seed:admin
```

It creates this account if it does not already exist:

| Field | Value |
| --- | --- |
| Name | `system admin` |
| Email | `admin@hamrosamadhan.com` |
| Password | `hamrosamadhan@123` |
| Role | `admin` |

> **Change this password immediately.** The credentials are hardcoded in
> `scripts/seedAdmin.js`, the password is published in this file, and the script
> skips creation when the email already exists — so it will never overwrite your
> change. Run it once, then immediately run
> `node scripts/setAdminPassword.js admin@hamrosamadhan.com`.

Re-running is safe: it prints `Admin already exists` and exits.

### `npm run seed:departments`

Inserts 12 departments, chosen so every one of the complaint categories maps to
at least one of them:

Waste Management · Road Maintenance · Road Obstacle Removal · Street Light ·
Water Supply · Drainage and Sewerage · Traffic · Public Infrastructure ·
Sanitation and Pest Control · Electrical Maintenance · Greenary and Environment ·
General Administration

It skips any name that already exists, so it will not overwrite departments an
admin has renamed or edited, and re-running adds nothing.

### `npm run seed:faq`

Inserts 10 FAQ entries, each with English and Nepali (`questionNe` / `answerNe`)
text. It checks the count first and inserts nothing if any row already exists.

---

## Authentication

`POST /api/auth/login` creates a **server-side session** and sets its token in an
HTTP-only cookie named `token`. The token is **not** returned in the response
body.

**Why not a JWT:** a JWT cannot be revoked, so a stolen token stayed usable until
it expired and logout was cosmetic. Instead, `Session.createForUser` generates 32
random bytes, returns the raw token to the client, and stores only its SHA-256
hash. `POST /api/auth/logout` deletes the row, which genuinely ends the session.

| Property | Value |
| --- | --- |
| Token | 32 random bytes, hex encoded (64 characters) |
| Stored as | SHA-256 hash — a database leak cannot be replayed as a login |
| Lifetime | 15 minutes |
| Expiry | A Mongo TTL index on `expiresAt` deletes the row, so dead sessions never pile up |
| Cookie | `HttpOnly`, `Path=/`, `Max-Age=900`. `SameSite=Lax` over http, `None` + `Secure` over https |
| Same secret again | `Bearer` header also accepted, for non-browser clients |

`authMiddleware` (`src/middleware/auth.js`) takes the token from either place:

1. `Authorization: Bearer <token>` header
2. the `token` cookie

It looks the session up with an expiry condition, populates the user, and sets
`req.user = { userId, role, name, email }` plus `req.sessionToken`. Because the
user is re-read from the database on **every** request, disabling an account or
changing a role takes effect immediately rather than when the token expires.

`requireAdmin` is a second, separate gate that returns `403` unless
`req.user.role === "admin"`. It is kept out of `authMiddleware` on purpose, so it
cannot be forgotten silently — but it still has to be added to each route by
hand, which is the one thing worth checking when you add a route.

The `User` schema's `role` enum is `["admin"]` only, so today every account is an
admin. `requireAdmin` is what makes adding a second role safe later.

### Using a session cookie (browser / curl)

```bash
# save the cookie to a jar
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hamrosamadhan.com","password":"hamrosamadhan@123"}' \
  -c cookies.txt

# reuse it
curl http://localhost:5000/api/auth/me -b cookies.txt
```

### Using a bearer token (server-to-server)

```bash
TOKEN=$(grep token cookies.txt | awk '{print $7}')

curl http://localhost:5000/api/auth/me -H "Authorization: Bearer $TOKEN"
```

### JavaScript client

```js
// credentials: "include" is required or the browser drops the cookie
const res = await fetch("http://localhost:5000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    email: "admin@hamrosamadhan.com",
    password: "hamrosamadhan@123",
  }),
});
```

The cookie's `Secure` and `SameSite` are derived from the request that logged in,
not from `NODE_ENV`: an https request (directly, or as `X-Forwarded-Proto` from
Render's proxy) gets `SameSite=None; Secure`, an http request gets `SameSite=Lax`.

This matters because a `Secure` cookie set over plain http is accepted by the
browser and then silently discarded. Login returns `200`, the dashboard loads,
and every subsequent admin call arrives with no `Cookie` header and gets a `401`.
That is the failure mode to look for if admin auth appears to work on one machine
and not another.

Set `CLIENT_URL` to the browser origin to change what CORS allows
(`src/config/cors.js`). It accepts a comma separated list, which is what a Vercel
deploy needs because the production and preview hostnames are different, and
trailing slashes are stripped so a URL pasted from the address bar still matches:

```dotenv
CLIENT_URL=https://hamrosamadhan.vercel.app,https://hamro-samadhan-git-main.vercel.app
```

A request from an origin that is not on the list gets no
`Access-Control-Allow-Origin` header and is refused at the preflight, so the
browser blocks it. A request with **no** `Origin` header at all (curl, a server
side call) is allowed, since there is no cookie to protect.

Because sessions last 15 minutes, any long-lived dashboard will eventually get a
`401`. The frontend handles that with a global response interceptor that drops
the admin back to the login page.

---

## Response conventions

Every endpoint returns JSON. Successful responses set `success: true`; every
error sets `success: false` with a human-readable `message`.

| Endpoint | Extra top-level keys |
| --- | --- |
| `POST /api/auth/login` | `user` |
| `GET /api/auth/me` | `user` |
| `GET /api/reports` | `count`, `total`, `page`, `limit`, `totalPages`, `reports` |
| `GET /api/admin` | `count`, `departments` |
| `GET /api/admin/stats` | `stats` |
| `GET /api/admin/reports/:id/updates` | `count`, `updates` |

---

## Error responses

| Status | When | Body / message |
| --- | --- | --- |
| `400` | Joi validation failed | `{ success: false, message: "Validation error", errors: ["..."] }` |
| `400` | Required field missing in a controller | `"All fields are required"` |
| `400` | `location` / `reporter` was not valid JSON | `"Location and reporter must be valid JSON"` |
| `400` | `location` / `reporter` missing inner fields | `"Location and reporter information are required"` |
| `400` | `image` is not an `image/*` mimetype | `"Only image files are allowed"` (see caveat below) |
| `400` | `image` bytes are not a real image | `"File content is not a valid image"` (see caveat below) |
| `400` | Unknown `status` / `priority` value | `"Invalid status"` |
| `400` | `departmentId` missing on assign | `"Department ID is required"` |
| `400` | Login body missing fields | `"Email and Password are required"` |
| `401` | No token sent | `"Authentication required"` |
| `401` | Token unknown, expired, or account disabled | `"Invalid or expired session"` |
| `401` | Wrong email **or** wrong password **or** disabled account | `"Invalid email or password"` |
| `403` | Signed in but not an admin | `"Admin access required"` |
| `404` | Resource not found | `"Report not found"`, `"Department not found"`, `"Active department not found"`, `"User not Found"`, `"report not found"` |
| `404` | Unknown path | `"Route not found: GET /api/nope"` |
| `409` | Department name already taken | `"A department with that name already exists"` |
| `429` | Rate limit hit | `"Too many login attempts. Please try again later."` / `"Too many requests. Please slow down."` |
| `500` | Unhandled server error | `"Internal server error"` |

**Login never confirms whether an email exists.** An unknown email, a wrong
password and a disabled account all return the same `401` with the same message.
An unknown email still runs a bcrypt compare against a dummy hash, so the response
time does not leak it either.

### Validation error example

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "\"title\" is required",
    "\"category\" must be one of [road_damage, road_blockage, ...]"
  ]
}
```

A bad `location` / `reporter` JSON string keeps the inner reason, so the client
is not left with a bare "invalid":

```json
{
  "success": false,
  "message": "Validation error",
  "errors": ["location is invalid: \"address\" is required"]
}
```

> **Caveat — upload errors are not JSON.** The two upload failures above are
> raised with `next(err)` and there is no Express error-handling middleware, so
> they come back as an HTML error page rather than the JSON shape above. A file
> over 5 MB does the same thing but with a `500`, because multer's own error
> carries no status. Everything else in this table is JSON.

---

## Rate limits

| Scope | Window | Limit | Notes |
| --- | --- | --- | --- |
| `POST /api/auth/login` | 15 min per IP | 5 | Only **failed** attempts count (`skipSuccessfulRequests`). |
| All of `/api/*` | 15 min per IP | 300 | Applied in `src/app.js`. |

Both send draft-8 `RateLimit` headers and treat an IPv6 `/56` as one visitor.
Behind a proxy, set `TRUST_PROXY_HOPS` or every request appears to come from the
proxy and the limits lock out all users at once.

---

## Endpoints

Base URL: `http://localhost:5000/api`

| # | Method | Path | Auth | Purpose |
| --- | --- | --- | --- | --- |
| 1 | `POST` | `/api/auth/login` | No | Log in, sets the `token` cookie |
| 2 | `GET` | `/api/auth/me` | Admin | Current user profile |
| 3 | `POST` | `/api/auth/logout` | Session | Revoke the session, clear the cookie |
| 4 | `GET` | `/api/categories` | No | Complaint category list (the form does not use it) |
| 5 | `GET` | `/api/faqs` | No | Active FAQ entries |
| 6 | `POST` | `/api/reports` | No | Submit a report (multipart, optional image) |
| 7 | `GET` | `/api/reports/:reportId?token=` | No | Public report lookup, full detail with `token` |
| 8 | `GET` | `/api/reports` | Admin | List reports, filtered and paged |
| 9 | `POST` | `/api/admin` | Admin | Create a department |
| 10 | `GET` | `/api/admin` | Admin | List all departments |
| 11 | `GET` | `/api/admin/stats` | Admin | Dashboard counters and 7-day trend |
| 12 | `GET` | `/api/admin/reports/:id` | Admin | Full report document |
| 13 | `GET` | `/api/admin/reports/:id/updates` | Admin | Change history, newest first |
| 14 | `PATCH` | `/api/admin/:id/department` | Admin | Assign a department to a report |
| 15 | `PATCH` | `/api/admin/:id/status` | Admin | Change status, writes history, emails |
| 16 | `PATCH` | `/api/admin/:id/priority` | Admin | Change priority, emails |
| 17 | `PATCH` | `/api/admin/:id` | Admin | Update a department |

"Auth: Admin" means `authMiddleware` **and** `requireAdmin`. Endpoint 3 needs a
valid session but not the admin role.

---

## Auth (`/api/auth`)

### 1. `POST /api/auth/login`

Public. No auth middleware. Rate limited to 5 **failed** attempts per 15 minutes.

**Request**

| Field | Type | Rules |
| --- | --- | --- |
| `email` | string | required, valid email, matched case-insensitively |
| `password` | string | required, min 6 characters |

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hamrosamadhan.com",
    "password": "hamrosamadhan@123"
  }' \
  -c cookies.txt
```

**`200 OK`** — also sets `Set-Cookie: token=...; HttpOnly; Path=/; Max-Age=900`

```json
{
  "success": true,
  "user": {
    "id": "66f1a2b3c4d5e6f7a8b9c0d1",
    "name": "system admin",
    "email": "admin@hamrosamadhan.com",
    "role": "admin"
  }
}
```

Note the key is `id` here, not `_id`.

**Errors:** `400` missing fields · `401` wrong password, unknown email or disabled
account · `429` too many attempts

---

### 2. `GET /api/auth/me`

Requires a valid session **and** the `admin` role. The password hash is stripped.

```bash
curl http://localhost:5000/api/auth/me -b cookies.txt
```

**`200 OK`**

```json
{
  "success": true,
  "user": {
    "_id": "66f1a2b3c4d5e6f7a8b9c0d1",
    "name": "system admin",
    "email": "admin@hamrosamadhan.com",
    "role": "admin",
    "isActive": true,
    "createdAt": "2026-01-04T10:12:00.000Z",
    "updatedAt": "2026-01-04T10:12:00.000Z"
  }
}
```

**Errors:** `401` no or invalid session · `403` not an admin

---

### 3. `POST /api/auth/logout`

Deletes the session row, then clears the cookie. Deleting the row is the part
that matters — clearing the cookie alone would leave a copied token usable.

```bash
curl -X POST http://localhost:5000/api/auth/logout -b cookies.txt
```

**`200 OK`**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Errors:** `401` no or invalid session

---

## Categories (`/api/categories`)

### 4. `GET /api/categories`

Public and static — read from `src/constants/categories.js`, no database. Kept
for anything that wants to read the list over HTTP; the report form itself does
**not** call it, see [Report categories](#report-categories) below.

```bash
curl http://localhost:5000/api/categories
```

**`200 OK`**

```json
{
  "success": true,
  "count": 18,
  "categories": [
    { "value": "road_damage", "label": "Road Damage" },
    { "value": "road_blockage", "label": "Road Blockage" },
    { "value": "street_light", "label": "Street Light" },
    { "value": "waste", "label": "Waste Management" },
    { "value": "water_leakage", "label": "Water Leakage" },
    { "value": "drainage", "label": "Drainage" },
    { "value": "traffic_signal", "label": "Traffic Signal" },
    { "value": "fallen_tree", "label": "Fallen Tree" },
    { "value": "public_infrastructure", "label": "Public Infrastructure" },
    { "value": "electricity", "label": "Electricity" },
    { "value": "sanitation", "label": "Sanitation" },
    { "value": "pollution", "label": "Pollution" },
    { "value": "animals", "label": "Stray Animals" },
    { "value": "construction", "label": "Construction Issue" },
    { "value": "park", "label": "Park & Playground" },
    { "value": "safety", "label": "Public Safety" },
    { "value": "noise", "label": "Noise Complaint" },
    { "value": "other", "label": "Other" }
  ]
}
```

The same file exports `categoryValues`, which is what both the Mongoose `enum`
and the Joi schema validate against.

---

## FAQs (`/api/faqs`)

### 5. `GET /api/faqs`

Public. Returns only `isActive` entries, sorted by `order` then `createdAt`, so
the page order is decided in the database. Inactive entries keep their place and
are simply not returned.

```bash
curl http://localhost:5000/api/faqs
```

**`200 OK`**

```json
{
  "success": true,
  "count": 2,
  "faqs": [
    {
      "_id": "66f1a2b3c4d5e6f7a8b9c0d1",
      "question": "What is Hamro Samadhan?",
      "answer": "It is a public service platform where citizens report problems ...",
      "questionNe": "हाम्रो समाधान के हो?",
      "answerNe": "यो एक सार्वजनिक सेवा प्लेटफर्म हो ...",
      "order": 1,
      "isActive": true,
      "createdAt": "2026-01-04T08:00:00.000Z",
      "updatedAt": "2026-01-04T08:00:00.000Z"
    }
  ]
}
```

The Nepali columns are optional and default to `""`, so a question can be added
in English first and translated later. There is no write endpoint for FAQs — the
collection is seeded and then edited directly in the database.

---

## Reports (`/api/reports`)

### 6. `POST /api/reports`

Submits a report. **`multipart/form-data`** — `location` and `reporter` must be
sent as JSON *strings*, because nested objects cannot be sent as form fields.

The image is optional: one file, field name exactly `image`, max 5 MB, mimetype
`image/*`, and the real bytes are checked against the JPEG/PNG/GIF/WebP magic
numbers before the request proceeds. Accepted files are streamed from memory
straight to Cloudinary under `hamro-samadhan/reports`; nothing touches disk.

| Field | Type | Rules |
| --- | --- | --- |
| `title` | string | required, trimmed, max 150 |
| `category` | string | required, one of the 18 categories |
| `description` | string | required, trimmed, max 2000 |
| `location` | JSON string | required. `address` max 300, required, and rejected if it looks like an email; `latitude` −90..90 and `longitude` −180..180 optional |
| `reporter` | JSON string | required. `name` max 100, `email` valid, `phone` **exactly 10 digits** |
| `image` | file | optional |

`phone` must match `/^[0-9]{10}$/` — no spaces, no `+977` prefix, no hyphens or
brackets. Format it client-side before sending.

```bash
curl -X POST http://localhost:5000/api/reports \
  -F "title=Railing broken near the bus park" \
  -F "category=public_infrastructure" \
  -F "description=The east-side railing is snapped loose and hanging over the road." \
  -F 'location={"address":"Bus Park, Rato Bangala","latitude":27.6789,"longitude":85.3123}' \
  -F 'reporter={"name":"Sita Rai","email":"sita.rai@example.com","phone":"9812345678"}' \
  -F "image=@./photo.jpg"
```

**`201 Created`**

```json
{
  "success": true,
  "message": "Report submitted successfully",
  "reportId": "HS-2026-000042",
  "publicToken": "f6d804da6ea824351e192c16aefcc920ea96fc8ed9a5e09f"
}
```

The `reportId` is a readable sequential ID (`HS-<year>-<6 digits>`) so a citizen
can quote it over the phone. It is separate from the Mongo `_id`, and on its own
it is enough to track the report — see endpoint 7.

`publicToken` is returned **once, here, and never again**. It is the key to the
un-redacted view of this specific report, so the client must keep it. The
frontend stores it in `localStorage` under `hs:reportToken:<reportId>` and sends
it back as `?token=` when that report is tracked. Nothing else in the API ever
exposes it — not the public lookup, not the admin views.

```js
const form = new FormData();
form.append("title", "Railing broken near the bus park");
form.append("category", "public_infrastructure");
form.append("description", "The east-side railing is snapped loose.");
form.append("location", JSON.stringify({ address: "Bus Park, Rato Bangala" }));
form.append("reporter", JSON.stringify({
  name: "Sita Rai",
  email: "sita.rai@example.com",
  phone: "9812345678",
}));
form.append("image", imageFile);

const res = await fetch("http://localhost:5000/api/reports", {
  method: "POST",
  body: form,          // do not set Content-Type, the browser adds the boundary
});
```

A confirmation email is sent to the reporter. It is best effort — a mail failure
is logged and the report is still created.

**Errors:** `400` missing field, bad JSON, bad image, or validation failure ·
`500` Cloudinary or database error

---

### 7. `GET /api/reports/:reportId?token=...`

Public lookup. `reportId` must match `/^HS-\d{4}-\d{6}$/`. The `token` query param
is **optional** and, when present, must be 48 hex characters.

Report IDs are sequential, so anyone can walk `HS-2026-000001` upwards. A lookup
by ID alone is therefore trimmed to what is needed to follow progress — status,
priority, assigned department and the update timeline. The report's `description`,
`photo` and `location` are only returned when the **tracking token** is supplied
too, which proves the caller is the person who filed it.

So: a citizen who only has their report ID can still track their complaint
freely, and a script walking every ID harvests statuses but not a map of where
people live. The citizen who filed it gets the full view, because the browser
that submitted the report kept the token from the `201` response.

```bash
# by ID alone, redacted
curl "http://localhost:3000/api/reports/HS-2026-000042"

# with the tracking token, full detail
curl "http://localhost:3000/api/reports/HS-2026-000042?token=<48-hex-token>"
```

**`200 OK`** — by ID alone

```json
{
  "success": true,
  "report": {
    "reportId": "HS-2026-000042",
    "title": "Railing broken near the bus park",
    "category": "public_infrastructure",
    "status": "UNDER_REVIEW",
    "assignedDepartment": { "_id": "66f1...", "name": "Roads Department" },
    "priority": "MEDIUM",
    "updates": [
      {
        "_id": "66f2...",
        "status": "UNDER_REVIEW",
        "message": "Site visit scheduled.",
        "createdAt": "2026-01-06T09:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-05T07:31:00.000Z",
    "description": null,
    "photo": null,
    "location": null
  }
}
```

**`200 OK`** — with a valid `token`, the same object plus:

```json
{
  "description": "The east-side railing is snapped loose and hanging over the road.",
  "photo": { "url": "https://res.cloudinary.com/.../photo.jpg" },
  "location": {
    "address": "Bus Park, Rato Bangala",
    "latitude": 27.6789,
    "longitude": 85.3123
  }
}
```

Every key is always present, so clients can rely on the shape; the redacted ones
are `null` rather than missing. `null` location also means the tracking page
shows "no address" instead of dropping a pin.

Both views hide `_id`, `reporter` (name, email, phone), `publicToken`, and the
photo's Cloudinary `publicId`. `updates` are oldest-first so they read as a
timeline.

**Errors:** `400` malformed `reportId`, or `token` present but not 48 hex chars ·
`404` no report with that ID, or the `token` does not match that report

A wrong ID and a wrong token both return the same `404`, and a malformed token
is a `400` from the Joi query schema, so the endpoint never reveals whether a
given ID exists.

---

### 8. `GET /api/reports`

Admin only. Full report documents, newest first, with the department populated.
Paged.

| Query param | Type | Rules |
| --- | --- | --- |
| `status` | string | optional, one of the 5 statuses |
| `priority` | string | optional, one of the 4 priorities |
| `search` | string | optional, max 100. Case-insensitive match on `reportId` or `title` |
| `page` | number | optional, ≥ 1, default `1` |
| `limit` | number | optional, 1–100, default `20` |

`search` is escaped and anchored before it becomes a regex, so a search term
cannot be read as a pattern.

```bash
curl "http://localhost:5000/api/reports?status=PENDING&limit=20&page=1" -b cookies.txt
```

**`200 OK`**

```json
{
  "success": true,
  "count": 2,
  "total": 42,
  "page": 1,
  "limit": 20,
  "totalPages": 3,
  "reports": [
    {
      "_id": "66f1c2d3e4f5a6b7c8d9e0f1",
      "reportId": "HS-2026-000042",
      "title": "Railing broken near the bus park",
      "category": "public_infrastructure",
      "description": "The east-side railing is snapped loose and hanging over the road.",
      "photo": {
        "url": "https://res.cloudinary.com/.../photo.jpg",
        "publicId": "hamro-samadhan/reports/abc123"
      },
      "location": {
        "address": "Bus Park, Rato Bangala",
        "latitude": 27.6789,
        "longitude": 85.3123
      },
      "reporter": {
        "name": "Sita Rai",
        "email": "sita.rai@example.com",
        "phone": "9812345678"
      },
      "status": "PENDING",
      "priority": "MEDIUM",
      "assignedDepartment": {
        "_id": "66f1a2b3c4d5e6f7a8b9c0d1",
        "name": "Roads Department",
        "description": "Handles roads, bridges and public structures"
      },
      "publicToken": "a1b2c3...",
      "createdAt": "2026-01-05T07:31:00.000Z",
      "updatedAt": "2026-01-05T07:31:00.000Z"
    }
  ]
}
```

`count` is the number of rows in this page, not the total — use `total` for that.
This view includes `publicToken`, so treat the admin client as trusted.

**Errors:** `400` invalid query · `401` no or invalid session · `403` not an admin

---

## Admin (`/api/admin`)

Every route here requires a valid session **and** the admin role.

Route order matters: `/stats` and `/reports/:id` are declared before the `/:id`
routes, so `stats` can never be read as an id.

### 9. `POST /api/admin`

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | required, trimmed, max 100, must be unique |
| `description` | string | required, trimmed, max 500 |

```bash
curl -X POST http://localhost:5000/api/admin \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Roads Department",
    "description": "Handles roads, bridges and public structures"
  }'
```

**`201 Created`**

```json
{
  "success": true,
  "message": "Department created successfully"
}
```

The new department's `_id` is not returned — read it back from `GET /api/admin`
to assign reports to it.

**Errors:** `400` missing field or validation failure · `401`/`403` ·
`409` name already taken

---

### 10. `GET /api/admin`

Returns every department, newest first, **including inactive ones** so an admin
can see and reactivate retired departments.

```bash
curl http://localhost:5000/api/admin -b cookies.txt
```

**`200 OK`**

```json
{
  "success": true,
  "count": 2,
  "departments": [
    {
      "_id": "66f1a2b3c4d5e6f7a8b9c0d1",
      "name": "Roads Department",
      "description": "Handles roads, bridges and public structures",
      "isActive": true,
      "createdAt": "2026-01-04T08:00:00.000Z",
      "updatedAt": "2026-01-04T08:00:00.000Z"
    },
    {
      "_id": "66f1a2b3c4d5e6f7a8b9c0d2",
      "name": "Waste Management",
      "description": "Garbage collection and disposal",
      "isActive": false,
      "createdAt": "2026-01-04T08:05:00.000Z",
      "updatedAt": "2026-01-10T11:20:00.000Z"
    }
  ]
}
```

**Errors:** `401`/`403`

---

### 11. `GET /api/admin/stats`

Everything on the dashboard, counted in the database so the overview never has
to download every report just to add up a few numbers. Eight queries run in
parallel.

```bash
curl http://localhost:5000/api/admin/stats -b cookies.txt
```

**`200 OK`**

```json
{
  "success": true,
  "stats": {
    "total": 42,
    "open": 17,
    "unassigned": 5,
    "resolvedThisWeek": 8,
    "activeDepartments": 12,
    "byStatus": {
      "PENDING": 9,
      "UNDER_REVIEW": 4,
      "IN_PROGRESS": 4,
      "RESOLVED": 22,
      "REJECTED": 3
    },
    "byPriority": {
      "LOW": 6,
      "MEDIUM": 20,
      "HIGH": 12,
      "URGENT": 4
    },
    "trend": [
      { "date": "2026-01-01", "count": 3 },
      { "date": "2026-01-02", "count": 7 }
    ],
    "recent": [
      {
        "reportId": "HS-2026-000042",
        "title": "Railing broken near the bus park",
        "status": "PENDING",
        "priority": "MEDIUM",
        "createdAt": "2026-01-05T07:31:00.000Z",
        "assignedDepartment": { "_id": "66f1...", "name": "Roads Department" }
      }
    ]
  }
}
```

| Field | Meaning |
| --- | --- |
| `open` | `PENDING` + `UNDER_REVIEW` + `IN_PROGRESS` |
| `unassigned` | Open reports with no department yet — the admin's to-do list |
| `resolvedThisWeek` | `RESOLVED` with `updatedAt` in the last 7 days |
| `byStatus` / `byPriority` | Every known value is a key, including zeroes, so the dashboard keeps a stable order instead of dropping cards |
| `trend` | Exactly 7 entries, oldest first, **UTC** day keys — a chart can plot it without sorting |
| `recent` | The 5 newest reports |

The day keys and the aggregation both use UTC, so the two always line up. If you
show this in a Nepali-timezone UI, expect the day boundaries to shift.

**Errors:** `401`/`403`

---

### 12. `GET /api/admin/reports/:id`

The full report document for the admin detail view, unlike the trimmed public one.
`:id` is the Mongo `_id` from endpoint 8, **not** a `reportId`.

```bash
curl http://localhost:5000/api/admin/reports/66f1c2d3e4f5a6b7c8d9e0f1 -b cookies.txt
```

**`200 OK`**

```json
{
  "success": true,
  "report": {
    "_id": "66f1c2d3e4f5a6b7c8d9e0f1",
    "reportId": "HS-2026-000042",
    "title": "Railing broken near the bus park",
    "reporter": { "name": "Sita Rai", "email": "sita.rai@example.com", "phone": "9812345678" },
    "photo": { "url": "...", "publicId": "..." },
    "status": "PENDING",
    "priority": "MEDIUM",
    "publicToken": "a1b2c3...",
    "createdAt": "2026-01-05T07:31:00.000Z"
  }
}
```

**Errors:** `400` `:id` is not an ObjectId · `401`/`403` · `404` report not found

---

### 13. `GET /api/admin/reports/:id/updates`

The change history for one report, **newest first**, with `updatedBy` resolved to
a name and email.

```bash
curl http://localhost:5000/api/admin/reports/66f1c2d3e4f5a6b7c8d9e0f1/updates -b cookies.txt
```

**`200 OK`**

```json
{
  "success": true,
  "count": 2,
  "updates": [
    {
      "_id": "66f3...",
      "status": "IN_PROGRESS",
      "message": "Crew assigned, work starts tomorrow.",
      "updatedBy": {
        "_id": "66f1a2b3c4d5e6f7a8b9c0d1",
        "name": "system admin",
        "email": "admin@hamrosamadhan.com"
      },
      "createdAt": "2026-01-07T04:15:00.000Z"
    }
  ]
}
```

Note the ordering is the reverse of the public timeline in endpoint 7, which is
oldest-first on purpose.

**Errors:** `400` bad `:id` · `401`/`403` · `404` report not found

---

### 14. `PATCH /api/admin/:id/department`

Assigns a department to a **report**. `:id` is the report's Mongo `_id` (from
endpoint 8), **not** a department id.

| Field | Type | Rules |
| --- | --- | --- |
| `departmentId` | string | required, 24-char hex ObjectId, must belong to an **active** department |

```bash
curl -X PATCH http://localhost:5000/api/admin/66f1c2d3e4f5a6b7c8d9e0f1/department \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{ "departmentId": "66f1a2b3c4d5e6f7a8b9c0d1" }'
```

**`200 OK`**

```json
{
  "success": true,
  "message": "Department assigned successfully",
  "report": { "...": "the full updated report document" }
}
```

The reporter is emailed afterwards. Email is best effort — a mail failure is
logged and the assignment still succeeds. Assigning does **not** change `status`;
the report stays `PENDING`.

**Errors:** `400` missing or malformed `departmentId`, or `:id` is not an
ObjectId · `401`/`403` · `404` report not found, or the department does not exist
/ is inactive

---

### 15. `PATCH /api/admin/:id/status`

Moves a report through the status list. This is the endpoint that writes history
— each call appends a `ReportUpdate` row, which is what endpoint 7's timeline
shows — and emails the reporter.

| Field | Type | Rules |
| --- | --- | --- |
| `status` | string | required, one of the 5 statuses |
| `message` | string | optional, max 1000. Shown to the reporter. `""` clears it |

```bash
curl -X PATCH http://localhost:5000/api/admin/66f1c2d3e4f5a6b7c8d9e0f1/status \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "status": "IN_PROGRESS",
    "message": "Crew assigned, work starts tomorrow."
  }'
```

**`200 OK`**

```json
{
  "success": true,
  "report": { "...": "the full updated report document" },
  "status": "IN_PROGRESS",
  "message": "Crew assigned, work starts tomorrow."
}
```

Leaving `message` empty is fine — the email falls back to a per-status sentence
("Work on your report has started.") so the mail still explains itself.

The API does **not** enforce the status ordering. Any status may be set to any
other; the list below exists so a client can present it as a progression. A typo
is caught twice over — by the Joi schema and again by a whitelist in the
controller.

**Errors:** `400` unknown `status`, or bad `:id` · `401`/`403` · `404` report not
found

---

### 16. `PATCH /api/admin/:id/priority`

Reorders the queue. Does not touch `status` and does not write history — only a
status change writes a `ReportUpdate` row.

| Field | Type | Rules |
| --- | --- | --- |
| `priority` | string | required, one of `LOW`, `MEDIUM`, `HIGH`, `URGENT` |

```bash
curl -X PATCH http://localhost:5000/api/admin/66f1c2d3e4f5a6b7c8d9e0f1/priority \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{ "priority": "URGENT" }'
```

**`200 OK`**

```json
{
  "success": true,
  "report": { "...": "the full updated report document" },
  "priority": "URGENT"
}
```

The reporter is emailed with a fixed sentence, since this endpoint takes no
message.

**Errors:** `400` unknown `priority`, or bad `:id` · `401`/`403` · `404` report
not found

---

### 17. `PATCH /api/admin/:id`

Updates a department. Every field is **optional** and at least one must be sent,
so a partial edit only needs the changed fields. The controller only writes the
fields that are present.

| Field | Type | Rules |
| --- | --- | --- |
| `name` | string | optional, trimmed, max 100, must stay unique |
| `description` | string | optional, trimmed, max 500 |
| `isActive` | boolean | optional |

```bash
curl -X PATCH http://localhost:5000/api/admin/66f1a2b3c4d5e6f7a8b9c0d2 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{ "isActive": false }'
```

**`200 OK`**

```json
{
  "success": true,
  "message": "Department updated successfully",
  "department": {
    "_id": "66f1a2b3c4d5e6f7a8b9c0d2",
    "name": "Waste Management",
    "description": "Garbage collection and disposal",
    "isActive": false,
    "createdAt": "2026-01-04T08:05:00.000Z",
    "updatedAt": "2026-01-10T11:20:00.000Z"
  }
}
```

Setting `isActive: false` retires the department without touching the reports
already assigned to it, and blocks it from taking new work (endpoint 14 only
accepts active departments).

**Errors:** `400` empty body, validation failure, or bad `:id` · `401`/`403` ·
`404` department not found · `409` name already taken

---

## Email notifications

Every mail is plain text sent through one Gmail SMTP transporter, and all four share
one layout, so a new kind only supplies the text
(`src/services/notification.service.js`).

| Trigger | Function | Subject |
| --- | --- | --- |
| Report submitted | `sendReportSubmitted` | `Your report <ID> has been submitted` |
| Status changed | `sendReportStatusChanged` | `Update on your report <ID>` |
| Department assigned | `sendReportDepartmentAssigned` | `Update on your report <ID>` |
| Priority changed | `sendReportPriorityChanged` | `Update on your report <ID>` |

Status, priority and department mails all report the same snapshot — status,
priority and department ("Not assigned" when there is none). Status mails carry
a per-status sentence so the mail still reads correctly when the admin leaves the
message blank.

**Email is always best effort.** Every call is wrapped in its own `try/catch` and
a failure is logged as `Notification error: ...` and swallowed, so a broken
Gmail config can never lose a report or roll back a status change.

Gmail requires two-step verification to be enabled before an app password can
be created. The app password must be used in `GMAIL_APP_PASSWORD`; the normal
Gmail account password will usually be rejected by Google SMTP.

---

## Data reference

### Report categories

`road_damage` · `road_blockage` · `street_light` · `waste` · `water_leakage` ·
`drainage` · `traffic_signal` · `fallen_tree` · `public_infrastructure` ·
`electricity` · `sanitation` · `pollution` · `animals` · `construction` ·
`park` · `safety` · `noise` · `other`

The list lives in **two** files that must be kept in step:

| File | Used for |
| --- | --- |
| `Backend/src/constants/categories.js` | the API's own copy: Mongoose `enum`, Joi validation, `GET /api/categories` |
| `Frontend/src/constants/categories.js` | the report form's dropdown and the admin label map |

The frontend list is hardcoded rather than fetched, because the categories are a
fixed set of enum values that nothing creates at runtime, so the round trip bought
nothing while making the form's dropdown fail whenever the API was unreachable
(most often a CORS miss on `CLIENT_URL`). A failed load used to leave the
`<select>` silently empty, which looked like a form bug rather than a blocked
request.

A category added to one file and not the other is rejected on submit by the
backend validation, and shows its raw value in the admin screens, so check both
plus the `report.categories.*` keys in `en` and `ne` `translation.json`.

### Report status

`PENDING` (default) → `UNDER_REVIEW` → `IN_PROGRESS` → `RESOLVED`, or `REJECTED`.

Not enforced as an ordering by the API — any status may be set to any other.

### Priority

`LOW` · `MEDIUM` (default) · `HIGH` · `URGENT`

### User roles

`admin` only. The `User` enum has a single value, so every staff account has the
same rights today.

### Entities

**Report** — `reportId`, `title`, `category`, `description`, `photo`
(`url` + `publicId`), `location` (`address`, `latitude`, `longitude`), `reporter`
(`name`, `email`, `phone`), `status`, `priority`, `assignedDepartment`,
`publicToken`, `createdAt`, `updatedAt`

Reporter details are copied onto the report rather than referenced, so a report
survives the reporter deleting their account. `publicToken` is 24 random bytes
as hex, unique and indexed, and is the second half of every tracking link.

**Session** — `tokenHash` (SHA-256, unique, indexed), `user`, `expiresAt`

`expiresAt` carries a TTL index, so MongoDB removes expired rows itself. Because
only the hash is stored, a database dump cannot be replayed as a login.

**ReportUpdate** — one row per status change: `report`, `status`, `message`
(max 1000, optional), `updatedBy`, `createdAt`. This is the report's history. It
is written **only** by `PATCH /api/admin/:id/status`.

**Department** — `name` (unique, indexed), `description` (max 500), `isActive`
(default `true`), `createdAt`, `updatedAt`

**User** — `name`, `email` (unique, lower-cased), `password` (bcrypt, 12 rounds),
`role`, `isActive` (soft delete), `createdAt`, `updatedAt`

**Faq** — `question`, `answer`, `questionNe`, `answerNe`, `order`, `isActive`,
`createdAt`, `updatedAt`

**Counter** — `name`, `sequence`. One row per sequence (`"report"`), bumped
atomically with `findOneAndUpdate` so two simultaneous submissions can never
receive the same report number.

---

## Project structure

```
Backend/
├── scripts/
│   ├── backfillReportTokens.js  fills in missing publicToken values
│   ├── seedAdmin.js             the first admin account
│   ├── seedDepartments.js       the 12 starter departments
│   ├── seedFaq.js               the 10 starter FAQ entries
│   ├── setAdminPassword.js      set/rotate one admin's password
│   └── setStatus.js             change a status through the API, so mail is sent
└── src/
    ├── app.js                   express app, middleware order, route mounts
    ├── server.js                entry point: connect DB, then listen
    ├── config/
    │   ├── cloudinary.js        Cloudinary credentials
    │   ├── cors.js              allows CLIENT_URL (list supported) + credentials
    │   └── db.js                mongoose connection
    ├── constants/
    │   └── categories.js        the 18 categories the API validates against
    ├── controllers/
    │   ├── Category.controller.js   public category list (not used by the form)
    │   ├── Faq.controller.js        public FAQ list
    │   ├── Report.controller.js     submit, lookup, list, stats, status, priority, history
    │   ├── User.controller.js       login, me, logout
    │   └── department.controller.js department CRUD + report assignment
    ├── middleware/
    │   ├── auth.js                  session lookup, sets req.user, + requireAdmin
    │   ├── rateLimiter.js           login limiter + general API limiter
    │   ├── upload.middleware.js     multer memory storage + magic-byte check
    │   ├── uploadToCloudinary.js    buffer -> Cloudinary, promisified
    │   └── validate.middleware.js   Joi validation factory
    ├── models/                      Mongoose schemas
    ├── routes/                      URL -> middleware -> controller
    ├── services/
    │   └── notification.service.js  the four reporter emails
    ├── utils/
    │   └── generateReportId.js      HS-YYYY-NNNNNN sequence
    └── validation/                  Joi schemas per resource
```

The layering is strict: **routes** wire middleware to handlers and never contain
logic, **controllers** hold the business logic and never touch `req` details
beyond their own, **models** own the schema, **validation** owns the input rules.
Controllers return early on every error path so a thrown error is the only way to
reach the `500` handler.

---

## Middleware order

1. `app.set("trust proxy", TRUST_PROXY_HOPS)` — correct client IPs behind a proxy
2. `helmet()` — security headers
3. `cors` — only the origins in `CLIENT_URL`, credentials allowed
4. `express.json` / `express.urlencoded` — 100 KB body cap
5. `cookieParser`
6. `apiLimiter` on `/api` — 300 requests / 15 min
7. route-specific: `limiter` (login), `authMiddleware`, `requireAdmin`, `upload`, `validate`
8. controller
9. JSON 404 catch-all

`express.json` caps bodies at 100 KB, but `multer` buffers the image separately,
so the 5 MB image on `POST /api/reports` is unaffected.

**There is no error-handling middleware.** Anything that reaches `next(err)` —
the two upload failures — falls through to Express's default HTML handler.

Note also that `server.js` calls `connectDB()` without awaiting it and starts
listening immediately, so the port is open for a moment before Mongo is ready.

---

## Frontend integration notes

The Vite app in `../Frontend` reads `VITE_API_URL` (see `.env.example`), so either
run the backend on `PORT=3000` or point the frontend at `5000`. Its axios instance
sets `withCredentials: true`, which is required for the session cookie, and
registers one interceptor that redirects to the admin login on any `401` except
from `/auth/login` and `/auth/logout`.

### Deploying the frontend to Vercel

Set the root directory to `Frontend`. Two things are needed and both are easy to
miss:

| Where | What | Why |
| --- | --- | --- |
| Vercel → Settings → Environment Variables | `VITE_API_URL` = your deployed API base URL, ending in `/api`. Add it for **Production, Preview and Development**. | Vite inlines `import.meta.env` at **build** time. Saving the variable does nothing on its own, you must redeploy. Without it the bundle is built with `baseURL: undefined` and every request goes to the Vercel origin, which looks like a dead backend rather than a missing variable — the app now logs a warning in the console when it is unset. |
| `Frontend/vercel.json` | SPA rewrite to `index.html` (already committed) | Without it Vercel serves its own 404 for `/admin/login` on a direct visit or refresh. Client side navigation works, a hard reload does not. |

`CLIENT_URL` must be set to the frontend's domain, without a trailing slash.
A miss means the browser blocks the response and the session cookie never
arrives — the admin would log in successfully and stay signed out. The cookie
attributes need no configuration: Render terminates TLS, so the proxy forwards
`X-Forwarded-Proto: https` and the cookie is set `Secure; SameSite=None` on its
own.

Both halves are separate deployments, so the frontend must be reachable over
**HTTPS** for the cross-site cookie to be accepted at all.

**Order to verify a deploy:** open `/admin/login` directly (proves the rewrite),
log in (proves the cookie and `CLIENT_URL`), then file a report and track it by
id. The category dropdown is **not** a valid check, it is hardcoded client side
and renders even when the API is unreachable.

The backend logs a warning on boot when `NODE_ENV=production` and `CLIENT_URL` is
unset, and the frontend logs one when `VITE_API_URL` is unset. Both mean a
half-configured deploy, and both are worth reading in the deploy logs before
assuming a build problem.

Tracking works as the Track page calls it — by ID alone, with the citizen's
details redacted. The page guards every optional field with `?.` / `||`, so a
`null` `location` renders its "no address" and "no photo" placeholders instead
of breaking.

The photo, description and location come back only for the browser that
submitted the report, because that browser kept the token from the `201`
response:

| Where | What |
| --- | --- |
| `services/ReportService.js` | `saveReportToken` / `getReportToken`, key `hs:reportToken:<reportId>`; `getReportById(id, token)` sends `?token=` only when a token exists |
| `src/pages/Report.jsx` | stores the token on a successful submit |
| `src/pages/TrackReport.jsx` | reads the token by report id before the lookup |

---

## Known gaps

Worth fixing before this goes to production.

1. **The tracking token only survives in the submitting browser.** It is returned
   once by `POST /api/reports` and the frontend keeps it in `localStorage`. Clear
   site data, switch device, or track from a phone after submitting on a laptop
   and the report falls back to the redacted view — the citizen loses sight of
   their own photo, description and location, with no way to get the token back.
   A tracking link (`/track/<id>/<token>`) plus the token in the confirmation
   email would fix it; that needs a route in `App.jsx` and a base URL in
   `notification.service.js`, which is not configurable today.

2. **`localStorage` is a convenience, not a lock.** Anything with JS access to
   the origin can read `hs:reportToken:<id>`, so on a shared or compromised
   machine the token can be lifted and the redacted fields read. That is the same
   trust level as the session cookie, so it is consistent — just worth knowing it
   is not a security boundary.

3. **`POST /api/reports` is public despite its comment.**
   `src/routes/report.routes.js:16` says "Any signed-in user may submit a report",
   but there is no `authMiddleware` on the route. If reports should require login,
   add it.

4. **No error-handling middleware**, so the two upload failures return HTML rather
   than the documented JSON, and a >5 MB file returns `500` instead of `413`/JSON.
   Add a final error handler that maps `err.status` and multer's `LIMIT_FILE_SIZE`
   onto the `success: false` shape.

5. **Debug logging in production.** `Report.controller.js:61-67` logs every
   uploaded file's field name, body keys and content type on each submission.

6. **`jsonwebtoken` is still a dependency** with no `JWT_SECRET` in `.env` and no
   import anywhere. Remove it.

7. **Inconsistent error messages.** `updateReportPriority` answers a bad priority
   with `"Invalid status"`; `updateReportStatus` and `updateReportPriority` both
   answer with lowercase `"report not found"` while everything else uses
   `"Report not found"`.

8. **Typo in a user-facing message.** `POST /api/admin` returns
   `"All fields are requird"`.

9. **`GET /api/auth/me`'s `404` is unreachable.** `authMiddleware` has already
   populated a live user by the time the handler runs.

10. **`connectDB()` is not awaited** in `server.js`, so the server listens before
    Mongo is connected and early requests fail. (Related: `db.js` logs
    `process.env.PORT` in its "Database connected" message, so that line prints a
    port number.)

11. **The report counter never resets each year.** `generateReportId` builds the
    year from the clock but the `Counter` sequence is a single global row, so
    January's first report is `HS-2027-000500`, not `HS-2027-000001`. Valid but
    odd-looking. Scope the counter per year to fix it.

12. **No tests and no linter.** There is no test runner, no test files, and no
    ESLint/Prettier config. The endpoints below are the ones worth covering
    first: login failure uniformity, the three public-lookup cases (redacted `200`
    with no token, `404` on a wrong token, `400` on a malformed one), and the
    admin status transition writing history.

13. **15-minute sessions with no refresh.** There is no refresh token or sliding
    expiry, so a working admin is logged out every 15 minutes with nothing saved.
    An admin editing a long report will lose the session mid-task.

14. **No pagination on `GET /api/admin/reports/:id/updates`.** Fine for a single
    report's history today, unbounded in principle.
