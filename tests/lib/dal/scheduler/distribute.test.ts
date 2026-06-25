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

  it("handles more topics than days — even spread", async () => {
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
    const dateCounts = Object.values(
      Object.groupBy(result.slots, (s) => s.date)
    ).map((a) => a!.length);
    // 14 topics over 2 days → 7 per day (perfectly even)
    expect(Math.max(...dateCounts) - Math.min(...dateCounts)).toBeLessThanOrEqual(1);
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
      // 6 topics, 5 study days (Mon-Fri): d1=2, d2=1, d3=1, d4=1, d5=1
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
      expect(dates.length).toBe(5); // All 5 study days used, none left empty
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

  describe("distribution fairness", () => {
    it("N > M: extra topic goes to earliest day (N = M + 1)", async () => {
      const topics = Array.from({ length: 6 }, (_, i) => ({
        id: `t${i}`,
        title: `Topic ${i}`,
      }));
      const result = await generateSchedule({
        ...baseInput,
        topics,
        weekdays: [1, 2, 3, 4, 5],
      });

      expect(result.slots.length).toBe(6);
      const countByDate = Object.fromEntries(
        Object.entries(Object.groupBy(result.slots, (s) => s.date))
          .map(([d, slots]) => [d, slots!.length])
      );

      // d1=2, d2=1, d3=1, d4=1, d5=1
      expect(countByDate["2026-01-05"]).toBe(2);
      expect(countByDate["2026-01-06"]).toBe(1);
      expect(countByDate["2026-01-07"]).toBe(1);
      expect(countByDate["2026-01-08"]).toBe(1);
      expect(countByDate["2026-01-09"]).toBe(1);
    });

    it("round-robin continues filling earliest day first when all days have 1", async () => {
      const topics = Array.from({ length: 7 }, (_, i) => ({
        id: `t${i}`,
        title: `Topic ${i}`,
      }));
      const result = await generateSchedule({
        ...baseInput,
        topics,
        weekdays: [1, 2, 3, 4, 5],
      });

      expect(result.slots.length).toBe(7);
      const countByDate = Object.fromEntries(
        Object.entries(Object.groupBy(result.slots, (s) => s.date))
          .map(([d, slots]) => [d, slots!.length])
      );

      // d1=2, d2=2, d3=1, d4=1, d5=1
      expect(countByDate["2026-01-05"]).toBe(2);
      expect(countByDate["2026-01-06"]).toBe(2);
      expect(countByDate["2026-01-07"]).toBe(1);
      expect(countByDate["2026-01-08"]).toBe(1);
      expect(countByDate["2026-01-09"]).toBe(1);
    });

    it("exact multiple — topics divide evenly across days", async () => {
      const topics = Array.from({ length: 10 }, (_, i) => ({
        id: `t${i}`,
        title: `Topic ${i}`,
      }));
      const result = await generateSchedule({
        ...baseInput,
        topics,
        weekdays: [1, 2, 3, 4, 5],
      });

      expect(result.slots.length).toBe(10);
      const countByDate = Object.fromEntries(
        Object.entries(Object.groupBy(result.slots, (s) => s.date))
          .map(([d, slots]) => [d, slots!.length])
      );

      // 10 topics over 5 days = 2 per day
      for (const date of ["2026-01-05", "2026-01-06", "2026-01-07", "2026-01-08", "2026-01-09"]) {
        expect(countByDate[date]).toBe(2);
      }
    });

    it("equal number of topics and days — exactly 1 per day", async () => {
      const topics = Array.from({ length: 5 }, (_, i) => ({
        id: `t${i}`,
        title: `Topic ${i}`,
      }));
      const result = await generateSchedule({
        ...baseInput,
        topics,
        weekdays: [1, 2, 3, 4, 5],
      });

      expect(result.slots.length).toBe(5);
      const countByDate = Object.fromEntries(
        Object.entries(Object.groupBy(result.slots, (s) => s.date))
          .map(([d, slots]) => [d, slots!.length])
      );

      for (const date of ["2026-01-05", "2026-01-06", "2026-01-07", "2026-01-08", "2026-01-09"]) {
        expect(countByDate[date]).toBe(1);
      }
    });

    it("single available day — all topics on same date", async () => {
      const topics = Array.from({ length: 5 }, (_, i) => ({
        id: `t${i}`,
        title: `Topic ${i}`,
      }));
      const result = await generateSchedule({
        ...baseInput,
        topics,
        weekdays: [1],
      });

      expect(result.slots.length).toBe(5);
      expect(result.slots.every((s) => s.date === "2026-01-05")).toBe(true);
    });

    it("existingCountsByDate — respects pre-existing load, fills emptiest days first", async () => {
      const topics = Array.from({ length: 3 }, (_, i) => ({
        id: `t${i}`,
        title: `Topic ${i}`,
      }));
      const result = await generateSchedule({
        ...baseInput,
        topics,
        startDate: "2026-01-05",
        deadline: "2026-01-06",
        weekdays: [1, 2],
        existingCountsByDate: {
          "2026-01-05": 2, // Mon already has 2 slots
        },
      });

      // 3 new topics distributed: 1 goes to Mon (tiebreak), 2 to Tue (emptiest)
      expect(result.slots.length).toBe(3);
      const countByDate = Object.fromEntries(
        Object.entries(Object.groupBy(result.slots, (s) => s.date))
          .map(([d, slots]) => [d, slots!.length])
      );
      expect(countByDate["2026-01-05"]).toBe(1);
      expect(countByDate["2026-01-06"]).toBe(2);
    });

    it("existingCountsByDate — balances large pre-existing imbalance", async () => {
      // 4 new topics, 3 days with pre-load: d1=3, d2=2, d3=0
      // expected new distribution: d1=0, d2=1, d3=3
      // final totals: d1=3, d2=3, d3=3
      const topics = Array.from({ length: 4 }, (_, i) => ({
        id: `t${i}`,
        title: `Topic ${i}`,
      }));
      const result = await generateSchedule({
        ...baseInput,
        topics,
        startDate: "2026-01-05",
        deadline: "2026-01-07",
        weekdays: [1, 2, 3],
        existingCountsByDate: {
          "2026-01-05": 3,
          "2026-01-06": 2,
          "2026-01-07": 0,
        },
      });

      expect(result.slots.length).toBe(4);
      const countByDate = Object.fromEntries(
        Object.entries(Object.groupBy(result.slots, (s) => s.date))
          .map(([d, slots]) => [d, slots!.length])
      );
      expect(countByDate["2026-01-05"]).toBeUndefined();
      expect(countByDate["2026-01-06"]).toBe(1);
      expect(countByDate["2026-01-07"]).toBe(3);
    });
  });
});
