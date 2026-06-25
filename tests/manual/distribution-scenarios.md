# Manual Test: Topic Distribution Scenarios

Use this document to manually validate that topics are distributed correctly
across study days in the calendar.

## Prerequisites

- One user account logged in
- No existing plans (start fresh)
- Subject to create topics in: "Test Subject"

## Reference dates

All scenarios use a **Monday 2026-07-06 to Sunday 2026-07-12** window.
Weekday numbers (ISO): Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6, Sun=7.

---

## Scenario 1 — Fewer topics than available days

**Rule:** Topics should spread one-per-day across the earliest available days.

1. Create subject "Test Subject" with 3 topics: "Alpha", "Beta", "Gamma"
2. Create a plan:
   - Title: "Test 1 — fewer topics"
   - Start: 2026-07-06 (Mon)
   - Deadline: 2026-07-12 (Sun)
   - Available days: Mon, Tue, Wed, Thu, Fri (weekdays 1–5)
3. Select "Test Subject"

**Expected calendar:**

| Mon 07/06 | Tue 07/07 | Wed 07/08 | Thu 07/09 | Fri 07/10 |
|-----------|-----------|-----------|-----------|-----------|
| Alpha     | Beta      | Gamma     |           |           |
| (1)       | (1)       | (1)       | (0)       | (0)       |

---

## Scenario 2 — Equal number of topics and days

**Rule:** Exactly one topic per day, all available days used.

1. Create subject "Test Subject" with 5 topics: "A", "B", "C", "D", "E"
2. Create a plan:
   - Title: "Test 2 — equal count"
   - Start: 2026-07-06 (Mon)
   - Deadline: 2026-07-12 (Sun)
   - Available days: Mon, Tue, Wed, Thu, Fri (weekdays 1–5)
3. Select "Test Subject"

**Expected calendar:**

| Mon 07/06 | Tue 07/07 | Wed 07/08 | Thu 07/09 | Fri 07/10 |
|-----------|-----------|-----------|-----------|-----------|
| A         | B         | C         | D         | E         |
| (1)       | (1)       | (1)       | (1)       | (1)       |

---

## Scenario 3 — More topics than days: N = M + 1

**Rule:** Every available day gets at least 1 topic. The extra topic goes to the
earliest day.

1. Create subject "Test Subject" with 6 topics: "T1", "T2", "T3", "T4", "T5", "T6"
2. Create a plan:
   - Title: "Test 3 — one extra topic"
   - Start: 2026-07-06 (Mon)
   - Deadline: 2026-07-12 (Sun)
   - Available days: Mon, Tue, Wed, Thu, Fri (weekdays 1–5)
3. Select "Test Subject"

**Expected calendar:**

| Mon 07/06 | Tue 07/07 | Wed 07/08 | Thu 07/09 | Fri 07/10 |
|-----------|-----------|-----------|-----------|-----------|
| T1        | T2        | T3        | T4        | T5        |
| T6        |           |           |           |           |
| **(2)**   | (1)       | (1)       | (1)       | (1)       |

**Fail if:** Day 1 has 3+ topics while another day is empty, or any day has 0.

---

## Scenario 4 — Round-robin carries over to next earliest day

**Rule:** After each day gets 1 topic, extra topics go one-per-day starting from
the earliest, not all stacked on day 1.

1. Create subject "Test Subject" with 7 topics: "A", "B", "C", "D", "E", "F", "G"
2. Create a plan:
   - Title: "Test 4 — round-robin carry"
   - Start: 2026-07-06 (Mon)
   - Deadline: 2026-07-12 (Sun)
   - Available days: Mon, Tue, Wed, Thu, Fri (weekdays 1–5)
3. Select "Test Subject"

**Expected calendar:**

| Mon 07/06 | Tue 07/07 | Wed 07/08 | Thu 07/09 | Fri 07/10 |
|-----------|-----------|-----------|-----------|-----------|
| A         | B         | C         | D         | E         |
| F         | G         |           |           |           |
| **(2)**   | **(2)**   | (1)       | (1)       | (1)       |

**Fail if:** Mon has 3+, or Mon+Wed have 2+ while Tue has 1 (not round-robin).

---

## Scenario 5 — Exact multiple (topics divide evenly)

**Rule:** When N ÷ M is exact, every day gets the same number.

1. Create subject "Test Subject" with 10 topics: "0" through "9"
2. Create a plan:
   - Title: "Test 5 — exact multiple"
   - Start: 2026-07-06 (Mon)
   - Deadline: 2026-07-12 (Sun)
   - Available days: Mon, Tue, Wed, Thu, Fri (weekdays 1–5)
3. Select "Test Subject"

**Expected calendar:**

| Mon 07/06 | Tue 07/07 | Wed 07/08 | Thu 07/09 | Fri 07/10 |
|-----------|-----------|-----------|-----------|-----------|
| 0         | 2         | 4         | 6         | 8         |
| 1         | 3         | 5         | 7         | 9         |
| **(2)**   | **(2)**   | **(2)**   | **(2)**   | **(2)**   |

