# Authentication

NextAuth v4, configured in [`src/lib/auth.ts`](../src/lib/auth.ts) and
exposed at `/api/auth/[...nextauth]`
([`src/app/api/auth/[...nextauth]/route.ts`](../src/app/api/auth/[...nextauth]/route.ts)).

## Providers

1. **Credentials** (email + password). `authorize()` delegates to
   `verifyCredentials(email, password)` in
   [`src/services/auth.service/`](../src/services/auth.service/), which
   looks the user up by the email exactly as submitted (not lowercased —
   this only works because signup always stores lowercase emails and the
   login form doesn't transform input either, so in practice a
   mixed-case login attempt will fail to match; pre-existing behavior, not
   changed).
2. **Google OAuth**. On `signIn`, `findOrCreateGoogleUser(email, name)`
   looks up (or creates) the matching `user` row, keyed on the
   lowercased email. A newly-created Google account gets `password: ""`,
   which keeps it out of the credentials login path (`verifyCredentials`
   treats a falsy password as "no password set").

## Session

- **Strategy**: JWT, 30-day max age (`session.maxAge`).
- **`jwt` callback**: on initial sign-in (`user` is present), re-fetches the
  user row by lowercased email and stamps `token.id`, `token.email`,
  `token.name` (`"First Last"`).
- **`session` callback**: copies those fields from the token onto
  `session.user`.
- **Type augmentation**: `src/types/next-auth.d.ts` adds `id: string` to
  `Session.user`, `User`, and `JWT` so `session.user.id` is typed everywhere.

## Reading the session on the server

Route controllers call `getCurrentSession()`
([`src/lib/session.ts`](../src/lib/session.ts)), a thin wrapper around
`getServerSession(authOptions)` — this avoids every controller needing to
import and pair up both `getServerSession` and `authOptions` itself.

```ts
const session = await getCurrentSession();
if (!session?.user?.id) return unauthorized();
```

## Route-level protection

[`src/proxy.ts`](../src/proxy.ts) — this Next.js version's renamed
`middleware.ts` — wraps `next-auth/middleware`'s `withAuth` and gates whole
page trees behind a valid session:

```ts
matcher: ["/dashboard/:path*", "/profile/:path*", "/orders/:path*", "/stream/:path*"]
```

Unauthenticated visitors to any of those paths are redirected to `/login`
(`pages.signIn`). Note `/dashboard`, `/profile`, and `/orders` don't
currently exist as pages in this app — the matcher appears to be
forward-looking/leftover; only `/stream/*` is live and actually protected
today.

API routes are **not** covered by `proxy.ts`'s matcher — each one that needs
auth checks the session itself via `getCurrentSession()` in its controller
(see [api/routes.md](api/routes.md) for which routes require it).
