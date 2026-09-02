# Service Layer

`src/services/` holds all business logic: validation rules, database
reads/writes (via the Prisma client from `src/lib/prisma.ts`), and calls to
LiveKit. This is the layer that would need to change if a business rule
changes (e.g. "streams can have up to 5 tags" instead of 3) — controllers and
routes shouldn't need to.

## Folders

Each domain is a folder, `<domain>.service/`, importable at
`@/services/<domain>.service` exactly as if it were still a single file —
each folder's `index.ts` re-exports everything the domain exposes.
`errors/` follows the same pattern for the shared typed error classes.

| Folder | Domain |
|---|---|
| `auth.service/` | User lookup, credential verification, Google account provisioning, registration |
| `livestream.service/` | Livestream CRUD, heartbeats, stale-stream cleanup |
| `comment.service/` | Listing/creating comments |
| `livekit.service/` | LiveKit token issuance, room lifecycle, webhook event handling (composes with `livestream.service/`) |
| `search.service/` | Livestream search (text + category/genre + pagination) |
| `follow.service/` | The follower system |
| `viewer-stats.service/` | Current/peak/total viewer counts, streamer aggregate stats |
| `report.service/` | Moderation reports |
| `errors/` | Shared typed error classes services throw for expected failure cases |

Inside a domain folder, **one function (or error class) per file**, named
after what it exports in kebab-case (`register-user.ts` exports
`registerUser`, `not-found-error.ts` exports `NotFoundError`). A function
that's only ever a private implementation detail of another function in the
same folder (e.g. `livekit.service/get-livekit-credentials.ts`) still gets
its own file, but isn't re-exported from `index.ts` — only the folder's
public API is.

```text
src/services/comment.service/
├── index.ts                    — export { listCommentsForStream, createComment }
├── list-comments-for-stream.ts
├── create-comment.ts
└── format-relative-time.ts     — private helper, imported by list-comments-for-stream.ts only
```

Cross-domain calls (e.g. `livekit.service/create-broadcast-session.ts`
calling `createLivestream`) import through the other domain's `index.ts`
(`@/services/livestream.service`), never by reaching into another domain's
internal files directly — a domain's file layout is its own implementation
detail. Files within the *same* domain import each other directly by
relative path (`./find-user-by-email`).

## Naming convention

One folder per domain: `<domain>.service/`. Domains match the real areas of
the app (auth, livestreams, comments, LiveKit, search) rather than being
invented for the sake of having a layer. No classes, no DI container beyond
the error types in `errors/` — this app is small enough that plain
functions are the simplest thing that works.

## How controllers should call services

A controller calls **one or more** service functions, passing already-parsed,
already-validated-at-the-shape-level input (the controller's job), and
either returns the service's result as JSON or catches one of the typed
errors from `errors.ts` to map to the right HTTP status:

```ts
// route.controller.ts
import { badRequest, json, notFound, serverError } from "@/lib/http";
import { createComment } from "@/services/comment.service";
import { NotFoundError, ValidationError } from "@/services/errors";

export async function createCommentController(request: Request, ctx: RouteParams) {
  try {
    const { streamId } = await ctx.params;
    const body = await request.json();
    const comment = await createComment(streamId, session.user.id, body.text);
    return json(comment, 201);
  } catch (error) {
    if (error instanceof ValidationError) return badRequest(error.message);
    if (error instanceof NotFoundError) return notFound(error.message);
    console.error("Create comment error:", error);
    return serverError("Failed to create comment");
  }
}
```

Services never see `Request`/`Response`, headers, or cookies — that keeps
them callable from anywhere (another route, a script, a future background
job) without dragging HTTP concerns along.

## What services should and should not contain

**Should**:
- Input validation that encodes a business rule (e.g. "password must be at
  least 8 characters", "a stream can have at most 3 tags").
- All Prisma queries.
- Calls to LiveKit's server SDK.
- Throwing one of `errors.ts`'s typed errors for an expected failure.

**Should not**:
- Read `Request` objects, headers, or cookies — the controller extracts
  whatever a service needs and passes it as a plain argument.
- Return a `Response`/`NextResponse` — return plain data (or throw).
- Know about HTTP status codes.
- Call `getServerSession` directly — session lookup is a controller-level
  concern (`src/lib/session.ts`); services receive a `userId` or `User`
  object instead.
