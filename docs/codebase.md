# Codebase Map

A quick lookup for "where do I find/add X" questions. For the full picture
see [architecture.md](architecture.md); for individual endpoints see
[api/routes.md](api/routes.md).

## "Where does this request enter the app, and where does it end up?"

Every API request enters at `src/app/api/<path>/route.ts`, is handed to the
colocated `route.controller.ts`, which calls into exactly one
`src/services/<domain>.service/`, which talks to Prisma
(`src/lib/prisma.ts`) and/or LiveKit (`livekit-server-sdk`). Trace any one
route in [api/routes.md](api/routes.md) — every route names its controller
and service explicitly.

## "Which controller/service handles X?"

| If it's about... | Controller lives in | Service |
|---|---|---|
| Signup | `src/app/api/register/route.controller.ts` | `auth.service/` |
| Login/session shape | `src/lib/auth.ts` (NextAuth config) | `auth.service/` |
| The public stream feed | `src/app/api/livestreams/route.controller.ts` | `livestream.service/` |
| A broadcaster's own active stream | `src/app/api/livestreams/active/route.controller.ts` | `livestream.service/` |
| Comments | `src/app/api/livestreams/comments/[streamId]/route.controller.ts` | `comment.service/` |
| Going live / reconnecting | `src/app/api/livekit/token*/route.controller.ts` | `livekit.service/` (+ `livestream.service/`) |
| Viewer tokens | `src/app/api/livekit/viewer_token/route.controller.ts` | `livekit.service/` |
| Ending a stream | `src/app/api/livekit/livestreams/end/route.controller.ts` | `livekit.service/` |
| Heartbeats / stale-stream cleanup | `src/app/api/livekit/heartbeat`, `.../cleanup` | `livestream.service/` |
| LiveKit webhooks | `src/app/api/livekit/webhook/route.controller.ts` | `livekit.service/` |
| Search | `src/app/api/search/route.controller.ts` | `search.service/` |

## "Which database models are involved?"

See [database/schema.md](database/schema.md) for the full model breakdown
and a table of which service touches which model.

## "Where should I add new functionality?"

- **A new business rule for an existing domain** (e.g. a stream tag limit
  change, a new comment validation): edit the relevant `*.service/`. Routes
  and controllers shouldn't need to change.
- **A new field/behavior on an existing endpoint**: extend the controller's
  parsing/validation, and the service function it calls.
- **A brand-new endpoint**: create `src/app/api/<path>/route.ts` (thin,
  delegates only) + `route.controller.ts` (parsing, auth, response shaping)
  next to it, and either add a function to an existing
  `src/services/<domain>.service/` or create a new one if it's a genuinely
  new domain. Follow the pattern of any existing route in
  [api/routes.md](api/routes.md).
- **A new external integration**: give it its own `src/services/<name>.service/`
  (see how `livekit.service/` isolates all LiveKit SDK calls) so no
  controller ever imports the third-party SDK directly.

## "Where should I modify an existing workflow?"

Find it in [flows/](flows/) first — each flow doc names every file involved,
in call order, from the UI action to the database/LiveKit and back.

## Frontend structure

| Path | Contents |
|---|---|
| `src/app/page.tsx`, `src/components/home/` | Public home feed: stream list, video player, search, comments |
| `src/app/login/`, `src/app/signup/` | Auth pages |
| `src/app/stream/`, `src/components/stream/` | Broadcaster-only: stream setup form, live dashboard, camera/mic controls |
| `src/lib/axios.ts` | Shared `axios` instance (`baseURL: "/api"`) used by most client-side API calls; a few components use plain `fetch("/api/...")` instead — both hit the same routes |
| `src/types/` | Shared TypeScript types (`auth.ts`, `livestream-types.ts`, `next-auth.d.ts`) |

## Backend structure

| Path | Contents |
|---|---|
| `src/app/api/**/route.ts` | HTTP entry points |
| `src/app/api/**/route.controller.ts` | Request handling, colocated with each route |
| `src/services/*.service/` | Business logic + database/LiveKit access |
| `src/services/errors/` | Typed errors services throw; controllers map them to HTTP responses |
| `src/lib/prisma.ts` | Prisma client singleton |
| `src/lib/auth.ts` | NextAuth configuration |
| `src/lib/session.ts` | `getCurrentSession()` helper |
| `src/lib/http.ts` | Shared JSON response helpers (`json`, `badRequest`, `unauthorized`, `notFound`, `conflict`, `serverError`) |
| `src/proxy.ts` | Page-level route protection (this Next.js version's `middleware.ts`) |
| `prisma/schema.prisma` | Data model |