---

## Scenario 6 — Single available day

**Rule:** All topics land on the single available day.

1. Create subject "Test Subject" with 5 topics: "Only", "Monday", "Is", "The", "Day"
2. Create a plan:
   - Title: "Test 6 — single day"
   - Start: 2026-07-06 (Mon)
   - Deadline: 2026-07-12 (Sun)
   - Available days: Mon only (weekday 1)
3. Select "Test Subject"

**Expected calendar:**

| Mon 07/06 | Tue..Sun |
|-----------|----------|
| Only      | (empty)  |
| Monday    |          |
| Is        |          |
| The       |          |
| Day       |          |
| **(5)**   |          |

**Fail if:** Any topic appears on a day other than Monday.

---

## Scenario 7 — Sparse weekdays, many topics

**Rule:** With sparse weekdays (Mon, Wed, Fri), topics fill one-per-day then
round-robin across those 3 days.

1. Create subject "Test Subject" with 7 topics: "Mon1", "Wed1", "Fri1",
   "Mon2", "Wed2", "Fri2", "Mon3"
2. Create a plan:
   - Title: "Test 7 — sparse weekdays"
   - Start: 2026-07-06 (Mon)
   - Deadline: 2026-07-12 (Sun)
   - Available days: Mon, Wed, Fri (weekdays 1, 3, 5)
3. Select "Test Subject"

**Expected calendar:**

| Mon 07/06 | Tue | Wed 07/08 | Thu | Fri 07/10 |
|-----------|-----|-----------|-----|-----------|
| Mon1      |     | Wed1      |     | Fri1      |
| Mon2      |     | Wed2      |     | Fri2      |
| Mon3      |     |           |     |           |
| **(3)**   | (0) | **(2)**   | (0) | **(2)**   |

**Fail if:** Topics appear on Tuesday or Thursday.

---

## Scenario 8 — Pre-existing load (adding topics mid-plan)

**Rule:** When new topics are synced into an existing schedule, they fill the
emptiest remaining days first.

**Setup — create base plan first:**

1. Create subject "Test Subject" with 4 topics: "Existing A", "Existing B",
   "Existing C", "Existing D"
2. Create a plan:
   - Title: "Test 8 — add topics"
   - Start: 2026-07-06 (Mon)
   - Deadline: 2026-07-12 (Sun)
   - Available days: Mon, Tue, Wed, Thu, Fri (weekdays 1–5)
3. Select "Test Subject"
4. Verify the schedule was generated (1 topic per day, Mon–Thu, Fri empty)

**Action — mark topics as studied (simulate pre-existing load):**

5. Mark "Existing A" (on Mon) as studied
6. Mark "Existing B" (on Tue) as studied

**Action — re-sync subject to add 2 new topics:**

7. Add 2 new topics to "Test Subject": "New E", "New F"
8. Re-sync "Test Subject" into the plan

**Expected calendar after sync:**

| Mon 07/06 | Tue 07/07 | Wed 07/08 | Thu 07/09 | Fri 07/10 |
|-----------|-----------|-----------|-----------|-----------|
| Existing A| Existing B| Existing C| Existing D|           |
| (studied) | (studied) | (1)       | (1)       |           |
|           |           |           |           | New E     |
|           |           |           |           | New F     |
| (1 total) | (1 total) | (1 total) | (1 total) | **(2)**   |

New topics fill the emptiest remaining day (Fri, which had 0) before any day
with existing load.

**Alternative expected if today is after Fri:** Both new topics go to the
earliest remaining future day that is emptiest.

---

## Scenario 9 — Regenerate after falling behind (adaptive reschedule)

**Rule:** Past uncompleted topics are redistributed evenly across remaining days
when the schedule is regenerated.

**Setup:**

1. Create subject "Test Subject" with 8 topics: "S1" through "S8"
2. Create a plan:
   - Title: "Test 9 — adaptive"
   - Start: 2026-07-06 (Mon)
   - Deadline: 2026-07-12 (Sun)
   - Available days: Mon, Tue, Wed, Thu, Fri (weekdays 1–5)
3. Select "Test Subject"

**Verify initial distribution (8 topics, 5 days):**

| Mon 07/06 | Tue 07/07 | Wed 07/08 | Thu 07/09 | Fri 07/10 |
|-----------|-----------|-----------|-----------|-----------|
| S1        | S3        | S5        | S7        | S8        |
| S2        | S4        | S6        |           |           |
| **(2)**   | **(2)**   | **(2)**   | (1)       | (1)       |

**Simulate falling behind:**

4. Mark S1 (Mon) as studied ✓
5. Leave S2–S8 unstudied — let Mon, Tue, Wed pass in the real calendar
   (or change system clock / use startDateOverride)

**Action — regenerate schedule:**

6. Click "Regenerate from today"

