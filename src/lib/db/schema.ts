import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";

// ── Users ──────────────────────────────────────────
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false),
  image: text("image"),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
});

// ── Subjects ───────────────────────────────────────
export const subjects = sqliteTable("subjects", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color"),
  difficulty: text("difficulty"), // "easy" | "medium" | "hard"
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
  archivedAt: text("archived_at"),
});

// ── Topics ─────────────────────────────────────────
export const topics = sqliteTable("topics", {
  id: text("id").primaryKey(),
  subjectId: text("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  status: text("status").default("pending"), // "pending" | "studied" | "revised"
  sortOrder: integer("sort_order").default(0),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
});

// ── Study Plans ────────────────────────────────────
export const studyPlans = sqliteTable("study_plans", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  deadline: text("deadline").notNull(), // ISO date string
  startDate: text("start_date").notNull(), // ISO date string
  weekdays: text("weekdays").notNull().default("1,2,3,4,5"), // ISO: 1=Mon, 7=Sun
  totalTopics: integer("total_topics").default(0),
  completedTopics: integer("completed_topics").default(0), // denormalized for fast reads
  status: text("status").default("active"), // "active" | "completed" | "paused" | "archived"
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  updatedAt: text("updated_at").notNull().default(sql`(current_timestamp)`),
  lastScheduleGeneratedAt: text("last_schedule_generated_at"),
  lastScheduleStartDate: text("last_schedule_start_date"),
  lastScheduleDeadline: text("last_schedule_deadline"),
  archivedAt: text("archived_at"),
});

// ── Plan Topics (join table) ───────────────────────
export const planTopics = sqliteTable(
  "plan_topics",
  {
    id: text("id").primaryKey(),
    planId: text("plan_id")
      .notNull()
      .references(() => studyPlans.id, { onDelete: "cascade" }),
    topicId: text("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0),
  },
  (table) => ({
    uniquePlanTopic: uniqueIndex("uq_plan_topic").on(table.planId, table.topicId),
  })
);

// ── Schedule Slots ─────────────────────────────────
export const scheduleSlots = sqliteTable(
  "schedule_slots",
  {
    id: text("id").primaryKey(),
    planId: text("plan_id")
      .notNull()
      .references(() => studyPlans.id, { onDelete: "cascade" }),
    topicId: text("topic_id")
      .references(() => topics.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // YYYY-MM-DD
    type: text("type").notNull().default("study"), // "study" | "revision-7d" | "revision-30d"
    isCompleted: integer("is_completed", { mode: "boolean" }).default(false),
    completedAt: text("completed_at"),
    isManual: integer("is_manual", { mode: "boolean" }).default(false),
    createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  },
  (table) => ({
    planDateIdx: index("idx_slots_plan_date").on(table.planId, table.date),
  })
);

// ── Study Sessions ─────────────────────────────────
export const studySessions = sqliteTable("study_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  planId: text("plan_id").references(() => studyPlans.id, { onDelete: "set null" }),
  topicId: text("topic_id").references(() => topics.id, { onDelete: "set null" }),
  date: text("date").notNull(), // ISO date
  notes: text("notes"),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

// ── Completions (audit log) ────────────────────────
export const completions = sqliteTable("completions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  planId: text("plan_id")
    .notNull()
    .references(() => studyPlans.id, { onDelete: "cascade" }),
  topicId: text("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
});

// ── Revisions ──────────────────────────────────────
export const revisions = sqliteTable(
  "revisions",
  {
    id: text("id").primaryKey(),
    planId: text("plan_id")
      .notNull()
      .references(() => studyPlans.id, { onDelete: "cascade" }),
    topicId: text("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    originalStudyDate: text("original_study_date"), // when topic was first studied
    scheduledDate: text("scheduled_date").notNull(), // when revision is due
    interval: integer("interval"), // days since original study
    // FSRS memory state columns
    stability: real("stability").notNull().default(0),
    difficulty: real("difficulty").notNull().default(0),
    retrievability: real("retrievability").notNull().default(1.0),
    cardState: text("card_state").notNull().default("new"), // "new" | "learning" | "review" | "relearning"
    elapsedDays: integer("elapsed_days").default(0),
    scheduledDays: integer("scheduled_days").default(0),
    reps: integer("reps").default(0),
    lapses: integer("lapses").default(0),
    rating: text("rating"), // "again" | "hard" | "good" | "easy" — null for initial entries
    lastReviewAt: text("last_review_at"),
    isCompleted: integer("is_completed", { mode: "boolean" }).default(false),
    completedAt: text("completed_at"),
    createdAt: text("created_at").notNull().default(sql`(current_timestamp)`),
  },
  (table) => ({
    planDateIdx: index("idx_revisions_plan_date").on(table.planId, table.scheduledDate),
  })
);
