PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_completions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`plan_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`date` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`plan_id`) REFERENCES `study_plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_completions`("id", "user_id", "plan_id", "topic_id", "date", "created_at") SELECT "id", "user_id", "plan_id", "topic_id", "date", "created_at" FROM `completions`;--> statement-breakpoint
DROP TABLE `completions`;--> statement-breakpoint
ALTER TABLE `__new_completions` RENAME TO `completions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`original_study_date` text,
	`scheduled_date` text NOT NULL,
	`interval` integer,
	`is_completed` integer DEFAULT false,
	`completed_at` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`plan_id`) REFERENCES `study_plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_revisions`("id", "plan_id", "topic_id", "original_study_date", "scheduled_date", "interval", "is_completed", "completed_at", "created_at") SELECT "id", "plan_id", "topic_id", "original_study_date", "scheduled_date", "interval", "is_completed", "completed_at", "created_at" FROM `revisions`;--> statement-breakpoint
DROP TABLE `revisions`;--> statement-breakpoint
ALTER TABLE `__new_revisions` RENAME TO `revisions`;--> statement-breakpoint
CREATE INDEX `idx_revisions_plan_date` ON `revisions` (`plan_id`,`scheduled_date`);--> statement-breakpoint
CREATE TABLE `__new_schedule_slots` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`date` text NOT NULL,
	`type` text DEFAULT 'study' NOT NULL,
	`estimated_minutes` integer,
	`is_completed` integer DEFAULT false,
	`completed_at` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`plan_id`) REFERENCES `study_plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_schedule_slots`("id", "plan_id", "topic_id", "date", "type", "estimated_minutes", "is_completed", "completed_at", "created_at") SELECT "id", "plan_id", "topic_id", "date", "type", "estimated_minutes", "is_completed", "completed_at", "created_at" FROM `schedule_slots`;--> statement-breakpoint
DROP TABLE `schedule_slots`;--> statement-breakpoint
ALTER TABLE `__new_schedule_slots` RENAME TO `schedule_slots`;--> statement-breakpoint
CREATE INDEX `idx_slots_plan_date` ON `schedule_slots` (`plan_id`,`date`);--> statement-breakpoint
CREATE TABLE `__new_study_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`deadline` text NOT NULL,
	`start_date` text NOT NULL,
	`hours_per_day` real,
	`total_topics` integer DEFAULT 0,
	`completed_topics` integer DEFAULT 0,
	`status` text DEFAULT 'active',
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_study_plans`("id", "user_id", "title", "deadline", "start_date", "hours_per_day", "total_topics", "completed_topics", "status", "created_at", "updated_at") SELECT "id", "user_id", "title", "deadline", "start_date", "hours_per_day", "total_topics", "completed_topics", "status", "created_at", "updated_at" FROM `study_plans`;--> statement-breakpoint
DROP TABLE `study_plans`;--> statement-breakpoint
ALTER TABLE `__new_study_plans` RENAME TO `study_plans`;--> statement-breakpoint
CREATE TABLE `__new_study_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`plan_id` text,
	`topic_id` text,
	`duration_minutes` integer,
	`date` text NOT NULL,
	`notes` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`plan_id`) REFERENCES `study_plans`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_study_sessions`("id", "user_id", "plan_id", "topic_id", "duration_minutes", "date", "notes", "created_at") SELECT "id", "user_id", "plan_id", "topic_id", "duration_minutes", "date", "notes", "created_at" FROM `study_sessions`;--> statement-breakpoint
DROP TABLE `study_sessions`;--> statement-breakpoint
ALTER TABLE `__new_study_sessions` RENAME TO `study_sessions`;--> statement-breakpoint
CREATE TABLE `__new_subjects` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`difficulty` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_subjects`("id", "user_id", "name", "color", "difficulty", "created_at", "updated_at") SELECT "id", "user_id", "name", "color", "difficulty", "created_at", "updated_at" FROM `subjects`;--> statement-breakpoint
DROP TABLE `subjects`;--> statement-breakpoint
ALTER TABLE `__new_subjects` RENAME TO `subjects`;--> statement-breakpoint
CREATE TABLE `__new_topics` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_id` text NOT NULL,
	`title` text NOT NULL,
	`estimated_hours` real DEFAULT 1,
	`status` text DEFAULT 'pending',
	`sort_order` integer DEFAULT 0,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_topics`("id", "subject_id", "title", "estimated_hours", "status", "sort_order", "created_at", "updated_at") SELECT "id", "subject_id", "title", "estimated_hours", "status", "sort_order", "created_at", "updated_at" FROM `topics`;--> statement-breakpoint
DROP TABLE `topics`;--> statement-breakpoint
ALTER TABLE `__new_topics` RENAME TO `topics`;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`email_verified` integer DEFAULT false,
	`image` text,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "email", "name", "email_verified", "image", "created_at", "updated_at") SELECT "id", "email", "name", "email_verified", "image", "created_at", "updated_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);