**Expected result:**
- Past completed slot (S1) is preserved on Mon
- Past uncompleted topics (S2–S8) are pulled forward and redistributed evenly
  across the remaining days (today → deadline)
- No day gets more than ceil(7 / remainingDays) topics
- All remaining days have at least 1 topic

---

---

## Scenario 10 — Pre-existing load with large imbalance

**Rule:** When some days have heavy pre-existing load and others have none, new
topics fill the emptiest days first (not stacked on earliest day). The final
result should balance toward the same total per day.

**Setup:**

1. Create subject "Test Subject" with 7 topics: "BaseA", "BaseB", "BaseC",
   "BaseD", "BaseE", "NewF", "NewG"
2. Create a plan:
   - Title: "Test 10 — imbalanced pre-load"
   - Start: 2026-07-06 (Mon)
   - Deadline: 2026-07-08 (Wed)
   - Available days: Mon, Tue, Wed (weekdays 1, 2, 3)
3. Select "Test Subject"

**Verify initial distribution (7 topics, 3 days):**

| Mon 07/06 | Tue 07/07 | Wed 07/08 |
|-----------|-----------|-----------|
| BaseA     | BaseD     | BaseG     |
| BaseB     | BaseE     |           |
| BaseC     |           |           |
| **(3)**   | **(2)**   | **(2)**   |

Wait — the algorithm gives 7 topics over 3 days as: 3, 2, 2. To get the
imbalanced scenario (3, 2, 0) we need to simulate progress / manual moves.

**Setup to create the imbalance:**

4. Mark BaseG (Wed) as studied ✓ (completes it — slot stays but won't
   be redistributed)
5. Move BaseF from Wed to Tue (drag-and-drop) — simulates a manual override
   — Now Tue has 3 topics (BaseD, BaseE, BaseF), Wed has 0

**Expected calendar before adding new topics:**

| Mon 07/06 | Tue 07/07 | Wed 07/08 |
|-----------|-----------|-----------|
| BaseA     | BaseD     |           |
| BaseB     | BaseE     | (empty)   |
| BaseC     | BaseF     |           |
| (3)       | (3)       | (0)       |

Wait — the intended pre-load is d1=3, d2=2, d3=0. Let's adjust.

**Corrected setup to match d1=3, d2=2, d3=0:**

4. Mark BaseD (Tue) and BaseE (Tue) as studied ✓ — they stay on Tue
   but are counted as completed. After marking, Tue only has uncompleted BaseF.
   For simplicity, unmark BaseD and BaseE, then:
5. Move BaseF from Wed to Tue (drag-and-drop)
6. Mark BaseC (Mon) as studied ✓ (keeps slot)

**Final pre-load state:**

| Mon 07/06        | Tue 07/07 | Wed 07/08 |
|------------------|-----------|-----------|
| BaseA            | BaseD     |           |
| BaseB            | BaseE     | (empty)   |
| BaseC (studied)  | BaseF     |           |
| **(3 total)**    | **(2 total)** | **(0)** |

**Pre-existing counts:** Mon=3, Tue=2, Wed=0

**Action — add 4 new topics:**

7. Create 4 new topics in "Test Subject": "New1", "New2", "New3", "New4"
8. Re-sync "Test Subject" into the plan

**Expected new distribution (4 new topics into d1=3, d2=2, d3=0):**

Algorithm trace (new topics fill emptiest first, then tiebreak by date):

| Step | d1(Mon) | d2(Tue) | d3(Wed) | Pick | New total |
|------|---------|---------|---------|------|-----------|
| init | 3       | 2       | 0       | —    | 3,2,0     |
| New1 | 3       | 2       | **1**   | Wed  | 3,2,1     |
| New2 | 3       | 2       | **2**   | Wed  | 3,2,2     |
| New3 | 3       | **3**   | 2       | Tue  | 3,3,2     |
| New4 | 3       | 3       | **3**   | Wed  | 3,3,3     |

**Expected final per day:**

| Mon 07/06 | Tue 07/07 | Wed 07/08 |
|-----------|-----------|-----------|
| BaseA     | BaseD     | New1      |
| BaseB     | BaseE     | New2      |
| BaseC     | BaseF     | New4      |
| (3)       | Base?     | (3)       |
|           | New3      |           |
| **(3)**   | **(3)**   | **(3)**   |

**Key assertion:** Wed goes from 0 to 3, Tue goes from 2 to 3, Mon stays at 3.
New topics never go to Mon (already fullest) until Wed and Tue are balanced.

**Fail if:** New topics stack on Mon (already the fullest day) while Wed remains
empty.

---

## Pass / Fail record

| Scenario | Result (✓ / ✗) | Notes |
|----------|---------------|-------|
| 1 — fewer topics | | |
| 2 — equal count | | |
| 3 — one extra | | |
| 4 — round-robin | | |
| 5 — exact multiple | | |
| 6 — single day | | |
| 7 — sparse weekdays | | |
| 8 — add topics | | |
| 9 — regenerate | | |
| 10 — imbalanced pre-load | | |
