# Demo Video Script (4.5-6 minutes)

Have `DEMO_LOGINS.md` open in another tab. Use two browser windows side by side if you can (citizen in one, official in the other) — saves a lot of logging in/out on camera. Screen-record at 1080p; a phone recording your screen is fine too.

Live prototype: **https://project-bridge-eight.vercel.app**

---

## 0:00–0:20 — Cold open (say this over the landing page)

> "MPs and MLAs get development requests through meetings, letters, grievance portals, social media — completely scattered, with no way to tell what's actually urgent, or to compare what citizens are asking for against real infrastructure data. Project Bridge fixes both problems. Let me show you."

Show the landing page — the two role cards (Citizen / Government Official).

## 0:20–1:30 — Citizen submits (the multilingual proof point)

1. Sign up a **new** citizen account live on camera (any test email) — keep it quick, don't linger on the form.
2. Land on the citizen dashboard, click **Submit a complaint**.
3. Type or speak a complaint. **Do one in English, then show the mic button and speak one sentence in Hindi/Telugu/Tamil** — whichever you speak. Point out: *"No language picker — it auto-detects the language."*
4. Click **Preview AI classification** — narrate what comes back: *"Gemini reads this, in whatever language, and returns a department, a priority, a sentiment, and a summary — live, before I even submit."*
5. Click **Use my location** (point out it auto-matches to the nearest ward — no manual picking).
6. Click **Confirm & submit**.

> "That's the citizen side. Now let's see it from the other end."

## 1:30–2:30 — Officer resolves, citizen confirms (the trust mechanism)

1. Switch to your second window, log in as the matching officer (e.g. `officer.sanitation@projectbridge.demo` / `Demo@12345` if you filed a Sanitation complaint — check `DEMO_LOGINS.md` for the right department/ward match, or just use one of the pre-seeded complaints instead of your fresh one to save time).
2. Show the complaint appears in their queue — **filtered to only their department and ward**.
3. Click through **Mark Acknowledged → Mark In Progress → Mark done (attach proof photo)** — upload any photo.

> "Notice there's no 'Closed' button anywhere in this account. Officers can never unilaterally close a case — that's not a UI restriction, it's enforced in the database rules themselves."

4. Switch back to the citizen window, refresh — show it updated **live**, no manual refresh needed, to "Pending Citizen Confirmation" with the officer's proof photo.
5. Click **Confirm** — show it move to **Closed**.

## 2:30–3:20 — Office staff intake + duplicate consolidation (consolidating multi-source grievances)

> "Citizens aren't the only source. MPs and MLAs also get letters, phone calls, and requests raised in public meetings — so we built a way to bring those into the exact same pipeline."

1. Log in as an office staff account (see `DEMO_LOGINS.md` or sign up fresh via **Government official sign up → Grievance Intake Officer**).
2. Click **Register complaint**, pick a **Source** other than Citizen App (e.g. "Letter" or "Public Meeting"), type a short grievance, and run it through the same **Preview AI classification** step.
3. Point out the read-only note: *"A staff member logs what happened — they can't hand-pick the classification or the priority, same as the citizen flow."*
4. After confirming, show it landing on the **intake dashboard** with the source tag, then flip to the matching officer's queue and point out the **"Logged by [name]"** line — *"The officer sees exactly where this came from."*
5. If you have two similar complaints for the same ward, submit a near-duplicate and show the "N reports" badge appear instead of a second card: *"Nine people reporting the same pothole becomes one tracked issue with a rising report count — not nine tickets competing for attention."*

## 3:20–5:00 — MP dashboard (the actual differentiator)

1. Log in as `mp.malkajgiri@projectbridge.demo` / `Demo@12345`.
2. Point at the **AI insight** paragraph first: *"This is generated from real department complaint counts, comparing this month to last."*
3. Scroll to the **department breakdown chart**, then the **demand hotspot map** and **priority heatmap** — *"Every ward plotted by real location and colored red-orange-yellow-green by how severe its worst open issue is — a rep can tell where to look before opening a single case."* Then the **ward-by-ward comparison table** underneath for the exact numbers.
4. **Spend real time on the Priority-Ranking panel** — this is the core ask of the brief:

> "This is the actual differentiator. It's not just routing tickets — it's comparing what citizens are asking for against a seeded dataset standing in for real Census and infrastructure data. Watch: [read one ranked priority aloud, e.g.] 'Vocational Training Centre in Uppal — 2 citizen suggestions, ward infra-gap score 68, 5.8 kilometers to the nearest facility, no existing vocational infrastructure.' That's a real, data-backed recommendation, not a guess."

5. Scroll to **Escalated** — point out one item stuck at "MP level," and explain in one sentence: *"This is computed automatically from how long a case has sat, unresolved, weighed against its priority — no one has to notice it, the system surfaces it."*

## 5:00–5:30 — Close

> "Citizen, office staff, officer, department head, MLA, MP — one connected loop, every channel feeding the same pipeline, duplicates consolidated instead of piling up, hotspots visible at a glance, and an AI feature that actually answers the brief's question: not what people are complaining about, but what the data says to build next. It's live today at project-bridge-eight.vercel.app — thanks for watching."

---

## If you're short on time, cut in this order (least to most important)

1. Cut the fresh citizen signup — use a pre-seeded complaint/account instead everywhere
2. Cut the officer status-by-status walkthrough — jump straight to "Pending Citizen Confirmation → Confirm"
3. Cut the department breakdown chart narration — just show it, don't explain it
4. Cut the duplicate-report-badge demo — just mention it exists while pointing at the intake dashboard
5. Cut the office staff intake section entirely if truly pressed for time
6. **Never cut the priority-ranking panel or the hotspot map/heatmap** — these are the two features that most directly answer the brief's own wording ("map demand hotspots," "rank high-priority development works")
