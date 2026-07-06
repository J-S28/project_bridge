# TODAY — Compressed Build Order (2:30pm → midnight)

Read this alongside BUILD_SPEC.md. This file only reorders things and adds
auth + multilingual voice, which weren't in the original Day 1 scope.

**Rule for tonight: work in the chunks below, one at a time. After each
chunk, actually run the app and click through it before telling Claude Code
to start the next chunk.** Don't hand Claude Code all six chunks in one
message — you won't be able to catch a bad decision in chunk 2 if chunks
3-6 are already built on top of it.

---

## Chunk 1 (~45 min) — Explain the system once

Paste BUILD_SPEC.md + this file into Claude Code. Say:

> Read BUILD_SPEC.md and TODAY.md. Don't write code yet — first tell me
> your plan for Chunk 2 (auth) in a few sentences so I can sanity-check it.

Check its plan matches: two roles at signup — **Citizen** and **Government
Official**. Official signup additionally asks for department (for
officers) or constituency (for MLA/MP) — a simple dropdown is fine, no real
government ID verification tonight (that's a noted roadmap item, not a
tonight item).

## Chunk 2 (~1.5-2 hrs) — Auth, both roles

Firebase Authentication, email/password is enough — Google sign-in is a
nice-to-have, not required.

- Signup form: role picker (Citizen / Government Official) → if Official,
  show department dropdown (the 8 fixed departments) or constituency name
  → write an `AppUser` doc to Firestore on signup
- Login form
- Route protection: citizen routes require role=citizen, officer/mla/mp
  routes require the matching role — redirect to login otherwise
- **Test it**: sign up as a citizen, sign up as an official, confirm you
  land on the right dashboard for each, confirm logging out and back in
  works

Don't move on until this actually works in the browser.

## Chunk 3 (~1.5-2 hrs) — Citizen submit, with multilingual voice

- Text box, as already speced
- Add a mic button using the browser's `SpeechRecognition` /
  `webkitSpeechRecognition` API. Add a language dropdown next to it
  (English, Hindi, Telugu, Tamil — whatever's most relevant to your
  constituency) that sets `recognition.lang` (e.g. `hi-IN`, `te-IN`,
  `ta-IN`) before starting. Recognized text fills the same text box the
  typed version would.
- Photo upload (Firebase Storage — actual upload, not a placeholder URL,
  since this is on the list for tonight)
- "Use my location"
- Live AI preview → confirm → submit (as speced)

**Test it**: submit one complaint in English, one in Hindi (or whichever
language you speak), confirm both get classified into a sensible
department. This is your multilingual proof for the demo video.

## Chunk 4 (~1-1.5 hrs) — Officer flow + citizen confirmation

- Officer queue filtered by their own department (from their AppUser doc,
  not a picker anymore now that auth exists)
- Restricted status buttons (no direct Closed)
- Citizen dashboard: Confirm / Not resolved actions on "Pending Citizen
  Confirmation" items, showing the officer's proof photo

**Test it**: full loop — submit as citizen, log in as official, move it
through statuses, log back in as citizen, confirm it closes.

## If you still have hours left tonight

Only then move to MLA/MP dashboards from BUILD_SPEC.md §6. If you don't
get to them tonight, that's fine — the citizen ↔ officer loop with working
multilingual voice input is a legitimate, demo-able product on its own, and
you have two more days for the representative-facing side and the ranking
feature.

## If you're at hour 8 and something's still broken

Stop adding features. A smaller thing that works end-to-end beats a bigger
thing that breaks on stage — that's literally 25% of your grade
(Deployability & Scalability).
