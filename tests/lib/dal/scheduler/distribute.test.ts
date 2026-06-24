import { describe, it, expect } from "vitest";
import { generateSchedule } from "@/lib/dal/scheduler/distribute";
import { parseISO } from "date-fns";

const baseInput = {
  planId: "test-plan",
  topics: [
    { id: "t1", title: "Topic 1" },
    { id: "t2", title: "Topic 2" },
    { id: "t3", title: "Topic 3" },
  ],
  startDate: "2026-01-05", // Monday
  deadline: "2026-01-11",  // Sunday (7 days)
};

function isoDay(dateStr: string): number {
  const d = parseISO(dateStr);
  return ((d.getDay() + 6) % 7) + 1;
}

describe("generateSchedule", () => {
  it("distributes all topics across days", async () => {
    const result = await generateSchedule(baseInput);
    expect(result.slots.length).toBe(baseInput.topics.length);
  });

  it("spreads topics evenly: 3 topics over 7 days = 1 per day for 3 days", async () => {
    const result = await generateSchedule(baseInput);
    const dates = [...new Set(result.slots.map((s) => s.date))];
    expect(dates.length).toBe(3);
  });

  it("handles more days than topics", async () => {
    const result = await generateSchedule({
      ...baseInput,
      topics: [{ id: "t1", title: "Only one" }],
    });
    expect(result.slots.length).toBe(1);
  });

  it("handles more topics than days", async () => {
    const topics = Array.from({ length: 14 }, (_, i) => ({
      id: `t${i}`,
      title: `Topic ${i}`,
    }));
    const result = await generateSchedule({
      ...baseInput,
      topics,
      startDate: "2026-01-05",
      deadline: "2026-01-06", // 2 days
    });
    expect(result.slots.length).toBe(14);
    const uniqueDates = [...new Set(result.slots.map((s) => s.date))];
    expect(uniqueDates.length).toBe(2);
    for (const date of uniqueDates) {
      const count = result.slots.filter((s) => s.date === date).length;
      expect(count).toBeGreaterThanOrEqual(6);
    }
  });

  it("returns empty slots for no topics", async () => {
    const result = await generateSchedule({
      ...baseInput,
      topics: [],
    });
    expect(result.slots).toEqual([]);
  });

  it("all slots have type study and a topicId", async () => {
    const result = await generateSchedule(baseInput);
    for (const slot of result.slots) {
      expect(slot.type).toBe("study");
      expect(slot.topicId).toBeTruthy();
    }
  });

  describe("weekday filtering", () => {
    it("only schedules on weekdays when Mon-Fri selected", async () => {
      const result = await generateSchedule({
        ...baseInput,
        weekdays: [1, 2, 3, 4, 5],
      });
      for (const slot of result.slots) {
        const day = isoDay(slot.date);
        expect(day).toBeGreaterThanOrEqual(1);
        expect(day).toBeLessThanOrEqual(5);
      }
    });

    it("only schedules on weekends when Sat-Sun selected", async () => {
      const result = await generateSchedule({
        ...baseInput,
        weekdays: [6, 7],
      });
      for (const slot of result.slots) {
        const day = isoDay(slot.date);
        expect([6, 7]).toContain(day);
      }
    });

    it("handles single weekday selection", async () => {
      const result = await generateSchedule({
        ...baseInput,
        // Jan 5 2026 is Monday → only 1 day in range
        startDate: "2026-01-05",
        deadline: "2026-01-11",
        weekdays: [1], // Monday only
      });
      expect(result.slots.length).toBe(3); // all 3 topics on Monday
      const dates = result.slots.map((s) => s.date);
      expect(dates.every((d) => d === "2026-01-05")).toBe(true);
    });

    it("returns empty if no days match selected weekdays", async () => {
      const result = await generateSchedule({
        ...baseInput,
        startDate: "2026-01-05", // Monday
        deadline: "2026-01-05", // Monday only
        weekdays: [7], // Sunday only
      });
      expect(result.slots).toEqual([]);
    });

    it("distributes across fewer available days with weekday filter", async () => {
      // 6 topics, Mon-Fri only over a 7-day window = 5 study days
      // ceil(6/5) = 2 per day for first 3 days
      const topics = Array.from({ length: 6 }, (_, i) => ({
        id: `t${i}`,
        title: `Topic ${i}`,
      }));
      const result = await generateSchedule({
        ...baseInput,
        topics,
        startDate: "2026-01-05", // Monday
        deadline: "2026-01-11", // Sunday
        weekdays: [1, 2, 3, 4, 5], // Mon-Fri
      });
      expect(result.slots.length).toBe(6);
      const dates = [...new Set(result.slots.map((s) => s.date))];
      expect(dates.length).toBe(3); // 6 topics, 2 per day = 3 days
      // All dates should be weekdays
      for (const date of dates) {
        const day = isoDay(date);
        expect(day).toBeGreaterThanOrEqual(1);
        expect(day).toBeLessThanOrEqual(5);
      }
    });

    it("defaults to all days when no weekdays provided", async () => {
      const result = await generateSchedule({
        ...baseInput,
        weekdays: undefined,
      });
      expect(result.slots.length).toBe(3);
      const dates = [...new Set(result.slots.map((s) => s.date))];
      expect(dates.length).toBe(3);
    });
  });
});
