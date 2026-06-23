# Remaining Bugs

## 1. Calendar shows deleted subjects/topics

**Steps:**
1. Create a plan with subjects → schedule auto-generates → calendar shows topics
2. Delete a subject or its topics
3. Return to plan detail page

**Expected:** Calendar should no longer show deleted topics
**Actual:** Calendar still shows slots for deleted topics

**Root cause:** The cascade cleanup in `deleteTopics`/`archiveSubject` was added to `subjects.ts` DAL, but the fix didn't take effect. Possible causes:
- `scheduleSlots.topicId` is nullable — the Drizzle comparison `eq(scheduleSlots.topicId, topicId)` might not work as expected with nullable columns
- Foreign keys not enabled in SQLite (`PRAGMA foreign_keys = OFF` by default)
- The `deleteTopics` in the actions layer (`src/lib/actions/subjects.ts`) delegates to the DAL — need to verify the DAL function is actually being called

**Files modified for this fix:**
- `src/lib/dal/commands/subjects.ts` — added `scheduleSlots` and `planTopics` cleanup + `totalTopics` recount

**Suggested next step:**
- Add `PRAGMA foreign_keys = ON` to `src/lib/db/client.ts`
- Test the cascade cleanup by deleting topics and checking the schedule

## 2. dnd-kit hydration mismatch

**Error:** `aria-describedby` attribute differs between server and client

**Status:** Partially fixed — deferred `{...attributes}` spread until after mount in `TopicCard`

## 3. (FIXED) Plan creation redirect
## 4. (FIXED) Topic list not reactive
## 5. (FIXED) Plan edit checkboxes
## 6. (FIXED) Missing DB columns
