# Addendum — Clustering & Hierarchical Escalation

Read alongside BUILD_SPEC.md. Adds two features the citizen-officer core
loop doesn't cover yet. Build these on Day 2 (tomorrow), alongside the
MLA/MP dashboards — they're pointless without dashboards to show them on.

## 1. Duplicate grouping (not just flagging)

Extend the existing nearby-complaint + Gemini duplicate check from
BUILD_SPEC §3-4. Instead of creating an independent complaint when Gemini
returns a match in `possibleDuplicateIds`:

```ts
interface Complaint {
  // ...existing fields...
  clusterId?: string;        // set to the canonical complaint's own id if
                              // this complaint IS the canonical one; on a
                              // merged duplicate, set to the ORIGINAL
                              // complaint's id instead of creating a new doc
  reportCount: number;        // only meaningful on the canonical complaint;
                              // starts at 1, +1 per merged duplicate
  reportedByCitizenIds: string[]; // who reported this issue (canonical only)
}
```

On submit: if classification returns a confident duplicate match, don't
write a new complaint document — instead, transactionally increment
`reportCount` and append to `reportedByCitizenIds` on the matched
complaint, and tell the citizen "12 others have reported this — you've
been added to it," with a link to track the existing one.

Officer queue and MLA/MP dashboards query only canonical complaints
(`clusterId == own id`) and display `reportCount` prominently — this is
what lets an officer see "127 complaints" collapse into "1 issue, 127
reports" without opening each one.

## 2. Hierarchical escalation

Not a real-time notification system — a **computed-at-read-time** level,
so it needs no background jobs, cron, or messaging.

```ts
type EscalationLevel = 0 | 1 | 2 | 3;
// 0 = assigned officer, 1 = department head, 2 = MLA, 3 = MP

const ESCALATION_THRESHOLD_HOURS: Record<Priority, number> = {
  Critical: 24,
  High: 72,
  Medium: 168,   // 7 days
  Low: 336,      // 14 days
};

function computeEscalationLevel(complaint: Complaint): EscalationLevel {
  if (["Resolved", "Closed", "Pending Citizen Confirmation"].includes(complaint.status)) {
    return 0; // not stuck, don't escalate
  }
  const hoursSinceLastUpdate =
    (Date.now() - new Date(complaint.updatedAt).getTime()) / 36e5;
  const threshold = ESCALATION_THRESHOLD_HOURS[complaint.ai.priority];

  if (hoursSinceLastUpdate < threshold) return 0;
  if (hoursSinceLastUpdate < threshold * 2) return 1;
  if (hoursSinceLastUpdate < threshold * 3) return 2;
  return 3;
}
```

This function runs wherever a complaint is displayed (officer queue,
MLA dashboard, MP dashboard) — no stored field, no cron job, always
correct as of page load. A complaint that's sat too long visibly moves
from the officer's queue into the MLA's "escalated" view, and if it sits
longer still, into the MP's — purely because time has passed, which is
exactly the effect you want on camera during the demo (seed a couple of
old, deliberately-stuck demo complaints with old `updatedAt` timestamps
so this is visible without waiting real days).

Note this is separate from `escalateToRepresentative` (BUILD_SPEC §3-4) —
that flag means "this needs budget/infra, route to MP regardless of time."
This escalation level means "nobody acted in time, bump it up." An MP
dashboard should show both: things escalated because they need funding,
and things escalated because they're stuck.
