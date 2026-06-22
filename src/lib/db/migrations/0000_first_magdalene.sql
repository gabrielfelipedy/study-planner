CREATE TABLE `completions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`plan_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`date` text NOT NULL,
	`created_at` text DEFAULT '(current_timestamp)' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`plan_id`) REFERENCES `study_plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `plan_topics` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`sort_order` integer DEFAULT 0,
	FOREIGN KEY (`plan_id`) REFERENCES `study_plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_plan_topic` ON `plan_topics` (`plan_id`,`topic_id`);--> statement-breakpoint
CREATE TABLE `revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`original_study_date` text,
	`scheduled_date` text NOT NULL,
	`interval` integer,
	`is_completed` integer DEFAULT false,
	`completed_at` text,
	`created_at` text DEFAULT '(current_timestamp)' NOT NULL,
	FOREIGN KEY (`plan_id`) REFERENCES `study_plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_revisions_plan_date` ON `revisions` (`plan_id`,`scheduled_date`);--> statement-breakpoint
CREATE TABLE `schedule_slots` (
	`id` text PRIMARY KEY NOT NULL,
	`plan_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`date` text NOT NULL,
	`type` text DEFAULT 'study' NOT NULL,
	`estimated_minutes` integer,
	`is_completed` integer DEFAULT false,
	`completed_at` text,
	`created_at` text DEFAULT '(current_timestamp)' NOT NULL,
	FOREIGN KEY (`plan_id`) REFERENCES `study_plans`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_slots_plan_date` ON `schedule_slots` (`plan_id`,`date`);--> statement-breakpoint
CREATE TABLE `study_plans` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`deadline` text NOT NULL,
	`start_date` text NOT NULL,
	`hours_per_day` real,
	`total_topics` integer DEFAULT 0,
	`completed_topics` integer DEFAULT 0,
	`status` text DEFAULT 'active',
	`created_at` text DEFAULT '(current_timestamp)' NOT NULL,
	`updated_at` text DEFAULT '(current_timestamp)' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `study_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`plan_id` text,
	`topic_id` text,
	`duration_minutes` integer,
	`date` text NOT NULL,
	`notes` text,
	`created_at` text DEFAULT '(current_timestamp)' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`plan_id`) REFERENCES `study_plans`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`difficulty` text,
	`created_at` text DEFAULT '(current_timestamp)' NOT NULL,
	`updated_at` text DEFAULT '(current_timestamp)' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `topics` (
	`id` text PRIMARY KEY NOT NULL,
	`subject_id` text NOT NULL,
	`title` text NOT NULL,
	`estimated_hours` real DEFAULT 1,
	`status` text DEFAULT 'pending',
	`sort_order` integer DEFAULT 0,
	`created_at` text DEFAULT '(current_timestamp)' NOT NULL,
	`updated_at` text DEFAULT '(current_timestamp)' NOT NULL,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text,
	`email_verified` integer DEFAULT false,
	`image` text,
	`created_at` text DEFAULT '(current_timestamp)' NOT NULL,
	`updated_at` text DEFAULT '(current_timestamp)' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);