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
  createdAt: text("created_at").notNull().default("(current_timestamp)"),
  updatedAt: text("updated_at").notNull().default("(current_timestamp)"),
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
  createdAt: text("created_at").notNull().default("(current_timestamp)"),
  updatedAt: text("updated_at").notNull().default("(current_timestamp)"),
});

// ── Topics ─────────────────────────────────────────
export const topics = sqliteTable("topics", {
  id: text("id").primaryKey(),
  subjectId: text("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  estimatedHours: real("estimated_hours").default(1.0),
  status: text("status").default("pending"), // "pending" | "studied" | "revised"
  sortOrder: integer("sort_order").default(0),
  createdAt: text("created_at").notNull().default("(current_timestamp)"),
  updatedAt: text("updated_at").notNull().default("(current_timestamp)"),
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
  hoursPerDay: real("hours_per_day"),
  totalTopics: integer("total_topics").default(0),
  completedTopics: integer("completed_topics").default(0), // denormalized for fast reads
  status: text("status").default("active"), // "active" | "completed" | "paused"
  createdAt: text("created_at").notNull().default("(current_timestamp)"),
  updatedAt: text("updated_at").notNull().default("(current_timestamp)"),
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
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // YYYY-MM-DD
    type: text("type").notNull().default("study"), // "study" | "revision-7d" | "revision-30d"
    estimatedMinutes: integer("estimated_minutes"),
    isCompleted: integer("is_completed", { mode: "boolean" }).default(false),
    completedAt: text("completed_at"),
    createdAt: text("created_at").notNull().default("(current_timestamp)"),
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
  durationMinutes: integer("duration_minutes"),
  date: text("date").notNull(), // ISO date
  notes: text("notes"),
  createdAt: text("created_at").notNull().default("(current_timestamp)"),
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
  createdAt: text("created_at").notNull().default("(current_timestamp)"),
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
    isCompleted: integer("is_completed", { mode: "boolean" }).default(false),
    completedAt: text("completed_at"),
    createdAt: text("created_at").notNull().default("(current_timestamp)"),
  },
  (table) => ({
    planDateIdx: index("idx_revisions_plan_date").on(table.planId, table.scheduledDate),
  })
);
