import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// ── Shared mutable state (hoisted so vi.mock factories can use it) ─

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const testState: any = vi.hoisted(() => ({
  mockPlan: null,
  mockSlots: [],
  mockTopics: [],
  generatedSlots: [],
  insertedSlots: [],
  txDeleteCallCount: 0,
  updatedPlanData: null,
  reset() {
    this.mockPlan = null;
    this.mockSlots = [];
    this.mockTopics = [];
    this.generatedSlots = [];
    this.insertedSlots = [];
    this.txDeleteCallCount = 0;
    this.updatedPlanData = null;
  },
}));

// ── Mock date-fns format to return stable "today" ────────────────

vi.mock("date-fns", async () => {
  const actual = await vi.importActual<typeof import("date-fns")>("date-fns");
  return {
    ...actual,
    format: (date: Date, fmt: string) => {
      if (fmt === "yyyy-MM-dd") return "2026-06-25";
      return actual.format(date, fmt);
    },
  };
});

// ── Mock generateSchedule ────────────────────────────────────────

const mockGenerateSchedule = vi.hoisted(
  () => vi.fn(() => Promise.resolve({ slots: testState.generatedSlots }))
);

vi.mock("@/lib/dal/scheduler/distribute", () => ({
  generateSchedule: mockGenerateSchedule,
}));

// ── Mock getTopicsForPlan ────────────────────────────────────────

const mockGetTopicsForPlan = vi.hoisted(
  () => vi.fn(() => Promise.resolve(testState.mockTopics))
);

vi.mock("@/lib/dal/queries/plans", () => ({
  getTopicsForPlan: mockGetTopicsForPlan,
}));

// ── Mock db client ───────────────────────────────────────────────

vi.mock("@/lib/db/client", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          get: vi.fn(() => testState.mockPlan),
          all: vi.fn(() => testState.mockSlots),
        })),
      })),
    })),
    transaction: vi.fn(async (cb: (tx: unknown) => Promise<void>) => {
      const tx = {
        delete: vi.fn(() => ({
          where: vi.fn(() => {
            testState.txDeleteCallCount++;
          }),
        })),
        insert: vi.fn(() => ({
          values: vi.fn((vals: unknown) => {
            testState.insertedSlots.push(vals);
          }),
        })),
        update: vi.fn(() => ({
          set: vi.fn((data: Record<string, unknown>) => {
            testState.updatedPlanData = data;
            return { where: vi.fn() };
          }),
        })),
      };
      await cb(tx);
    }),
  },
}));

// ── Imports (after vi.mock, they get the mocked versions) ────────

import type { AdaptInput } from "@/lib/dal/scheduler/adapt";
import { adaptSchedule } from "@/lib/dal/scheduler/adapt";

// ── Helpers ──────────────────────────────────────────────────────

const BASE_INPUT: AdaptInput = {
  planId: "test-plan-id",
  userId: "test-user-id",
};

function makePlan(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "test-plan-id",
    userId: "test-user-id",
    title: "Test Plan",
    startDate: "2026-06-16",
    deadline: "2026-07-05",
    weekdays: "1,2,3,4,5",
    totalTopics: 5,
    completedTopics: 0,
    status: "active",
    lastScheduleGeneratedAt: null,
    lastScheduleStartDate: null,
    lastScheduleDeadline: null,
    ...overrides,
  };
}

function makeSlot(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: crypto.randomUUID(),
    planId: "test-plan-id",
    topicId: crypto.randomUUID(),
    date: "2026-06-18",
    type: "study" as const,
    isCompleted: false,
    isManual: false,
    completedAt: null,
    createdAt: "2026-06-15",
    ...overrides,
  };
}

