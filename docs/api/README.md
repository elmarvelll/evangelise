# API

All application API routes live under [`src/app/api/`](../../src/app/api/)
and are documented endpoint-by-endpoint in [routes.md](routes.md).

Every route (except the NextAuth catch-all, which is entirely framework
wiring) follows the same pattern:

```text
src/app/api/<segment>/route.ts             — HTTP entry point
src/app/api/<segment>/route.controller.ts  — request handling for that route
```

`route.ts` exports the HTTP method functions and immediately forwards to the
controller:

```ts
export async function POST(request: Request) {
  return someController(request);
}
```

`route.controller.ts` does the actual work: reading the session, validating
input, calling into `src/services/*.service/`, and shaping the response.
See [../services/README.md](../services/README.md) for the service layer
itself, and [../architecture.md](../architecture.md) for the full
route → controller → service → database flow and the error-handling
convention shared by every controller.
