# Flow: Going Live, Reconnecting, and Ending a Stream

## 1. Setting up a stream

1. User fills out the stream setup form
   (`src/components/stream/pages/stream-setup-form.tsx`) at `/stream/new`.
2. The form values (`StreamSetupValues`) are written to
   `localStorage` under `evangeli3e:stream-setup-draft`
   (`writeStreamSetupDraft`, `src/components/stream/utils/stream-session-storage.ts`)
   — nothing hits the server yet.
3. `/stream/dashboard` checks for a complete draft
   (`isStreamSetupComplete`) on load; if missing, it redirects back to
   `/stream/new`.

## 2. Going live

```text
"Go Live" button (Camerapreview / StreamControls)
  ↓
useGoLive() (src/components/stream/utils/GoLive.ts)
  ↓
sendStreamSetupToToken() — reads the localStorage draft
  ↓
POST /api/livekit/token
  ↓
route.ts → createBroadcastTokenController
  ↓
  - getCurrentSession() → 401 if signed out
  - createBroadcastSession(data, session.user)     [livekit.service/]
      ↓
      createLivestream(payload, sessionUser)        [livestream.service/]
        - validates sessionName/sessionDescription/tags/scheduleDate
        - looks up the user, creates the `livestream` row (status: LIVE)
      ↓
      issues a LiveKit AccessToken (canPublish + canSubscribe)
  ↓
{ token, livestreamId, roomName, message }
  ↓
Browser: new Room().connect(NEXT_PUBLIC_LIVEKIT_URL, token)
  ↓
publishTrack(audio), publishTrack(video)
  ↓
UI flips to the live view (isLive = true)
```

While live, the broadcaster's client calls `POST /api/livekit/heartbeat`
periodically with `{ roomId: livestreamId }`
(`heartbeatController` → `recordHeartbeat`), stamping `lastSeenAt` on the
`livestream` row. This is what lets the reconnect-grace-period and cron
cleanup tell a genuinely-dead stream apart from a brief network hiccup.

## 3. Reconnecting after a dropped connection

```text
useReconnectToLiveKit() (src/components/stream/utils/reconnectToLivestreams.ts)
  ↓
POST /api/livekit/token/reconnect  { livestreamId }
  ↓
createReconnectTokenController
  ↓
  createReconnectSession(livestreamId, session.user.id)  [livekit.service/]
    - re-checks the livestream is owned by the caller AND still LIVE
    - issues a fresh AccessToken for the same room
  ↓
{ token, livestreamId, roomName, message }
  ↓
Browser re-connects to the same LiveKit room and re-publishes tracks
```

## 4. Ending a stream

Two independent paths mark a livestream `ENDED`:

**a) Explicit end** — the broadcaster clicks "End Stream":

```text
useEndStream() (src/components/stream/utils/Endstream.ts)
  ↓
room.disconnect(false)   — leaves LiveKit without stopping camera/mic
  ↓
POST /api/livekit/livestreams/end  { id: livestreamId }
  ↓
endBroadcastController → endBroadcastRoom(id)   [livekit.service/]
  - RoomServiceClient.deleteRoom(id)
  - marks the livestream ENDED, sets endedAt
```

**b) Implicit end (no explicit action)** — two safety nets, in case the
"End Stream" click never happens (crash, closed tab, lost connectivity):

- **LiveKit webhook**: `POST /api/livekit/webhook` receives
  `participant_left` when the broadcaster's LiveKit connection drops.
  `handleParticipantLeft` waits 30 seconds, then checks `lastSeenAt`; if no
  heartbeat arrived in that window, it ends the stream the same way as (a).
- **Cron cleanup**: `GET /api/livekit/cleanup`, called every 5 minutes by
  Vercel Cron, force-ends any stream still `LIVE` whose heartbeat is over 90
  seconds stale — independent of whether the webhook ever fired.