function makeTopic(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: crypto.randomUUID(),
    title: "Test Topic",
    subjectId: "subject-1",
    status: "pending" as const,
    sortOrder: 0,
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────

describe("adaptSchedule", () => {
  beforeEach(() => {
    testState.reset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-25"));
    mockGenerateSchedule.mockClear();
    mockGetTopicsForPlan.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Bug 1: No remaining study days ──────────────────────────────

  it("returns warning when no remaining study days and keeps past topics", async () => {
    const pastTopics = [
      makeTopic({ id: "t1" }),
      makeTopic({ id: "t2" }),
    ];
    testState.mockPlan = makePlan();
    testState.mockSlots = [
      makeSlot({ id: "s1", topicId: "t1", date: "2026-06-18", isCompleted: false }),
      makeSlot({ id: "s2", topicId: "t2", date: "2026-06-19", isCompleted: false }),
    ];
    testState.mockTopics = pastTopics;
    testState.generatedSlots = []; // simulate no study days

    const result = await adaptSchedule(BASE_INPUT);

    expect(result.warning).toBe(
      "No remaining study days available for rescheduling."
    );
    // Transaction never ran → no deletes, no inserts
    expect(testState.txDeleteCallCount).toBe(0);
    expect(testState.insertedSlots).toEqual([]);
    expect(testState.updatedPlanData).toBeNull();
  });

  // ── Bug 2: Past deadline ────────────────────────────────────────

  it("returns warning when today is past deadline and does nothing", async () => {
    testState.mockPlan = makePlan({ deadline: "2026-06-20" });

    const result = await adaptSchedule(BASE_INPUT);

    expect(result.warning).toBe(
      "Deadline has ended. Cannot modify schedule."
    );
    expect(testState.txDeleteCallCount).toBe(0);
    expect(testState.insertedSlots).toEqual([]);
    expect(testState.updatedPlanData).toBeNull();
  });

  it("does not call generateSchedule when deadline has passed", async () => {
    testState.mockPlan = makePlan({ deadline: "2026-06-22" });

    await adaptSchedule(BASE_INPUT);

    expect(mockGenerateSchedule).not.toHaveBeenCalled();
  });

  // ── Bug 3: Default effectiveStart is today (not plan.startDate) ─

  it("uses today as effectiveStart when no startDateOverride is given", async () => {
    testState.mockPlan = makePlan({ startDate: "2026-06-01" });
    testState.mockSlots = [
      makeSlot({ id: "s1", topicId: "t1", date: "2026-06-02", isCompleted: false }),
    ];
    testState.mockTopics = [makeTopic({ id: "t1" })];
    testState.generatedSlots = [
      { planId: "test-plan-id", topicId: "t1", date: "2026-06-25", type: "study" },
    ];

    await adaptSchedule(BASE_INPUT);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const args = (mockGenerateSchedule as any).mock.calls[0][0];
    expect(args.startDate).toBe("2026-06-25"); // today, not "2026-06-01"
  });

  it("honours startDateOverride when explicitly provided", async () => {
    testState.mockPlan = makePlan({ startDate: "2026-06-01" });
    testState.mockSlots = [
      makeSlot({ id: "s1", topicId: "t1", date: "2026-06-02", isCompleted: false }),
    ];
    testState.mockTopics = [makeTopic({ id: "t1" })];
    testState.generatedSlots = [
      { planId: "test-plan-id", topicId: "t1", date: "2026-06-10", type: "study" },
    ];

    await adaptSchedule({ ...BASE_INPUT, startDateOverride: "2026-06-10" });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const args = (mockGenerateSchedule as any).mock.calls[0][0];
    expect(args.startDate).toBe("2026-06-10");
  });

  // ── Happy path ──────────────────────────────────────────────────

  it("deletes past pending slots and inserts new distributed slots", async () => {
    const topics = [makeTopic({ id: "t1" }), makeTopic({ id: "t2" })];
    testState.mockPlan = makePlan();
    testState.mockSlots = [
      makeSlot({ id: "s1", topicId: "t1", date: "2026-06-18", isCompleted: false }),
      makeSlot({ id: "s2", topicId: "t2", date: "2026-06-19", isCompleted: false }),
      // Completed slot — should be preserved
      makeSlot({ id: "s3", topicId: "t3", date: "2026-06-17", isCompleted: true }),
    ];
    testState.mockTopics = topics;
    testState.generatedSlots = [
      { planId: "test-plan-id", topicId: "t1", date: "2026-06-25", type: "study" },
      { planId: "test-plan-id", topicId: "t2", date: "2026-06-26", type: "study" },
    ];

    const result = await adaptSchedule(BASE_INPUT);

    expect(result.warning).toBeUndefined();
    // Transaction ran: 2 past slots deleted, 2 new inserted
    expect(testState.txDeleteCallCount).toBe(2);
    expect(testState.insertedSlots).toHaveLength(2);
    // Plan timestamp updated
    expect(testState.updatedPlanData).toMatchObject({
      lastScheduleStartDate: "2026-06-16",
      lastScheduleDeadline: "2026-07-05",
    });
  });

  // ── Manual topics are redistributed ─────────────────────────────

  it("redistributes past uncompleted manual topics alongside auto ones", async () => {
    testState.mockPlan = makePlan();
    testState.mockSlots = [
      makeSlot({ id: "s1", topicId: "t1", date: "2026-06-18", isCompleted: false, isManual: false }),
      makeSlot({ id: "s2", topicId: "t2", date: "2026-06-19", isCompleted: false, isManual: true }),
    ];
    testState.mockTopics = [
      makeTopic({ id: "t1" }),
      makeTopic({ id: "t2" }),
    ];
    testState.generatedSlots = [
      { planId: "test-plan-id", topicId: "t1", date: "2026-06-25", type: "study" },
      { planId: "test-plan-id", topicId: "t2", date: "2026-06-26", type: "study" },
    ];

    const result = await adaptSchedule(BASE_INPUT);

    expect(result.warning).toBeUndefined();
    expect(testState.txDeleteCallCount).toBe(2);
    expect(testState.insertedSlots).toHaveLength(2);
  });

  // ── Completed topics are preserved ──────────────────────────────

  it("does not redistribute completed topics", async () => {
    testState.mockPlan = makePlan();
    testState.mockSlots = [
      makeSlot({ id: "s1", topicId: "t1", date: "2026-06-18", isCompleted: true }),
    ];

    const result = await adaptSchedule(BASE_INPUT);

    expect(result.warning).toBeUndefined();
    expect(testState.txDeleteCallCount).toBe(0);
    expect(testState.insertedSlots).toEqual([]);
    expect(mockGenerateSchedule).not.toHaveBeenCalled();
  });

  // ── Today's topics stay ─────────────────────────────────────────

  it("does not redistribute topics scheduled for today", async () => {
    testState.mockPlan = makePlan();
    testState.mockSlots = [
      makeSlot({ id: "s1", topicId: "t1", date: "2026-06-18", isCompleted: false }),
      makeSlot({ id: "s2", topicId: "t2", date: "2026-06-25", isCompleted: false }),
    ];
    testState.mockTopics = [makeTopic({ id: "t1" })]; // only t1 is past
    testState.generatedSlots = [
      { planId: "test-plan-id", topicId: "t1", date: "2026-06-26", type: "study" },
    ];

    const result = await adaptSchedule(BASE_INPUT);

    expect(result.warning).toBeUndefined();
    expect(testState.insertedSlots).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callArgs = (mockGenerateSchedule as any).mock.calls[0][0];
    expect(callArgs.topics).toHaveLength(1);
    expect(callArgs.topics[0].id).toBe("t1");
  });

  // ── Revision slots are untouched ────────────────────────────────

  it("preserves revision slots (only study-type slots are deleted)", async () => {
    testState.mockPlan = makePlan();
    testState.mockSlots = [
      makeSlot({ id: "s1", topicId: "t1", date: "2026-06-18", isCompleted: false, type: "study" }),
      // Revision for same topic — NOT type "study"
      makeSlot({ id: "s2", topicId: "t1", date: "2026-07-02", isCompleted: false, type: "revision-7d" }),
    ];
    testState.mockTopics = [makeTopic({ id: "t1" })];
    testState.generatedSlots = [
      { planId: "test-plan-id", topicId: "t1", date: "2026-06-26", type: "study" },
    ];

    await adaptSchedule(BASE_INPUT);

    // Only 1 delete (the study slot), not the revision
    expect(testState.txDeleteCallCount).toBe(1);
  });

  // ── No pending topics ───────────────────────────────────────────

  it("returns early when no past uncompleted topics exist", async () => {
    testState.mockPlan = makePlan();
    testState.mockSlots = [
      makeSlot({ id: "s1", topicId: "t1", date: "2026-06-18", isCompleted: true }),
    ];

    const result = await adaptSchedule(BASE_INPUT);

    expect(result.warning).toBeUndefined();
    expect(mockGenerateSchedule).not.toHaveBeenCalled();
    expect(testState.txDeleteCallCount).toBe(0);
  });

  // ── Retained counts include future manual slots ─────────────────

  it("passes retainedCounts with future manual slots to generateSchedule", async () => {
    testState.mockPlan = makePlan();
    testState.mockSlots = [
      makeSlot({ id: "s1", topicId: "t1", date: "2026-06-18", isCompleted: false }),
      // Future manual slot — should be in retainedCounts
      makeSlot({ id: "s2", topicId: "t2", date: "2026-06-30", isCompleted: false, isManual: true }),
    ];
    testState.mockTopics = [makeTopic({ id: "t1" })];
    testState.generatedSlots = [
      { planId: "test-plan-id", topicId: "t1", date: "2026-06-25", type: "study" },
    ];

    await adaptSchedule(BASE_INPUT);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callArgs = (mockGenerateSchedule as any).mock.calls[0][0];
    expect(callArgs.existingCountsByDate).toBeDefined();
    expect(callArgs.existingCountsByDate["2026-06-30"]).toBe(1);
  });

  // ── Weekdays override is passed through ────────────────────────

  it("passes weekdaysOverride to generateSchedule when provided", async () => {
    testState.mockPlan = makePlan();
    testState.mockSlots = [
      makeSlot({ id: "s1", topicId: "t1", date: "2026-06-18", isCompleted: false }),
    ];
    testState.mockTopics = [makeTopic({ id: "t1" })];
    testState.generatedSlots = [
      { planId: "test-plan-id", topicId: "t1", date: "2026-06-25", type: "study" },
    ];
    const weekdaysOverride = [1, 3, 5]; // Mon, Wed, Fri

    await adaptSchedule({
      ...BASE_INPUT,
      weekdaysOverride: weekdaysOverride.join(","),
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const callArgs = (mockGenerateSchedule as any).mock.calls[0][0];
    expect(callArgs.weekdays).toEqual(weekdaysOverride);
  });
});
