# Pulse — Event Registration & Attendance Platform

Pulse turns a paper headcount into real data. An organizer creates an event and
designs its registration form; Pulse generates a QR code. Attendees scan the
code, fill in the form, and receive a one-time code they can redeem for a
benefit. Every scan and registration is logged, so organizers finally know who
actually showed up — not just who bought a ticket.

Built for **CSCD 602 — Advanced Software Engineering**.

## Stack

| Layer      | Choice                                    |
| ---------- | ----------------------------------------- |
| Framework  | Next.js 14 (App Router, React, TypeScript)|
| Database   | PostgreSQL via Prisma ORM                 |
| Auth       | JWT session cookie + bcrypt password hash |
| Styling    | Tailwind CSS (Kinetic Pulse design system)|
| QR codes   | `qrcode` rendered to a canvas with logo   |
| Charts     | Recharts                                  |
| Tests      | Vitest                                    |
| Hosting    | Vercel + managed Postgres (Neon/Supabase) |

## Roles

- **Admin** — sees every event across the platform.
- **Organizer** — owns and fully controls their own events.
- **Manager** — assigned by an organizer; can view registrations and redeem
  codes on the ground, but cannot edit or delete the event.

## Local setup

```bash
# 1. Install dependencies
npm install

# 2. Start a local Postgres (Docker)
docker run -d --name erp-postgres \
  -e POSTGRES_USER=erp -e POSTGRES_PASSWORD=erp_pass -e POSTGRES_DB=event_registration \
  -p 5433:5432 postgres:16-alpine

# 3. Configure environment
cp .env.example .env   # then edit DATABASE_URL / JWT_SECRET

# 4. Apply migrations and seed demo data
npx prisma migrate dev
npm run seed

# 5. Run
npm run dev            # http://localhost:3000
```

A published sample event (`/r/founders-mixer-demo1`) is created with a dynamic
form, benefits, and some registrations so analytics is not empty.

## Tests

```bash
npm run test
```

Covers registration-code generation and uniqueness, slug generation, form
validation rules, password hashing, and session-token round-tripping.

## Deployment (Vercel)

1. Push this repository to GitHub.
2. Provision a Postgres database (Neon or Supabase) and copy its pooled
   connection string.
3. Import the repo into Vercel and set the environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_APP_URL` (your Vercel URL — used when generating QR links)
4. Vercel runs `npm run vercel-build`, which applies migrations
   (`prisma migrate deploy`) and builds the app.
5. Run the seed once against the production database if demo data is wanted:
   `DATABASE_URL=... npm run seed`.

## Project layout

```
prisma/            Prisma schema, migrations, and seed
src/lib/           Prisma client, auth, guards, form schema, helpers
src/app/api/       Route handlers (auth, events, public registration, redeem)
src/app/           Pages: landing, auth, dashboard, public registration
src/components/    React components (editor, workspace, panels, QR)
tests/             Vitest unit tests
```
