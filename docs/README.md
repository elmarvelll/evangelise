# Evangeli3e — Documentation

Evangeli3e ("Keyhold") is a Christian livestreaming app. A signed-in user can go
live from their browser camera/microphone, viewers can browse and watch live
streams, and viewers can post real-time comments that appear both to other
viewers (via the database) and to everyone currently in the stream's LiveKit
room (via realtime data messages).

## Major parts of the system

| Part | Where it lives | Responsibility |
|---|---|---|
| Frontend (App Router pages + React components) | [src/app/](../src/app/), [src/components/](../src/components/) | UI: home feed, search, login/signup, "go live" setup, broadcaster dashboard |
| API routes (HTTP entry points) | [src/app/api/**/route.ts](../src/app/api/) | Thin handlers that hand each request to a controller |
| Route controllers | `route.controller.ts`, colocated next to each `route.ts` | Auth checks, request parsing/validation, calling services, shaping the HTTP response |
| Services (business logic) | [src/services/](../src/services/) | Domain rules, database writes/reads, calling LiveKit |
| Database layer | [prisma/schema.prisma](../prisma/schema.prisma), [src/lib/prisma.ts](../src/lib/prisma.ts) | MySQL/MariaDB via Prisma |
| Authentication | [src/lib/auth.ts](../src/lib/auth.ts), [src/lib/session.ts](../src/lib/session.ts) | NextAuth (credentials + Google), JWT sessions |
| External integrations | [src/services/livekit.service/](../src/services/livekit.service/) | LiveKit (video/audio SFU) — tokens, room lifecycle, webhooks |
| Route protection | [src/proxy.ts](../src/proxy.ts) | This Next.js version's renamed `middleware.ts` — gates `/dashboard`, `/profile`, `/orders`, `/stream/*` behind login |

## How the repo is organized

```text
src/
├── app/                     # Next.js App Router
│   ├── api/                 # Route handlers, one folder per endpoint.
│   │   └── .../route.ts           → HTTP entry point (method exports only)
│   │   └── .../route.controller.ts → request handling for that route
│   ├── login/, signup/      # Public auth pages
│   ├── stream/              # Broadcaster-only pages (setup + dashboard)
│   └── page.tsx             # Public home feed
├── components/              # React UI, grouped by feature (home/, stream/)
├── services/                # Business logic + database/external-service calls
├── lib/                     # Framework wiring: prisma client, NextAuth config,
│                             #   session helper, axios instance, HTTP response helpers
├── types/                   # Shared TypeScript types
└── proxy.ts                 # Route-protection (this Next version's "middleware")
```

## How the pieces communicate

- **Browser → API route**: client components call `fetch()` or the shared
  [`src/lib/axios.ts`](../src/lib/axios.ts) instance (baseURL `/api`).
- **API route → controller → service → database/LiveKit**: see
  [architecture.md](architecture.md) for the full request lifecycle.
- **Realtime comments**: once a viewer has a LiveKit token, new comments are
  also broadcast peer-to-peer through LiveKit's data channel
  (`room.localParticipant.publishData`), in addition to being persisted via
  the comments API. See [flows/post-comment.md](flows/post-comment.md).
- **Cron**: Vercel's cron config ([vercel.json](../vercel.json)) hits
  `GET /api/livekit/cleanup` every 5 minutes to end streams whose heartbeat
  has gone stale.

## Where to go next

- [architecture.md](architecture.md) — layers, request flow, key decisions.
- [codebase.md](codebase.md) — architecture map: "where do I find/add X?"
- [api/routes.md](api/routes.md) — every API endpoint, in detail.
- [database/schema.md](database/schema.md) — data model.
- [services/README.md](services/README.md) — service-layer conventions.
- [flows/README.md](flows/README.md) — step-by-step major workflows.
- [authentication.md](authentication.md) — NextAuth setup and session shape.
- [integrations.md](integrations.md) — LiveKit and other external services.
