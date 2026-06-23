import { describe, it, expect } from "vitest";
import { getDay, parseISO } from "date-fns";
import { generateSchedule } from "@/lib/dal/scheduler/distribute";

const baseInput = {
  planId: "test-plan",
  topics: [
    { id: "t1", title: "Topic 1", estimatedHours: 1 },
    { id: "t2", title: "Topic 2", estimatedHours: 1.5 },
    { id: "t3", title: "Topic 3", estimatedHours: 2 },
  ],
  startDate: "2026-01-05", // Monday
  deadline: "2026-01-11",  // Sunday (7 days)
  hoursPerWeek: 10,
  studyDays: [1, 2, 3, 4, 5], // Mon-Fri
};

describe("generateSchedule", () => {
  it("returns possible:false when total hours exceed capacity", async () => {
    const input = {
      ...baseInput,
      topics: [
        { id: "t1", title: "Too many", estimatedHours: 50 },
      ],
    };
    const result = await generateSchedule(input);
    expect(result.feasibility.possible).toBe(false);
  });

  it("distributes all topics across study days", async () => {
    const result = await generateSchedule(baseInput);
    const studySlots = result.slots.filter(s => s.type === "study");
    expect(studySlots.length).toBe(baseInput.topics.length);
  });

  it("uses ≤70% of available hours (30% buffer)", async () => {
    const result = await generateSchedule(baseInput);
    const totalMinutes = result.slots.reduce((sum, s) => sum + s.estimatedMinutes, 0);
    const totalAvailableMinutes = (baseInput.hoursPerWeek * Math.ceil(7 / 7) * 60);
    expect(totalMinutes).toBeLessThanOrEqual(totalAvailableMinutes * 0.7);
  });

  it("labels last study day of each week as catch-up", async () => {
    const result = await generateSchedule(baseInput);
    expect(result.catchUpDates.length).toBeGreaterThanOrEqual(1);
  });

  it("does not exceed MAX_MINUTES_PER_DAY per slot", async () => {
    const result = await generateSchedule(baseInput);
    for (const slot of result.slots) {
      expect(slot.estimatedMinutes).toBeLessThanOrEqual(240);
    }
  });

  it("catch-up dates are Fridays in a Mon-Fri study schedule", async () => {
    // Mon-Fri week, last study day = Friday (studyDays array sorted: [1,2,3,4,5])
    // Catch-up should be the last study day = Friday = getDay()=5
    const result = await generateSchedule({
      ...baseInput,
      startDate: "2026-01-05", // Monday
      deadline: "2026-01-11",  // Sunday
      studyDays: [1, 2, 3, 4, 5],
    });
    for (const dateStr of result.catchUpDates) {
      const day = getDay(parseISO(dateStr));
      expect(day).toBe(5); // Friday = last study day
    }
  });
});
