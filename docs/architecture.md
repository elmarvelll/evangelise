# Architecture

## Stack

- **Framework**: Next.js 16 (App Router). Note: this project pins a Next.js
  version whose conventions differ from older training data — e.g.
  `middleware.ts` is renamed to [`src/proxy.ts`](../src/proxy.ts). See
  `node_modules/next/dist/docs/` for the version actually installed before
  assuming a convention.
- **Database**: PostgreSQL (Supabase) via Prisma (`@prisma/adapter-pg`). Was
  MySQL/MariaDB (`@prisma/adapter-mariadb`) until this was switched over —
  see [database/schema.md](database/schema.md).
- **Auth**: NextAuth v4 — Credentials provider (email/password) + Google OAuth,
  JWT sessions.
- **Realtime video**: LiveKit (SFU) via `livekit-server-sdk` (server) and
  `livekit-client` (browser).
- **Styling**: Tailwind CSS v4.

## Layered request flow

Every API route in this app follows the same shape:

```text
Client (fetch / axios)
  ↓
API Route            src/app/api/<path>/route.ts
  ↓                    — HTTP method exports only, delegates immediately
Route Controller     src/app/api/<path>/route.controller.ts
  ↓                    — parses/validates the request, checks auth,
  ↓                      calls a service, maps the result/error to a
  ↓                      Response
Service              src/services/<domain>.service/
  ↓                    — business rules, Prisma queries, LiveKit calls
Database / LiveKit    prisma/schema.prisma via src/lib/prisma.ts
                       LiveKit server SDK
  ↓
Service → Controller → Response → Client
```

**Route** (`route.ts`): pure HTTP entry point. Exports `GET`/`POST`/etc. and
forwards straight to the colocated controller. No business logic.

**Controller** (`route.controller.ts`, colocated next to its route): request
parsing, auth/session checks (via `getCurrentSession()`), calling exactly one
service function per request, and turning the result — or a typed error from
`src/services/errors/` — into an HTTP response using the helpers in
[`src/lib/http.ts`](../src/lib/http.ts). Controllers are colocated with their
route files (matching this codebase's existing convention of putting a
route's helper file, e.g. the old `pushtoDB.ts`, right beside `route.ts`)
rather than centralized in a top-level `controllers/` folder.

**Service** (`src/services/<domain>.service/`, one function per file — see
[services/README.md](services/README.md)): all business logic and all
database/external-service access. Services know nothing about HTTP —
they take/return plain data and throw the typed errors in
`src/services/errors/` (`ValidationError`, `NotFoundError`,
`ConflictError`, `ConfigurationError`) for expected failure cases. Services
call other services directly when a workflow spans domains, always through
the callee's `index.ts` (e.g. `livekit.service/create-broadcast-session.ts`
calls into `@/services/livestream.service` to persist the livestream row
before issuing a broadcast token) — never by reaching into another domain's
internal files.

## Error handling convention

Before this refactor, each route hand-rolled its own
`NextResponse.json({ error }, { status })` calls, with a few small
inconsistencies (e.g. an unhandled exception in `viewer_token` fell through
to Next's default error page instead of the app's `{ error: string }` JSON
shape). The refactor keeps every existing status code and message the
frontend depends on, and standardizes the *mechanism*:

- Services throw one of the typed errors in `src/services/errors/` for
  expected failures.
- Controllers catch those specific types and map them via the helpers in
  `src/lib/http.ts` (`badRequest`, `unauthorized`, `notFound`, `conflict`,
  `serverError`).
- Anything else is logged with `console.error` and turned into a generic
  `serverError(...)` — no internal error details (stack traces, Prisma error
  codes, etc.) are ever sent to the client.

## Authentication

See [authentication.md](authentication.md) for the full picture. In short:
NextAuth issues a JWT session; server-side code reads it with
`getCurrentSession()` (`src/lib/session.ts`); route protection for whole page
trees (`/dashboard`, `/profile`, `/orders`, `/stream/*`) happens in
[`src/proxy.ts`](../src/proxy.ts) via `next-auth/middleware`'s `withAuth`.

## External services

See [integrations.md](integrations.md). LiveKit is the only external
integration: it issues room tokens, hosts the actual audio/video, and calls
back into `/api/livekit/webhook` on room events.

## Known architectural issues (found during this audit)

These were **not** changed during the refactor except where noted, per the
"preserve existing behavior" mandate — they're called out here so they're not
mistaken for new bugs, and so they're easy to find when someone picks them up.

1. **Case-mismatched user lookup when going live** —
   `livestream.service/create-livestream.ts` looks up the broadcasting user by
   `sessionUser.email?.toUpperCase()`, but every email in the database is
   stored lowercase (see `auth.service/`). In practice this lookup can only
   succeed for an email that happens to be uppercase in the DB, which never
   happens via this app's own signup/login flows. This looks like a typo for
   `.toLowerCase()`. Left unchanged (pre-existing, "go live" is presumably
   exercised in real usage, so a live fix needs a deliberate decision, not a
   drive-by change during a structural refactor).
2. **No auth/ownership check on `POST /api/livekit/livestreams/end`** — any
   caller who knows (or guesses) a livestream id can end someone else's
   stream. Every other LiveKit route requires and checks a session. Flagged
   as a security follow-up.
3. **`POST /api/search` reads only query-string parameters** — it's a POST
   route with an empty body; all input comes from `?q=&filters=`. This was
   kept as-is because the frontend (`SearchBar`) already calls it as a POST.
   A `GET` would be more conventional but changing the HTTP method is a
   frontend/backend contract change, not a pure refactor.
4. **`prisma/schema.prisma` had no `roomName` field**, but
   `livekit/webhook/route.ts` queried `prisma.livestream.findFirst({ where:
   { roomName, status: "LIVE" } })` — a compile error (`tsc` failed on this
   line before the refactor). Elsewhere in the app the LiveKit room name is
   always the livestream's own `id` (see `createBroadcastSession`,
   `createReconnectSession`, `createViewerSession`). This refactor fixes the
   query to `where: { id: roomName, status: "LIVE" }` to match that
   convention and unblock `tsc`/`next build` — this is the one behavior
   change made outside of the restructuring itself, and it was necessary for
   the code to type-check and build at all.
5. **`src/lib/mysql.ts` was dead code** — a hand-rolled `mysql2/promise` pool
   helper with zero importers anywhere in the app (Prisma was, and remains,
   the only database client actually used — via `@prisma/adapter-mariadb`
   at the time, now `@prisma/adapter-pg` after the Postgres switch below).
   Deleted as part of this refactor.
6. **Database provider switched from MySQL to PostgreSQL** (Supabase),
   after the original audit above. `prisma/schema.prisma`'s datasource,
   `src/lib/prisma.ts`'s adapter, and `package.json`'s dependencies were
   all updated together; see [database/schema.md](database/schema.md) for
   the one schema change the switch required (a duplicate constraint name
   that MySQL allowed but Postgres doesn't).
