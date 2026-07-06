# Project Bridge — Build Spec

**Hackathon:** People's Priorities — AI for Constituency Development Planning
**Deadline:** July 8 (submission), demo day July 23
**Builder:** Solo, a few hours/day

Give this whole file to Claude Code and say: *"Read BUILD_SPEC.md and implement Day 1 first. Ask me before starting Day 2."*

---

## 1. The problem (from the official brief)

MPs/MLAs get development requests through scattered channels (meetings, letters,
grievance portals, social media) with no way to consolidate them, spot recurring
needs, or weigh competing proposals against real demand data (e.g. a request for
school upgrades vs. actual enrollment and travel-distance numbers).

## 2. The product, in one paragraph

Citizens report civic issues (text, voice, photo) in plain language. Gemini reads
the submission, assigns a department, priority, and a short summary, and flags
whether this is a routine fix or something that needs budget/infrastructure
decision-making — in which case it also surfaces on the MP's desk, not just the
department's. Officers work routine cases through a status pipeline, but **only
the citizen can close a case** — officers submit proof of work, the citizen
confirms it or reopens it. MLAs and MPs don't just see a ticket queue: they see
department performance, a map of where issues cluster, and an AI-ranked list of
which development priorities the data actually supports.

## 3. Data model

```ts
type Status =
  | "Submitted" | "Acknowledged" | "In Progress" | "Escalated"
  | "Pending Citizen Confirmation"  // officer says done, citizen hasn't confirmed
  | "Reopened"                      // citizen rejected the resolution
  | "Resolved" | "Closed";          // terminal states, citizen-set only

// Officers may only set: Acknowledged, In Progress, Escalated, Pending Citizen Confirmation
// Citizens may only set: Resolved (via confirm) -> auto to Closed, or Reopened (via reject)

interface AIClassification {
  department: Department;       // one of 8 fixed departments
  category: string;
  subcategory: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  sentiment: "Urgent" | "Frustrated" | "Neutral" | "Appreciative" | "Suggestion";
  summary: string;               // <=25 words
  possibleDuplicateIds: string[];
  confidence: number;            // 0-1
  escalateToRepresentative: boolean; // true if this needs budget/capital infra, not routine fix
  escalationReason?: string;
}

interface Complaint {
  id: string;
  citizenId: string;
  type: "Grievance" | "Suggestion";
  rawText: string;
  imageUrls: string[];           // citizen's "before" photos
  location: { lat: number; lng: number; address?: string; ward?: string;
              constituencyMLA?: string; constituencyMP?: string };
  ai: AIClassification;
  status: Status;
  history: Array<{ status: Status; note?: string; updatedBy: string;
                    updatedAt: string; proofImageUrls?: string[] }>; // officer's "after" photos live here
  assignedOfficerId?: string;
  createdAt: string; updatedAt: string;
  citizenRating?: number; citizenFeedback?: string;
}
```

## 4. AI behavior (Vertex AI / Gemini)

Two model calls, both server-side:

1. **Classification** — given raw text + a list of nearby open complaints (same
   ~500m box, last 30 days), return the `AIClassification` JSON above. Ask the
   model explicitly: *"is this a routine department fix, or does it require
   budget allocation / a capital infrastructure project?"* — that answer
   becomes `escalateToRepresentative`.
2. **Constituency insight** — given department complaint counts (current vs.
   previous 30-day window) and top recurring subcategories, generate a 3-4
   sentence narrative for the MLA/MP dashboard naming the sharpest change and
   one recommendation. This is the exact "Road infrastructure complaints
   increased by 32%..." example from the vision doc — make it real, not
   decorative.

## 5. The priority-ranking feature (this is the actual core ask — don't skip it)

The brief's real ask is comparing citizen demand against real data, not just
routing tickets. Given 3 days, build a **lightweight but real** version:

- Seed a small static per-ward dataset (JSON is fine): school enrollment
  numbers, distance-to-nearest-facility, an "infra gap" score — 3-4 wards is
  enough for a convincing demo. Cite that this stands in for
  Census/NFHS/data.gov.in in production.
- Add a Gemini call that takes: citizen suggestion counts per ward/category +
  this seeded demographic data, and returns a ranked list of top 3-5
  development priorities per constituency with a one-line justification each
  (e.g. "Vocational centre in Ward 9 — 340 suggestions, 2nd-highest
  travel-distance-to-facility score, no existing vocational infrastructure").
- Surface this as a distinct panel on the MLA/MP dashboard, separate from the
  routine complaint feed.

## 6. Screens

- **Landing** — role selector (citizen / officer / MLA / MP)
- **Citizen: submit** — text box + a mic button using the browser's built-in
  `SpeechRecognition` API for voice-to-text (no backend needed, works in
  Chrome/Edge) + photo upload + "use my location" + live AI preview before
  confirming submission
- **Citizen: dashboard** — their own complaints; for any in "Pending Citizen
  Confirmation," show the officer's proof photo with **Confirm** / **Not
  resolved** buttons
- **Officer: dashboard** — queue filtered by department; status buttons
  limited to the officer-settable list; "Pending Citizen Confirmation"
  requires attaching a proof photo URL
- **MLA: dashboard** — department breakdown bars, AI insight paragraph,
  priority-ranking panel (§5), map of complaint locations in their ward
  (Google Maps JS API, simple markers is enough — don't over-invest in this)
- **MP: dashboard** — same as MLA but constituency-wide, plus a ward-by-ward
  comparison table, plus a separate "Needs funding/infra decision" queue
  filtered on `ai.escalateToRepresentative`

## 7. Auth (kept intentionally minimal for the hackathon)

Firebase Authentication with email/password is enough for the demo. Officials
"logging in with a government employee ID" is a **real production
requirement, not a 3-day one** — note it explicitly on the pitch deck as
architecture-ready-but-not-built (a `department`/`constituency` field already
exists on the user record; swapping the login method later doesn't change the
data model).

## 8. What to explicitly cut and say so on the pitch deck

- Full multilingual translation (Cloud Translation API) — voice input via
  browser API ships instead; note multilingual is straightforward to add
  since Gemini already understands multiple languages natively
- Live Census/NFHS/data.gov.in API integration — seeded dataset stands in
- Cloud Speech-to-Text / Dialogflow — browser SpeechRecognition covers the
  demo need at zero setup cost
- Real government ID SSO — Firebase Auth stands in
- WhatsApp/SMS intake — out of scope entirely for this pass

Naming these explicitly and briefly (not apologetically) directly serves the
"Presentation & Clarity" and "Deployability" criteria — judges read scoped
honesty as a sign of technical maturity, not weakness.

## 9. Build order (map to the 3 days)

**Day 1:** Data model + Gemini classification call + citizen submit flow
(text + photo + location, live preview) + officer queue with restricted
status transitions + citizen confirm/reopen flow. Get this looping
end-to-end locally before anything else.

**Day 2:** MLA/MP dashboards — department breakdown, AI insight generation,
priority-ranking panel with seeded demographic data, complaint map. Voice
input via SpeechRecognition (cheap, do it same day if time allows).

**Day 3:** Deploy (Firebase App Hosting), seed realistic demo data across
3-4 wards, record the 3-5 min demo video, build the 10-12 slide pitch deck.

## 10. Submission checklist

- [ ] Public (or access-granted) GitHub repo
- [ ] Demo video, 3-5 min, showing it working end-to-end
- [ ] Pitch deck, 10-12 slides: problem, solution, AI/technical approach, who
      it serves, why it's deployable, how it scales beyond a pilot
- [ ] Deployed prototype link
