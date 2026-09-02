# Donations

Bank-transfer information a viewer can use to support a streamer directly.
**Not** an in-app payment/donation system — no money moves through this
app.

## Fields (`livestream`)

| Field | Notes |
|---|---|
| `donationEnabled` | `Boolean`, default `false` |
| `donationBankName` | `String?` |
| `donationAccountName` | `String?` |
| `donationAccountNumber` | `String?` |

## Validation — all three or none

`livestream.service/validate-donation-info.ts`, called from
`createLivestream`: if `donationEnabled` is `true`, **all three** of
`donationBankName`, `donationAccountName`, `donationAccountNumber` must be
non-empty, or the request is rejected with `400 ValidationError`
("Bank name, account name, and account number are all required when
donations are enabled."). If `donationEnabled` is `false`, all three are
stored as `null` regardless of what was submitted — there's no partial
state where donations are "off" but stale bank details linger in the
database.

The setup form (`DonationSetupCard`,
`src/components/stream/donation-setup-card.tsx`) mirrors this client-side
(disables "Go to dashboard" if donations are enabled with any field blank)
for immediate feedback — the server check above is the actual guard.

## Where entered

At stream-setup time, alongside category/genre/tags (see
[lifecycle.md](lifecycle.md)) — per-stream, not saved once on the user's
profile and reused. See
[../decisions/livestream-decisions.md](../decisions/livestream-decisions.md#donations-fields-on-livestream-not-user)
for why.

## Where shown

`DonationCard` (`src/components/home/donation-card.tsx`), rendered in the
viewer's "About" panel. Renders **nothing** — not even an empty
placeholder — unless `donationEnabled` is true and all three fields are
present:

```
Support this ministry

Bank: Access Bank
Account name: John Doe Ministries
Account number: 0123456789
```
