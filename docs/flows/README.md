# Workflow Flows

Step-by-step traces of this app's major user-facing workflows, from the UI
action through to the database/external service and back.

- [go-live.md](go-live.md) — starting a broadcast, reconnecting after a
  dropped connection, and how a stream eventually ends.
- [post-comment.md](post-comment.md) — posting and receiving live comments.

Each flow uses the same shape as [../architecture.md](../architecture.md):

```text
User action → API route → Controller → Service → Database / LiveKit → Response → UI
```
