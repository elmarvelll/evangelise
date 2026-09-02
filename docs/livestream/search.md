# Livestream Search

`GET /api/livestreams` — one query, real Prisma reads, always paginated.
No in-memory filtering of a full table scan, and no static/mock results.

## Query parameters (all optional, independent, combinable)

| Param | Matches |
|---|---|
| `search` | Case-sensitive-per-DB-collation substring match against `sessionName` OR `sessionDescription` |
| `category` | Exact match against `StreamCategory` — `400` if the value isn't a real category |
| `genre` | Exact match against `StreamGenre` — `400` if the value isn't a real genre |
| `cursor` | Continue from a previous page's `nextCursor` |
| `limit` | Page size, default 20, max 50 |

All examples from the spec work as literal query strings:

```
/api/livestreams?search=worship
/api/livestreams?category=Music
/api/livestreams?genre=Worship
/api/livestreams?search=worship&category=Music
/api/livestreams?search=worship&genre=Worship
/api/livestreams?search=worship&category=Music&genre=Worship
```

With no params at all, it's the same query with every filter clause
skipped — "every live stream," unchanged from before this pass.

## Response

```json
{
  "livestreams": [
    {
      "id": "...", "userId": "...", "sessionName": "...", "sessionDescription": "...",
      "selectedTags": ["..."], "category": "Music", "genre": "Worship",
      "status": "LIVE", "donationEnabled": true,
      "donationBankName": "...", "donationAccountName": "...", "donationAccountNumber": "...",
      "user": { "firstName": "...", "lastName": "..." }
    }
  ],
  "nextCursor": "cmxyz..." // or null when there are no more results
}
```

`donationBankName`/`donationAccountName`/`donationAccountNumber` are only
non-null when `donationEnabled` is true — the frontend's `DonationCard`
renders nothing at all otherwise (see [donations.md](donations.md)).

## Empty results

Zero matches returns `{ livestreams: [], nextCursor: null }` — the
`SearchBar` component renders "No streams found for these filters." No
fake/placeholder streams are ever shown.

## Frontend

`SearchBar` (`src/components/home/Search.tsx`) debounces the text input,
lets a viewer pick a category and/or genre from a filter menu independently,
shows loading/error/empty states, and has a "Load more" button that appends
the next page using `nextCursor` rather than re-fetching everything.

## Retired: `POST /api/search`

The old, separate search implementation (query text + free-form tag
filters) is retired — it now returns `410 Gone` pointing at
`GET /api/livestreams`. See
[../decisions/livestream-decisions.md](../decisions/livestream-decisions.md#search-one-query-not-two).
