# BRIEF.md — Barbershop MVP

**Self-authored under explicit creative delegation** — answers provided by user, synthesized below.

---

## 1. Vibe in 3–5 words
Barbershop, haircut, barber — traditional, masculine, craft-focused.

**References**: A classic barbershop pole spinning, the smell of bay rum and hot towels, a straight-razor shave in a leather chair.

---

## 2. Scroll journey (user's sequence)
1. **Home/Hero** — Recognition: the barbershop identity, immediate trust
2. **Services** — Substance: what's offered, pricing, duration
3. **Booking** — Commitment: the action, frictionless scheduling

---

## 3. Energy curve
Quiet throughout. No loud peaks. A calm, confident rhythm — like the shop itself.

---

## 4. Feeling curve (emotion per act + the peak)

| Act | Emotion | What on screen causes it |
|-----|---------|---------------------------|
| 1. Hero | **Trust / Recognition** | The shop's name in strong type, the hero image (if set), the "online booking" badge — immediate legitimacy |
| 2. Services | **Clarity / Confidence** | Clean service cards with name, duration, price — no guessing, no friction |
| 3. Booking | **Ease / Satisfaction** | The stepper flows naturally; the confirmation screen is the payoff |

**The Peak (Act 3 — Booking Confirmation)**:  
*"It's the moment the screen says 'Agendado!' and you just know it's done — no email to check, no callback to wait for."*

Peak lives in **Act 3**, largest scroll span by a visible margin. Act 2 is quieter than Act 3.

---

## 5. One thing no other site does
**The booking flow *is* the signature move** — a 4-step stepper (Service → Date → Time → Confirm) that feels like a conversation with the barber, not a form. Each step advances on selection (no "Next" buttons until the final data entry), the calendar respects blocked dates in real time, and the confirmation screen is the receipt you'd get handed across the counter.

---

## 6. Aesthetic range
**Premium-minimal** — restraint, typography-led, photographic depth, no decoration for decoration's sake.

---

## 7. Structure
**One unbroken world (worldflight)** — the scroll flows continuously from hero through services into booking. No hard section breaks, no "page within a page." The background, typography, and motion language persist across all three acts.

---

## 8. Assets available
- **Hero image**: Admin-configurable `heroImageUrl` (stored in settings, displayed in Hero component)
- **Brand**: Name "Seu Carlos Barbearia", primary color palette (defined in Tailwind config as `primary-*`)
- **No product photography, no footage, no brand kit beyond the above**
- Other sections: generated / designed from scratch

---

## The Tell-Someone Sentence
> **"It's the site where you book a haircut in four calm taps and the confirmation feels like the barber just nodded 'you're in.'"

---

## Authored Silences (for verification)
- No scroll cues, arrows, or "scroll to explore" nudges
- No section counters (01/03)
- No eyebrow labels above headings
- No centred copy in every act — anchor varies (centre hero, lead services, split booking)
- No em dashes
- No gradient text, neon glows, or coloured halos
- No autoplaying audio
- No clay/diorama aesthetic — photographic or clean minimal only

---

## Fingerprint Targets (for gate)
This build must differ from any existing row in FINGERPRINTS.md on ≥4 of 6 dimensions:
- Grammar
- Nav treatment
- Hero device
- Act-sequence shape
- Close pattern
- Signature move

(Registry is currently empty — first build clears automatically.)

---

## Build decisions (post-interview)

- **Grammar:** filmic one-shot. The interview answered "one unbroken world"; worldflight was rejected because it bans document flow, and the booking form needs a real form (focus, tab order, submit, validation). The world persists through the palette, type and motion language instead.
- **Signature move:** the appointment card (ficha) that inks each row as the user chooses, then takes the AGENDADO stamp.
- **Authored silences enforced:** no eyebrow labels above headings (the hero kicker and services kicker were removed), no section counters, no em dashes in prose.
- **Removed unverified fact:** "Desde 1998" was not in the brief or the data; the hero now carries no founding-date claim.
- **Known deviation:** the booking act is a working surface and is shorter than the pinned acts; the peak is the stamp, not the longest scroll span. See REPORT.md.
