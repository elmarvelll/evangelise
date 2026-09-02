# External Integrations

## LiveKit (video/audio SFU)

All LiveKit server-side interaction goes through
[`src/services/livekit.service/`](../src/services/livekit.service/).
Client-side, `livekit-client` connects to `process.env.NEXT_PUBLIC_LIVEKIT_URL`
using the token issued by one of the token endpoints.

**Convention**: a livestream's own `id` (a Prisma `cuid`) is always used as
the LiveKit **room name**. There is no separate room-name field or mapping
table — every token-issuing function passes `livestream.id` as `room`, and
the webhook handler looks the livestream up by treating the room name it
receives as that same id.

### Token issuance

| Function | Grants | Used by |
|---|---|---|
| `createBroadcastSession` | `canPublish: true`, `canSubscribe: true` | `POST /api/livekit/token` ("go live") |
| `createReconnectSession` | same as above | `POST /api/livekit/token/reconnect` |
| `createViewerSession` | `canPublish: false`, `canSubscribe: true`, random `viewer-<uuid>` identity | `POST /api/livekit/viewer_token` |

The broadcaster's LiveKit **identity** is their `user.id`; a viewer's
identity is a random UUID (viewers are anonymous to LiveKit, tracked only in
the browser).

### Room lifecycle

- `endBroadcastRoom` (`POST /api/livekit/livestreams/end`) explicitly tears
  down the room with `RoomServiceClient.deleteRoom` and marks the livestream
  `ENDED`.
- `handleParticipantLeft` reacts to the `participant_left` **webhook**
  event: if the participant who left is the broadcaster, it waits 30 seconds
  (`RECONNECT_GRACE_PERIOD`) and only ends the stream if no heartbeat arrived
  in that window — this is what lets a broadcaster refresh their page
  without losing the stream.
- `cleanupStaleStreams` (`src/services/livestream.service/`) is a second,
  independent safety net driven by cron rather than webhooks: any stream
  still `LIVE` with a heartbeat older than 90 seconds is force-ended. This
  catches cases where the webhook never fires at all (e.g. the process
  hosting LiveKit lost connectivity, or the client crashed hard enough to
  never trigger `participant_left`).

### Webhook verification

`verifyWebhookEvent` uses `livekit-server-sdk`'s `WebhookReceiver`, which
validates the `Authorization` header against `LIVEKIT_API_KEY`/`_SECRET` and
the raw request body — the controller reads the body with `request.text()`
(not `.json()`) specifically so the raw bytes are available for signature
verification.

## Cron (Vercel)

[`vercel.json`](../vercel.json) schedules `GET /api/livekit/cleanup` every 5
minutes, authenticated with a static bearer token (`CRON_SECRET`) rather than
a user session — see `cleanupController`.

## Google OAuth

Used only as a NextAuth provider (`GoogleProvider` in
[`src/lib/auth.ts`](../src/lib/auth.ts)) for sign-in; no other Google APIs
are called. See [authentication.md](authentication.md).

## Environment variables

| Variable | Used by |
|---|---|
| `DATABASE_URL` | `src/lib/prisma.ts` (passed to `@prisma/adapter-pg` as the Postgres connection string; a Supabase pooled connection uses port `6543` with `?pgbouncer=true`) |
| `NEXTAUTH_SECRET`, `NEXTAUTH_URL` | NextAuth |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google OAuth provider |
| `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | `livekit.service/` (server-side LiveKit SDK) |
| `NEXT_PUBLIC_LIVEKIT_URL` | Browser LiveKit client connection |
| `CRON_SECRET` | `GET /api/livekit/cleanup` auth |
| `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | present in `.env` but not read anywhere in `src/` — `DATABASE_URL` alone drives the Prisma connection. Likely leftover from an earlier direct-`mysql2` setup (see the now-deleted `src/lib/mysql.ts`, noted in [architecture.md](architecture.md)); their values are also stale MySQL-era placeholders now that the datasource is Postgres. |

### Supabase connection: pooled vs. direct port

Supabase exposes the same Postgres database on two ports through its
connection pooler:

- **`:6543`** — PgBouncer in *transaction* mode. This is what `DATABASE_URL`
  in `.env` uses for the running app (with `?pgbouncer=true`, which Prisma
  needs to avoid "prepared statement already exists" errors under
  transaction-mode pooling).
- **`:5432`** on the same pooler host — session mode, which supports the
  session-level features (advisory locks, DDL) that `prisma db push` /
  `prisma migrate` need. Running a migration against `:6543` hangs
  indefinitely rather than failing outright — if a future `prisma migrate`/
  `db push` seems stuck, that's almost certainly why; re-run it with
  `DATABASE_URL` pointed at the same host on `:5432` instead.
