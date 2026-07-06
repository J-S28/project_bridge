# Master Schedule — July 5 (today) → July 8 (deadline)

Supersedes the "must finish by midnight" framing in TODAY.md. Keep working
through TODAY.md's Chunks 1-4 tonight if you have energy for it, but the
pressure is off to finish everything by midnight. Sequence below is the
real one.

## Tonight (July 5, evening → as late as you want)

TODAY.md Chunks 1-4, in order, testing after each:
1. Explain the system to Claude Code, sanity-check its auth plan
2. Auth — citizen signup/login + government official signup/login (role +
   department/constituency)
3. Citizen submit — text + multilingual voice (browser SpeechRecognition,
   language dropdown) + photo upload (real Firebase Storage) + location +
   live AI classification preview
4. Officer queue (restricted status transitions) + citizen
   confirm/reopen loop

If you only get through 1-3 tonight, that's a completely fine stopping
point — you'll have a working, demoable citizen-facing loop.

## Tomorrow evening/night (July 6) — MP/MLA dashboards, the centerpiece

This is the most important session. Priority order within it:

1. **Seed script for demo government accounts** — fixed credentials for
   8 department officers, 1-2 MLAs (different wards), 1 MP. Write the
   actual list of emails/passwords into a `DEMO_LOGINS.md` so you're not
   hunting for them during your demo recording.
2. **MP dashboard, built for visual impact:**
   - Department breakdown — use real charts (recharts bar/donut), not
     plain divs. This is where "high-end" actually shows.
   - AI insight paragraph (already speced) — make it prominent, top of
     page, not buried
   - Priority-ranking panel (BUILD_SPEC.md §5) — the ranked development
     priorities against seeded demographic data. This is the single
     highest-value feature for judging criteria (Problem-Solution Fit)
     — don't cut it for time
   - Escalated/suggestion queue — cases flagged
     `escalateToRepresentative`, visually separated from routine ones,
     showing priority (Critical/High/Medium/Low) clearly
   - Google Maps view — complaint locations plotted, colored by
     priority or department
   - Ward-by-ward comparison table (already speced)
3. **MLA dashboard** — same components, scoped to one ward. Can reuse
   most of what you build for MP.

## Tuesday (July 7) — Polish, deploy, seed realistic data

- Deploy to Firebase App Hosting (or Vercel if you hit friction) — do
  this early in the day, not at 11pm, so you have time to debug a
  deploy-only issue
- Seed 15-20 realistic demo complaints across 3-4 wards with varied
  priorities/departments/some escalated/some resolved — this is what
  makes your demo video look like a real, used product instead of an
  empty shell
- Full end-to-end run-through: submit as citizen (try the voice input
  in a non-English language on camera-ready audio), handle as officer,
  confirm as citizen, review as MLA, review as MP
- Fix whatever breaks — budget the whole day for this, deploys always
  surface something local dev didn't

## Wednesday (July 8) — deadline day

- Record the 3-5 min demo video (script it briefly first — problem →
  citizen submits by voice → AI classifies → officer resolves → citizen
  confirms → MP dashboard with ranking/analytics; that arc alone tells
  the whole story)
- Build the pitch deck (10-12 slides): problem, solution, AI/technical
  approach, who it serves, why deployable, how it scales — plus one
  slide explicitly listing what's roadmap vs. built (multilingual
  translation, live Census API, real govt SSO)
- Submit: GitHub repo, video, deck, deployed link — with buffer time
  before the actual deadline, not at the wire

## What NOT to add, even if you have spare time

WhatsApp/SMS intake, full Cloud Speech-to-Text migration, live
data.gov.in API calls. These read well as a "future roadmap" slide and
poorly as a rushed, half-working feature in your demo video.
