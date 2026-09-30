# Hamro Samadhan · हाम्रो समाधान

A civic complaint platform for Nepal. Citizens report problems in their
ward — broken roads, waste, water leakage, drainage, street lights — and follow
the fix through a tracking link. Municipal staff log in to an admin portal, assign
each report to a department and update its status. The reporter is emailed at
every change.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 8, Tailwind CSS 4, React Router 7, axios, Leaflet, i18next (English / Nepali) |
| Backend | Node.js, Express 5, MongoDB via Mongoose 9, Joi, helmet, express-rate-limit |
| Storage | Cloudinary (report photos) |
| Email | Nodemailer over Gmail |

## Repository layout

```
.
├── Backend/    REST API, Mongoose models, seeding scripts
│   └── README.md  — full API reference
└── Frontend/   Vite + React citizen site and admin dashboard
    └── README.md  — frontend notes
```

Each folder is a separate package with its own `package.json` and `node_modules`.

## Quick start

Requires Node.js 18+ and a running MongoDB (local `mongod` or Atlas).

### 1. Backend

```bash
cd Backend
npm install
```

Create `Backend/.env` (gitignored):

```dotenv
PORT=5000
MONGOOSE_URL=mongodb://127.0.0.1:27017/hamro_samadhan
NODE_ENV=development
CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

EMAIL_USER=
EMAIL_PASSWORD=
```

Then seed and start:

```bash
npm run seed:admin         # the first admin account
npm run seed:departments   # 12 starter departments
npm run seed:faq           # 10 starter FAQ entries
npm run dev                # nodemon
```

The API listens on `PORT`, or `5000` by default. Check it:

```bash
curl http://localhost:5000/api/categories
```

### 2. Frontend

```bash
cd Frontend
npm install
```

Create `Frontend/.env`:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev    # http://localhost:5173
```

> The API default port (`5000`) and the URL above must match. The frontend axios
> instance sends `withCredentials: true` so the session cookie reaches the API.

## Default admin account

`npm run seed:admin` creates one account and skips it if the email already exists,
so change the password immediately after the first run:

| Field | Value |
| --- | --- |
| Email | `admin@hamrosamadhan.com` |
| Password | `hamrosamadhan@123` |

```bash
node scripts/setAdminPassword.js admin@hamrosamadhan.com
```

## How a report flows

1. A citizen submits a report with a title, category, description, location,
   contact details and an optional photo.
2. The API assigns a readable id — `HS-2026-000042` — and returns it with a
   one-time `publicToken`. The frontend stores the token in `localStorage`.
3. Staff assign the report to a department and change its status. Each status
   change writes a `ReportUpdate` history row and emails the reporter.
4. The citizen tracks progress by id. Details are shown in full only for the
   browser that filed it, which kept the token.

## Documentation

- [Backend API reference](Backend/README.md) — endpoints, auth, env vars, data
  models, error codes, known gaps
- [Frontend](Frontend/README.md) — Vite template notes

## Scripts

| Location | Command | What it does |
| --- | --- | --- |
| `Backend` | `npm run dev` | nodemon, restarts on save |
| `Backend` | `npm start` | production run |
| `Backend` | `npm run seed:admin` | create the first admin |
| `Backend` | `npm run seed:departments` | add the 12 starter departments |
| `Backend` | `npm run seed:faq` | add the 10 starter FAQ entries |
| `Backend` | `npm run set:status` | change a report status through the API, so mail is sent |
| `Frontend` | `npm run dev` | Vite dev server |
| `Frontend` | `npm run build` | production build to `dist/` |
| `Frontend` | `npm run lint` | oxlint |
| `Frontend` | `npm run preview` | serve the production build |

There are no tests and no backend linter configured.

## License

ISC
