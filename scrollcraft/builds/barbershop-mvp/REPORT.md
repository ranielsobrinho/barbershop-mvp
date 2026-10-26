# REPORT.md — Seu Carlos Barbearia

**Brief:** self-authored from the user's eight answers, under explicit creative delegation. No interview transcript.
**Local URL:** http://localhost:8080 (landing) · http://localhost:8080/painel (painel)
**Build:** `scrollcraft/builds/barbershop-mvp/`

---

## Grammar

**Filmic one-shot.** The other seven lost for these reasons:

| Grammar | Why it lost |
|---|---|
| Chaptered editorial | The brief asks for one continuous world. Chapters require hard cuts, a folio and a title page; the shop would become a magazine. |
| Live surface | There is no product surface to operate. The booking form is real, but the page is still a story about a place; this grammar bans the wordmark bar and the hero claim. |
| Continuous world | Requires worldflight, which forbids document flow. The booking form needs focus, tab order, validation and submit. It is also the expensive, fragile option, and there is no footage. |
| Typographic poster | No cards, no form, no service list. The page has to sell four services and take a booking. |
| Gallery / catalog | The service rail fits, but the page is not a collection with an index. It has a hero, an argument and a close. |
| Split stage | There is no two-sided comparison. Inventing one would be false tension. |
| Rhythmic cutlist | The brief is quiet and calm. This grammar is fast, unpinned and loud, and it bans the dwell the booking needs. |

**Score:** pin → pan → flow. Three acts, 6.8 viewport-heights on desktop.

## Signature move

**The appointment card (ficha).** A paper slip that inks each row as the visitor chooses service, date, time and name, then takes an `AGENDADO` stamp on confirmation. It is the receipt the barber would hand across the counter, and it is the payoff of the booking act.

## Fingerprint gate

`scrollcraft/FINGERPRINTS.md` was empty at build time, so the gate clears automatically. The row is appended after this report. No existing build is re-skinned.

## Journey

1. **Recognition** (hero, pinned): the shop name, the pole/plate motif, one CTA. Quiet, no scroll nudge.
2. **Substance** (services): four services with fixed price and duration. Desktop is a lateral pan that reads as options; mobile is a stacked list that keeps every price legible.
3. **Commitment** (booking): four steps advance on selection, the card fills, and the stamp closes the loop.

## Feeling curve

| Act | Intended | Felt after verification |
|---|---|---|
| Hero | Trust, recognition | Trust is there; the mobile hero is quieter than intended (large negative space above the title). The plate frame and ghost word now anchor it. |
| Services | Clarity, confidence | Clear on both. Desktop pan reads as range; mobile stack removed the clipped heading/prices. |
| Booking | Ease, then relief | The stepper is quick, the card filling is the signature, the stamp lands. This is the peak. |

**Peak:** the stamp on the ficha. **Known deviation:** the booking act is a working surface and is shorter than the pinned acts (about 1.4vh vs 2.2 and 3.2). The stamp is the largest *change*, not the largest *span*. Adding empty pinning to win the span would be filler, so it was left short.

## Feel-check diff

| Intended | Felt | Change |
|---|---|---|
| Quiet opening | Mobile opened with ~290px of empty space above the title | Added a framed SC plate in the top-right, shortened the mobile hero span from 2.2 to 1.6, kept the copy visible to the end |
| Calm handoff | Hero copy faded out, leaving a lone CTA for ~1vh | Removed the hero fade-out (`data-sc-cue="0 1 0 0"`) |
| Services as options | At 390px the pan clipped the title and prices | Recomposed services as a stacked flow on phones; desktop keeps the pan |
| Premium minimal | Header wrapped and the CTA was cut at 390px | Hid demo tag/Painel under 560, `nowrap` on brand and CTA, clipped horizontal overflow |
| Readable hero | Bright poles sat behind the lede (2.53:1) | Hid poles on mobile, reduced visual opacity, added a scrim; worst cue now 6.72:1 |
| Trustworthy facts | "Desde 1998" was invented; footer hours contradicted the seed | Removed the date; footer now says Seg–Sex 9h–18h · Sáb 8h–14h |

## Score table

| Beat | Device | Why |
|---|---|---|
| Recognition | `pin` + `kinetic` + `parallax` | The frame holds while the name lands and the plate/poles drift at different rates |
| Substance | `pan` (desktop) / stacked `flow` (mobile) | Lateral travel reads as options; on a phone the same content needs full-width labels |
| Commitment | `flow` + stepper + bespoke card/stamp | The form is a real working surface; the card is the one thing no other site does |

No video and no scrub. Five device families are present on desktop: pin, kinetic, parallax, pan, plus the bespoke card. Mobile trades pan for a stacked flow, documented above.

## Generated

- No AI images or footage (`KIE_AI_API_KEY` is not set). The hero uses the admin `heroImageUrl` when configured; otherwise it is the CSS plate, barber poles and `SC` seal.
- Generated in code: the paper ficha, the perforation edge, the stamp, the calendar, the favicon, the barber-pole stripes and the grain.

## Verified

- **Desktop** 1440×900, 10 samples/act: 6.8vh, `pin > pan > flow`, no dead scroll, all cues ≥4.5:1. `lab/shots/`.
- **Mobile** 390×844, 8 samples/act: 5.3vh, `pin > flow > flow`, no dead scroll, all cues ≥4.5:1. Worst hero-lede contrast 6.72:1. `lab/mobile/`.
- **Reduced motion** desktop and mobile: no dead scroll, all cues ≥4.5:1. `lab/reduced/`, `lab/mobile-reduced/`.
- **Booking flow on mobile:** 11 enabled dates, 16 slots, phone mask `(85) 98888-7777`, card inked with service/date/time/client/total, `AGENDADO` stamp at 0.9 opacity, done panel visible, no demo prefix on the ficha number. `lab/mobile-confirmed.png`.
- **`/painel`:** redirects to `/painel/admin/login`, renders the login form, all assets and the favicon return 200.
- **Demo fallback:** forced with `?demo=1`; auto when the gateway is down. The only console errors in the harness are the expected 502s from the absent gateway.

## Not verified

- Live gateway/API end-to-end: Postgres and the seven services were not running, so `POST /api/appointments`, admin login and blocked-date reads were not exercised against real data.
- The gateway `/api/blocked-dates` route was fixed to point at the scheduling service (it was returning `{ blocks }` from the blocks service while both clients expect `{ dates }`), but that fix is verified by source and a rebuilt `dist`, not by a live request.
- Safari/iOS and Firefox rendering; only Chromium was shot.
- A configured `heroImageUrl`; the hero image path is wired but no image was set.
